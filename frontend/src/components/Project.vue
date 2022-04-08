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
                <q-item clickable v-close-popup>
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
          v-model="project.notes"
          :sort-mode="sortMode"
          :sort="sort"
          :select="select"
          :done="done"
          :keep="keep"
        />
      </div>
    </q-scroll-area>
    <q-footer class="fixed-bottom footer">
      <q-toolbar>
        <q-btn icon="add" @click="addNote" />
      </q-toolbar>
    </q-footer>
  </q-page>
</template>

<script>
import { defineComponent } from "vue";
import List from "src/components/list/List.vue";
const CREATE_NOTE = require("src/gql/mutations/CreateNote.gql");
const CHECK_PROJECT = require("src/gql/mutations/CheckProject.gql");
const TRASH_PROJECT = require("src/gql/mutations/TrashProject.gql");
import { toDatabaseString, today } from "src/common/date.js";
import { loading } from "src/common/system.js";

export default defineComponent({
  name: "PageIndex",
  components: {
    List,
  },
  data() {
    return {
      project: JSON.parse(JSON.stringify(this.modelValue)),
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
    sortMode: {
      type: String,
      required: false,
      default: "",
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
    }
  },
  watch: {
    modelValue: {
      handler(value) {
        this.project = JSON.parse(JSON.stringify(value));
      },
      deep: true,
    },
  },
  computed: {
    maxPosition() {
      const positions = this.project.notes.map(
        (note) => note[this.positionColumn]
      );
      console.log("maxPosition", this.project.notes, positions);
      return positions.length ? Math.max(...positions) : 0;
    },
    user() {
      return this.$store.state.user;
    },
    projects() {
      return this.user.projects;
    },
    positionColumn() {
      return this.sortMode ? `${this.sortMode}_position` : "position";
    },
  },
  methods: {
    trashProject() {
      this.$apollo
        .mutate({
          mutation: TRASH_PROJECT,
          variables: {
            id: this.project.id,
          },
        })
        .then((resp) => this.nextProject());
    },
    nextProject() {
      const projects = [...this.projects];
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
      console.log("projects", this.projects);
      if (this.timeout) clearTimeout(this.timeout);
      this.timeout = setTimeout(() => {
        console.log("project.done", this.project.done);
        this.$apollo
          .mutate({
            mutation: CHECK_PROJECT,
            variables: {
              id: this.project.id,
              done: this.project.done,
              completed_at: this.project.done
                ? toDatabaseString(today())
                : null,
            },
          })
          .finally(() => loading(false));
        if (this.project.done) {
          this.nextProject();
        } else {
          this.$store.commit("user/updateCurrentProject", this.project);
        }
      }, 500);
    },
    addNote() {
      console.log("hallo?????", this.positionColumn);
      this.$apollo
        .mutate({
          mutation: CREATE_NOTE,
          variables: {
            user_id: this.user.id,
            [this.positionColumn]: this.maxPosition + 1,
            project_id: this.project.id,
            deadline: this.deadline ? toDatabaseString(this.deadline) : null,
          },
        })
        .then((result) => {
          this.project.notes.push(result.data.note);
        });
    },
  },
});
</script>
