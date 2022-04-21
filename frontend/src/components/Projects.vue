<template>
  <q-page>
    <q-scroll-area class="fill-window" id="scrollArea">
      <div class="q-pa-md container">
        <h4>
          <q-icon :name="icon" />
          {{ title }}
        </h4>
        <list
          v-if="notes"
          @select="setFocusNote"
          @edit="setEditNote"
          :select="false"
          :position-column="positionColumn"
          group="people"
          :notes="notes"
          :date-preview="false"
          sort
          :focused="focusNote"
          :edited="editNote"
        />
        <div
          v-for="project in projects"
          :key="project.id"
          style="margin-top: 50px"
        >
          <span class="project-title"
            ><q-icon :name="project.icon" /> {{ project.title }}
          </span>
          <hr class="project-title-seperator" />
          <list
            @select="setFocusNote"
            @edit="setEditNote"
            :project="project"
            :select="false"
            :position-column="positionColumn"
            group="people"
            :notes="project.notes"
            :date-preview="false"
            sort
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
      projectsCopy: [],
      notes: [],
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
    document.addEventListener("click", this.resetFocusedNote);
    document.addEventListener("keydown", this.onKeydown);
    const notes = [...this.notes];
    this.projectsCopy.forEach((p) => notes.push(...p.notes));
    console.log('emit sort');
    bus.emit(
      "sort",
      notes.sort((a, b) => a[this.positionColumn] - b[this.positionColumn])
    );
  },
  unmounted() {
    document.removeEventListener("click", this.resetFocusedNote);
    document.removeEventListener("keydown", this.onKeydown);
  },
  methods: {
    appendNote(note) {
      const project = this.selectedProject;
      if (project) {
        const index = this.projectsCopy.findIndex((p) => p.id == project.id);
        let p = JSON.parse(JSON.stringify(this.projects[index]));
        p.notes.push(note);
        this.projectsCopy[index] = p;
      } else {
        this.notes = [...this.notes, note];
      }
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
      const projectIndex = this.projects.indexOf(project);
      const notes = project ? project.notes : this.notes;
      const index = notes.findIndex((n) => n.id == note.id);

      notes.splice(index, 1);
      let next;
      if (project) {
        project.notes = [...notes];
        next = project.notes[index];
        if (!next) {
          next = project.notes[project.notes.length - 1];
        }
        if (!next) {
          const nextProject = this.getNextProject(projectIndex + 1);
          if (nextProject) {
            next = nextProject.notes[0];
          } else {
            const prevProject = this.getPrevProject(projectIndex - 1);
            if (prevProject) {
              next = prevProject.notes[prevProject.notes.length - 1];
            } else {
              next = this.notes[this.notes.length - 1];
            }
          }
        }
      } else {
        this.notes = [...notes];
        next = this.notes[index];
        if (!next) {
          next = this.notes[this.notes.length - 1];
        }
        if (!next) {
          const nextProject = this.getNextProject(0);
          if (nextProject) {
            next = nextProject.notes[0];
          }
        }
      }
      this.focusNote = next;
    },
    trashNote() {
      const note = this.focusNote;
      this.removeNote(note);
      note.deleted = true;
      note.deleted_at = new Date();
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
    setEditNote(note) {
      this.editNote = note;
    },
    getNextProject(project_index) {
      if (this.projects.length == 0) return;
      let nextProject = this.projects[project_index];
      if (!nextProject) {
        if (this.notes.length > 0) {
          return null;
        } else {
          nextProject = this.projects[0];
        }
      }
      if (nextProject.notes) {
        return nextProject;
      } else {
        return this.selectNextNote(project_index + 1);
      }
    },
    getPrevProject(project_index) {
      if (this.projects.length == 0) return;
      let prevProject = this.projects[project_index];
      if (!prevProject) {
        if (this.notes.length > 0) {
          return null;
        } else {
          prevProject = this.projects[this.projects.length - 1];
        }
      }
      if (prevProject.notes) {
        return prevProject;
      } else {
        this.getPrevProject(project_index - 1);
      }
    },
    selectionDown() {
      if (this.focusNote) {
        const project = this.selectedProject;
        console.log("project", project);
        const notes = project ? project.notes : this.notes;
        const index = notes.findIndex((note) => note.id == this.focusNote.id);
        let next = notes[index + 1];
        if (next) {
          this.focusNote = next;
        } else {
          const nextProject = this.getNextProject(
            project ? this.projects.indexOf(project) + 1 : 0
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
        const project = this.selectedProject;
        const notes = project ? project.notes : this.notes;
        const index = notes.findIndex((note) => note.id == this.focusNote.id);
        let next = notes[index - 1];
        if (next) {
          this.focusNote = next;
        } else if (project) {
          const prevProject = this.getPrevProject(
            project
              ? this.projects.indexOf(project) - 1
              : this.projects.length - 1
          );
          if (prevProject) {
            next = prevProject.notes[prevProject.notes.length - 1];
          } else {
            next = this.notes[this.notes.length - 1];
          }
          this.focusNote = next;
        }
      }
    },
    updateCache() {
      if (!this.config?.query) return;
      const apolloClient = this.$apollo.provider.defaultClient;
      apolloClient.writeQuery({
        query: this.config?.query,
        data: {
          active_notes: this.notes,
          notes_project: this.projectsCopy,
        },
        variables: this.config?.variables,
      });
    },
  },
  computed: {
    projects() {
      return this.projectsCopy.filter((p) => p.notes.length);
    },
    user() {
      return this.$store.state.user;
    },
    selectedProject() {
      const project = this.focusNote
        ? this.focusNote.project
        : this.editNote
        ? this.editNote.project
        : this.start;
      return project ? this.projects.find((p) => p.id == project.id) : null;
    },
    newNote() {
      const project = this.selectedProject;
      const notes = project ? project.notes : this.notes;
      const positions = notes.map((it) => it[this.positionColumn]);
      const maxPosition = positions.length ? Math.max(...positions) : 0;
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
        project_id: project ? project.id : null,
        [this.positionColumn]: maxPosition + 1,
        project: project,
        when: null,
      };
    },
  },
  apollo: {
    active_notes: {
      query() {
        return this.config?.query;
      },
      fetchPolicy: "cache-first",
      variables() {
        return this.config?.variables;
      },
      skip() {
        return !this.config?.query || !this.user.id;
      },
      result({ data }) {
        console.log("result", data);
        this.notes = data.active_notes
          ? JSON.parse(JSON.stringify(data.active_notes))
          : [];
        this.projectsCopy = data.notes_project
          ? JSON.parse(JSON.stringify(data.notes_project))
          : [];
        this.$apollo.skipAllQueries = true;
      },
    },
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
          this.projectsCopy = JSON.parse(JSON.stringify(data.notes_project));
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