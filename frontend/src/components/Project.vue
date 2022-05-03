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
          v-if="cache"
          @select="setSelectedItems"
          @edit="setEdit"
          :position-column="positionColumn"
          :sort="sort"
          :done="done"
          :keep="keep"
          :items="cache"
          :selected="selectedItems"
          :edited="edit"
          @mounted="listComponentMounted"
        />
      </div>
    </q-scroll-area>
    <q-footer class="fixed-bottom footer">
      <q-toolbar>
        <slot name="toolbar" v-bind="{ addNote, revert, deleteAll }" />
      </q-toolbar>
    </q-footer>
  </q-page>
</template>

<script>
const CHECK_PROJECT = require("src/gql/mutations/CheckProject.gql");
const TRASH_PROJECT = require("src/gql/mutations/TrashProject.gql");
import { toDatabaseString, today } from "src/common/date.js";
import { uuidv4 } from "src/common/utils.js";
import Base from "src/components/Base.vue";

export default {
  name: "ProjectComponent",
  extends: Base,
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
    more: {
      type: Boolean,
      required: false,
      default: false,
    },
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
      const positions = this.cache.map((note) => note[this.positionColumn]);
      console.log("positions", this.cache, positions, this.positionColumn);
      return positions.length ? Math.max(...positions) : 0;
    },
    cache() {
      const cache = this.$store.state.cache[this.modelValue.id];
      console.log("CACHE", cache);
      return cache
        ? [...cache.notes, ...cache.projects].sort(this.sortMethod)
        : [];
    },
    currentProject() {
      return this.$store.getters["user/getCurrentProject"];
    },
  },
  methods: {
    newNote() {
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
        project_id: this.project.default ? null : this.project.id,
        project: this.project.default ? null : this.project,
        when: this.when ? toDatabaseString(this.when) : null,
      };
    },
    removeItem(item) {
      let next;
      const index = this.cache.findIndex(
        (it) => it.id == item.id && it.__typename == item.__typename
      );

      this.$updateCache(item);

      this.$nextTick(() => {
        // console.log(this.cache);
        next = this.cache[index];
        if (!next) {
          const length = this.cache.length;
          next = this.cache[length - 1];
        }
        this.setSelectedItem(next);
      });
    },
    deleteAll() {
      e.stopPropagation();
      // const itemsToTrash = { notes: [], projects: [] };
      const itemsToDelete = { notes: [], projects: [] };
      this.cache.forEach((item) => {
        if (item.deleted) {
          if (item.__typename.includes("_note")) {
            itemsToDelete.notes.push(item);
          } else {
            itemsToDelete.projects.push(item);
          }
        }
      });
      if (itemsToDelete.notes.length) {
        this.$mutateQueue({
          mutation: DELETE_NOTES,
          variables: {
            ids: itemsToDelete.notes.map((note) => note.id),
          },
        });
      }
      if (itemsToDelete.projects.length) {
        this.$mutateQueue({
          mutation: DELETE_PROJECTS,
          variables: {
            ids: itemsToDelete.projects.map((note) => note.id),
          },
        });
      }
      this.$store.commit("cache/update", {
        key: this.modelValue.id,
        items: [],
      });
    },
    selectionDown() {
      const index = this.cache.findIndex(
        (it) =>
          it.id == this.selectedItem.id &&
          it.__typename == this.selectedItem.__typename
      );
      const next = this.cache[index + 1];
      if (next) this.setSelectedItem(next);
    },
    selectionUp() {
      const index = this.cache.findIndex(
        (it) =>
          it.id == this.selectedItem.id &&
          it.__typename == this.selectedItem.__typename
      );
      const next = this.cache[index - 1];
      if (next) this.setSelectedItem(next);
    },
    sortMethod(a, b) {
      if (a[this.sortBy.column] === null) return 1;
      if (b[this.sortBy.column] === null) return -1;
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
    trashProject() {
      this.$mutateQueue({
        mutation: TRASH_PROJECT,
        variables: {
          id: this.project.id,
          deleted_at: new Date(),
        },
      }).then((resp) => this.nextProject());
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
      this.$loading(true);
      console.log("projects", this.user.projects);
      if (this.timeout) clearTimeout(this.timeout);
      this.timeout = setTimeout(() => {
        console.log("project.done", this.project.done);

        this.project.completed_at = this.project.done
          ? toDatabaseString(today())
          : null;
        this.$mutateQueue({
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
    updateCache() {
      if (!this.project.default || (this.notes && this.projects)) {
        console.log("update cache", this.notes, this.projects);
        this.$store.commit("cache/update", {
          key: this.modelValue.id,
          notes: this.notes,
          projects: this.projects,
        });
        this.projects = null;
        this.notes = null;
      }
    },
  },
};
</script>
