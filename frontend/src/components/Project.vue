<template>
  <q-page>
    <q-scroll-area class="fill-window">
      <div v-if="project" class="q-pa-md container">
        <h4>
          <q-icon v-if="project.default" :name="project.icon" />
          <q-checkbox
            v-else
            v-model="project.done"
            size="lg"
            color="orange"
            checked-icon="radio_button_checked"
            :unchecked-icon="project.icon"
            indeterminate-icon="help"
            @update:modelValue="checkProject"
          />
          {{ project.title ? project.title : "New Project" }}
          <q-btn icon="more_vert" class="float-right" v-if="more">
            <q-menu v-model="moreShowing">
              <q-list style="min-width: 100px">
                <q-item clickable v-close-popup @click="trashProject">
                  <q-item-section avatar>
                    <q-icon name="delete" />
                  </q-item-section>

                  <q-item-section>
                    <q-item-label> Delete </q-item-label>
                  </q-item-section>
                </q-item>
                <q-item
                  clickable
                  v-close-popup
                  @click="
                    project.done = true;
                    checkProject();
                  "
                >
                  <q-item-section avatar>
                    <q-icon name="done" />
                  </q-item-section>

                  <q-item-section>
                    <q-item-label> Check </q-item-label>
                  </q-item-section>
                </q-item>
                <q-separator />
                <q-item clickable v-close-popup>
                  <q-item-section avatar>
                    <q-icon name="share" />
                  </q-item-section>

                  <q-item-section>
                    <q-item-label> Share </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </h4>

        <list
          :position-column="positionColumn"
          :sort="sort"
          :select="select"
          :done="done"
          :keep="keep"
          :config="config"
          :notes="notes"
          :projects="projects"
          :sortMethod="sortMethod"
        />
      </div>
    </q-scroll-area>
    <q-footer class="fixed-bottom footer">
      <q-toolbar>
        <slot name="toolbar" v-bind="{ addNote, revert }" />
      </q-toolbar>
    </q-footer>
  </q-page>
</template>

<script>
import { defineComponent } from "vue";
import List from "src/components/list/List.vue";
import { bus } from "src/components/list/List.vue";
const CREATE_NOTE = require("src/gql/mutations/CreateNote.gql");
const CHECK_PROJECT = require("src/gql/mutations/CheckProject.gql");
const TRASH_PROJECT = require("src/gql/mutations/TrashProject.gql");
import { toDatabaseString, today } from "src/common/date.js";
import { loading } from "src/common/system.js";
import { getQueries } from "src/common/queries";
import { uuidv4 } from "src/common/utils.js";

export default defineComponent({
  name: "PageIndex",
  components: {
    List,
  },
  data() {
    const project = JSON.parse(JSON.stringify(this.modelValue));
    return {
      project: project,
      projects: [],
      notes: project.notes ? project.notes : [],
      timeout: null,
      moreShowing: false,
    };
  },
  props: {
    modelValue: {
      type: Object,
      required: true,
    },
    deadline: {
      type: Object,
      required: false,
      default: null,
    },
    positionColumn: {
      type: String,
      required: false,
    },
    sortBy: {
      type: Object,
      required: false,
      default(props) {
        return {
          column: props.positionColumn,
          date: false,
        };
      },
    },
    select: {
      type: Boolean,
      required: false,
      default: true,
    },
    sort: {
      type: Boolean,
      required: false,
      default: true,
    },
    done: {
      type: Boolean,
      required: false,
      default: true,
    },
    keep: {
      type: Boolean,
      required: false,
      default: false,
    },
    more: {
      type: Boolean,
      required: false,
      default: false,
    },
    config: {
      type: Object,
      required: true,
    },
  },
  watch: {
    modelValue: {
      handler(value) {
        this.project = JSON.parse(JSON.stringify(value));
        this.notes = this.project.notes;
      },
      deep: true,
    },
    config: {
      handler() {
        this.$apollo.skipAllQueries = false;
      },
      deep: true,
    },
  },
  computed: {
    maxPosition() {
      const positions = (this.project.notes || this.notes).map(
        (note) => note[this.positionColumn]
      );
      return positions.length ? Math.max(...positions) : 0;
    },
    user() {
      return this.$store.state.user;
    },
    currentProject() {
      return this.$store.getters["user/getCurrentProject"];
    },
    newNote(){
      return {
        __typename: "active_notes",
        id: uuidv4(),
        title: "",
        content: "",
        done: false,
        deleted: false,
        user_id: this.user.id,
        upcoming_position: null,
        today_position: null,
        someday_position: null,
        anytime_position: null,
        [this.positionColumn]: this.maxPosition + 1,
        project_id: this.project.id || null,
        deadline: this.deadline ? toDatabaseString(this.deadline) : null,
      };
    }
  },
  methods: {
    mutateQueue(mutation) {
      loading(true);
      let p = this.$apollo.mutate(mutation);
      p.finally(() => loading(false));
      getQueries(mutation.variables).forEach((query) => {
        console.log("mutateQueue query", query);
        this.$addToCache(mutation.variables, query);
      });
      return p;
    },
    sortMethod(a, b) {
      if (this.sortBy.date) {
        return this.sortBy.desc
          ? new Date(b[this.sortBy.column]) - new Date(a[this.sortBy.column])
          : new Date(a[this.sortBy.column]) - new Date(b[this.sortBy.column]);
      } else {
        return this.sortBy.desc
          ? b[this.sortBy.column] - a[this.sortBy.column]
          : a[this.sortBy.column] - b[this.sortBy.column];
      }
    },
    revert(e) {
      // e.preventDefault();
      e.stopPropagation();
      console.log("revert");
      bus.emit("revert");
    },
    trashProject() {
      this.$apollo
        .mutate({
          mutation: TRASH_PROJECT,
          variables: {
            id: this.project.id,
            deleted_at: new Date(),
          },
        })
        .then((resp) => this.nextProject());
    },
    nextProject() {
      const projects = [...this.user.projects];
      const index = projects.findIndex((p) => p.id == this.project.id);
      projects.splice(index, 1);
      let next = projects[index];
      if (!next) {
        next = projects[projects.length - 1] || null;
      }
      console.log("next project", projects, next);
      this.$store.commit("user/updateCurrentProject", next);
      this.$store.commit("user/updateProjects", projects);
      if (!next) {
        this.project = null;
      }
    },
    checkProject() {
      loading(true);
      console.log("projects", this.user.projects);
      if (this.timeout) clearTimeout(this.timeout);
      this.timeout = setTimeout(() => {
        console.log("project.done", this.project.done);

        this.project.completed_at = this.project.done
          ? toDatabaseString(today())
          : null;
        this.mutateQueue({
          mutation: CHECK_PROJECT,
          variables: this.project,
        });
        if (this.project.done) {
          this.nextProject();
        } else {
          this.$store.commit("user/updateCurrentProject", this.project);
        }
      }, 500);
    },
    addNote() {
      const note = this.newNote;
      if (this.$route.name == "project" && this.currentProject) {
        note.project = this.currentProject;
      }

      this.notes = [...this.notes, note];

      this.$apollo
        .mutate({
          mutation: CREATE_NOTE,
          variables: note,
        })
        .then(() => this.updateCache());
    },
    updateCache() {
      if (!this.config.query) return;
      const apolloClient = this.$apollo.provider.defaultClient;
      apolloClient.writeQuery({
        query: this.config.query,
        data: {
          active_notes: this.notes,
          notes_project: this.projects,
        },
        variables: this.config.variables,
      });
    },
  },
  apollo: {
    active_notes: {
      query() {
        return this.config.query;
      },
      fetchPolicy: "cache-first",
      variables() {
        return this.config.variables;
      },
      skip() {
        return !this.user.id;
      },
      result({ data }) {
        console.log("result", data);
        this.notes = data.active_notes
          ? JSON.parse(JSON.stringify(data.active_notes))
          : [];
        this.projects = data.notes_project
          ? JSON.parse(JSON.stringify(data.notes_project))
          : [];
        this.$apollo.skipAllQueries = true;
      },
    },
    $subscribe: {
      active_notes: {
        query() {
          return this.config.notes_subscription;
        },
        variables() {
          return this.config.variables;
        },
        skip() {
          return (
            !this.config.notes_subscription ||
            !this.user.id ||
            this.user.loading
          );
        },
        result({ data }) {
          console.log("note sub", data);
          this.notes = JSON.parse(JSON.stringify(data.active_notes));
          this.updateCache();
        },
      },
      notes_project: {
        query() {
          return this.config.projects_subscription;
        },
        variables() {
          return this.config.variables;
        },
        skip() {
          return (
            !this.config.projects_subscription ||
            !this.user.id ||
            this.user.loading
          );
        },
        result({ data }) {
          console.log("project sub", data);
          this.projects = JSON.parse(JSON.stringify(data.notes_project));
          this.updateCache();
        },
      },
    },
  },
});
</script>
