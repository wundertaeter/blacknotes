<template>
  <q-page>
    <q-scroll-area class="fill-window" id="scrollArea">
      <div class="q-pa-md container">
        <h4>
          <q-icon :name="icon" />
          {{ title }}
        </h4>
        <div
          v-for="project in cache"
          :key="project.id"
          style="margin-top: 50px"
        >
          <div v-if="project.title">
            <span class="project-title"
              ><q-icon :name="project.icon" /> {{ project.title }}
            </span>
            <hr class="project-title-seperator" />
          </div>
          <list
            v-if="project.notes"
            :id="project.title"
            @select="setFocusNote"
            @edit="setEditNote"
            @add="(e) => addEvent(e, project)"
            xxremove="(e) => removeEvent(e, project)"
            :project="project"
            :select="false"
            :position-column="positionColumn"
            :sortMethod="sortMethod"
            group="people"
            :items="project.notes"
            :focused="focusNote"
            :edited="editNote"
          />
        </div>
      </div>
    </q-scroll-area>
    <q-footer class="fixed-bottom footer">
      <q-toolbar>
        <slot name="toolbar" v-bind:addNote="addNote" />
      </q-toolbar>
    </q-footer>
  </q-page>
</template>

<script>
import { defineComponent } from "vue";
const CREATE_NOTE = require("src/gql/mutations/CreateNote.gql");
const TRASH_NOTE = require("src/gql/mutations/TrashNote.gql");
import List from "src/components/list/List.vue";
import { bus } from "src/components/list/List.vue";
import { uuidv4 } from "src/common/utils.js";

export default defineComponent({
  name: "PageIndex",
  components: {
    //Project,
    List,
  },
  data() {
    return {
      projects: null,
      notes: null,
      whens: [],
      watchers: [],
      focusNote: null,
      editNote: null,
      loading: false,
      dates: [],
    };
  },
  props: {
    drop: {
      type: Boolean,
      required: false,
      default: false,
    },
    sort: {
      type: Boolean,
      required: false,
      default: false,
    },
    title: {
      type: String,
      required: true,
    },
    id: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      required: true,
    },
    positionColumn: {
      type: String,
      required: true,
    },
    config: {
      type: Object,
      required: false,
    },
  },
  mounted() {
    bus.emit('sort');
    document.addEventListener("click", this.resetFocusedNote);
    document.addEventListener("keydown", this.onKeydown);
  },
  unmounted() {
    document.removeEventListener("click", this.resetFocusedNote);
    document.removeEventListener("keydown", this.onKeydown);
  },
  methods: {
    addEvent(e, project) {
      for (const p of this.cache) {
        let item = p.notes.find((item) => item.id == e.item.id);
        if (item) {
          item = { ...item, project, project_id: project.id   };
          if (item.project.title) {
            this.$store.commit("cache/remove", {
              key: item.project.title,
              item,
            });
          }
          if (project.title) {
            this.$store.commit("cache/add", {
              key: project.title,
              item,
            });
          }
          this.updateFocusNote(item);
          return;
        }
      }
    },
    sortMethod(a, b) {
      if (a[this.positionColumn] === null) return 1;
      if (b[this.positionColumn] === null) return -1;
      return a[this.positionColumn] - b[this.positionColumn];
    },
    appendNote(note) {
      this.$updateCache(note);
      this.$nextTick(() => {
        this.editNote = note;
        this.focusNote = note;
        this.$nextTick(() => {
          bus.emit("scrollTo", { item: note, top: true });
        });
      });
    },
    addNote(e) {
      e.stopPropagation();
      // console.log('this.editNote', this.editNote);
      if (this.editNote) return;
      const note = this.newNote;
      this.appendNote(note);

      this.$mutateQueue({
        mutation: CREATE_NOTE,
        variables: note,
      });
    },
    onKeydown(e) {
      // console.log("onKeydown", e.keyCode, this.editNote, this.focusNote);
      if (!this.editNote && this.focusNote) {
        if (e.keyCode === 8) {
          this.trashNote();
        } else if (e.keyCode == 38) {
          e.preventDefault();
          this.selectionUp();
          bus.emit("scrollTo", this.focusNote);
        } else if (e.keyCode == 40) {
          e.preventDefault();
          this.selectionDown();
          bus.emit("scrollTo", this.focusNote);
        }
      }
    },
    removeNote(note) {
      const project = this.selectedProject;
      const projectIndex = this.cache.indexOf(project);
      const index = project.notes.findIndex((n) => n.id == note.id);

      this.$updateCache(note);

      this.$nextTick(() => {
        const project = this.cache[projectIndex];
        let next;
        if(project){
          next = project.notes[index];
          if (!next) {
            next = project.notes[project.notes.length - 1];
          }
        }
        if (!next) {
          const nextProject = this.getNextProject(projectIndex + 1);
          if (nextProject) {
            next = nextProject.notes[0];
          } else {
            const prevProject = this.getPrevProject(projectIndex - 1);
            if (prevProject) {
              next = prevProject.notes[prevProject.notes.length - 1];
            }
          }
        }
        this.focusNote = next;
      });
    },
    trashNote() {
      const note = { ...this.focusNote };
      note.deleted = true;
      note.deleted_at = new Date();
      this.removeNote(note);
      this.$mutateQueue({
        mutation: TRASH_NOTE,
        variables: note,
      });
    },
    resetFocusedNote() {
      console.log("resetFocusedNote");
      bus.emit("resetFocus");
    },
    setFocusNote(note) {
      this.focusNote = note;
    },
    updateFocusNote(item) {
      if(item.id == this.focusNote.id){
        this.focusNote = item;
      }
    },  
    setEditNote(note) {
      this.editNote = note;
    },
    getNextProject(project_index) {
      if (this.cache.length == 0) return;
      let nextProject = this.cache[project_index];
      if (!nextProject) {
        return null;
      }
      if (nextProject.notes) {
        return nextProject;
      } else {
        return this.getNextProject(project_index + 1);
      }
    },
    getPrevProject(project_index) {
      if (this.cache.length == 0) return;
      let prevProject = this.cache[project_index];
      if (!prevProject) {
        return null;
      }
      if (prevProject.notes) {
        return prevProject;
      } else {
        this.getPrevProject(project_index - 1);
      }
    },
    selectionDown() {
      if (this.focusNote) {
        const index = this.selectedProject.notes.findIndex(
          (note) => note.id == this.focusNote.id
        );
        let next = this.selectedProject.notes[index + 1];
        if (next) {
          this.focusNote = next;
        } else {
          const nextProject = this.getNextProject(
            this.cache.indexOf(this.selectedProject) + 1
          );
          if (nextProject) {
            next = nextProject.notes[0];
            this.focusNote = next;
          }
        }
      }
    },
    selectionUp() {
      if (this.focusNote) {
        const index = this.selectedProject.notes.findIndex(
          (note) => note.id == this.focusNote.id
        );
        let next = this.selectedProject.notes[index - 1];
        if (next) {
          this.focusNote = next;
        } else {
          const prevProject = this.getPrevProject(
            this.cache.indexOf(this.selectedProject) - 1
          );
          if (prevProject) {
            next = prevProject.notes[prevProject.notes.length - 1];
            this.focusNote = next;
          }
        }
      }
    },
    updateCache() {
      if (this.notes && this.projects) {
        this.$store.commit("cache/update", {
          key: this.id,
          projects: [
            {
              notes: this.notes.map((n) => ({
                ...n,
                project: { title: null, id: null },
              })),
            },
            ...this.projects.filter((p) => !!p.notes.length),
          ],
        });
        this.projects = null;
        this.notes = null;
      }
    },
  },
  computed: {
    cache() {
      return this.$store.state.cache[this.id]?.projects.filter(p => p.notes.length);
    },
    user() {
      return this.$store.state.user;
    },
    selectedProject() {
      const selected = this.focusNote ? this.focusNote : this.editNote;
      let project;
      if (selected) {
        project = this.cache.find((project) =>
          project.notes.some((note) => note.id == selected.id)
        );
      }
      return project || this.cache[0];
    },
    maxPosition() {
      const positions = this.selectedProject.notes.map(
        (it) => it[this.positionColumn]
      );
      return positions.length ? Math.max(...positions) : 0;
    },
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
        project_id: this.selectedProject.id,
        [this.positionColumn]: this.maxPosition + 1,
        project: this.selectedProject.id ? this.selectedProject : null,
        when: null,
      };
    },
  },
  apollo: {
    $subscribe: {
      active_notes: {
        query() {
          return this.config?.notes_subscription;
        },
        variables() {
          return this.config?.variables;
        },
        skip() {
          return (
            !this.config?.notes_subscription ||
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
          return this.config?.projects_subscription;
        },
        variables() {
          return this.config?.variables;
        },
        skip() {
          return (
            !this.config?.projects_subscription ||
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
<style lang="scss" scoped>
.project-title {
  font-size: 150%;
}
.project-title-seperator {
  margin-top: 10px;
  margin-bottom: 15px;
}
</style>