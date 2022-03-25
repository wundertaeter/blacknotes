<template>
  <q-page>
    <q-scroll-area class="fill-window" @click="resetfocuseNote">
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
            @update:modelValue="checkProject(project)"
          />
          {{ project.name ? project.name : "New Project" }}
        </h4>

        <draggable v-model="project.notes" @end="updatePositions" item-key="id">
          <template #item="{ element }">
            <note
              @click.stop="setFocusNote(element)"
              :focused="focuseNote && focuseNote.id == element.id"
              class="note"
              v-model="project.notes[project.notes.indexOf(element)]"
              @update:modelValue="updateNote"
              @check="checkNote"
              @edit="setEditNote"
            />
          </template>
        </draggable>
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
import Note from "src/components/Note.vue";
import draggable from "vuedraggable";
const CREATE_NOTE = require("src/gql/mutations/CreateNote.gql");
const PROJECT_TO_TRASH = require("src/gql/mutations/ProjectToTrash.gql");
const CHECK_PROJECT = require("src/gql/mutations/CheckProject.gql");
const UPDATE_NOTE = require("src/gql/mutations/UpdateNote.gql");
const SORT_NOTES = require("src/gql/mutations/SortNotes.gql");
const TRASH_NOTE = require("src/gql/mutations/TrashNote.gql");
const DELETE_NOTE = require("src/gql/mutations/DeleteNoteByPk.gql");
const GET_PROJECT = require("src/gql/queries/GetProject.gql");
const CHECK_NOTE = require("src/gql/mutations/CheckNote.gql");

export default defineComponent({
  name: "PageIndex",
  components: {
    Note,
    draggable,
  },
  mounted() {
    document.addEventListener("keydown", this.onKeydown);
  },
  unmounted() {
    document.removeEventListener("keydown", this.onKeydown);
  },
  data() {
    return {
      project: JSON.parse(JSON.stringify(this.modelValue)),
      updateId: null,
      trashNoteTimeout: null,
      focuseNote: null,
      loading: false,
      promiseQueue: [],
      editNote: null,
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
    }
  },
  watch: {
    modelValue: {
      handler(value) {
        console.log("update", this.loading, this.promiseQueue);
        Promise.all(this.promiseQueue).finally(() => {
          this.promiseQueue = [];
          this.loading = false;
        });
        if (!this.loading) {
          this.project = JSON.parse(JSON.stringify(value));
        }
      },
      deep: true,
    },
    focuseNote: {
      handler(value) {
        this.$emit("select", value);
      },
    },
  },
  methods: {
    setEditNote(note) {
      this.editNote = note;
    },
    addNote() {
      this.mutateQueue({
        mutation: CREATE_NOTE,
        variables: {
          user_id: this.$store.state.user.id,
          position: this.project.notes.length + 1,
          project_id: this.project.id,
          deadline: this.deadline
        },
      }).then((result) => {
        this.project.notes.push(result.data.note);
      });
    },
    onKeydown(e) {
      if (!this.editNote) {
        if (e.keyCode === 8 && this.focuseNote) {
          this.trashNote();
        } else if (e.keyCode == 38) {
          this.selectionUp();
        } else if (e.keyCode == 40) {
          this.selectionDown();
        }
      }
    },
    mutateQueue(mutation) {
      this.loading = true;
      let p = this.$apollo.mutate(mutation);
      this.promiseQueue.push(p);
      return p;
    },
    trashNote() {
      this.loading = true;
      const note = this.focuseNote;
      const index = this.project.notes.indexOf(this.focuseNote);
      this.project.notes.splice(this.project.notes.indexOf(note), 1);
      const next = this.project.notes[index];
      const length = this.project.notes.length;
      this.focuseNote = next || this.project.notes[length - 1];

      if (note.deleted) {
        console.log("delete note!!");
        this.mutateQueue({
          mutation: DELETE_NOTE,
          variables: {
            id: note.id,
          },
        });
      } else {
        console.log("trash note!!");
        this.mutateQueue({
          mutation: TRASH_NOTE,
          variables: {
            id: note.id,
            deleted: true,
          },
        });
      }
    },
    selectionDown() {
      const index = this.project.notes.indexOf(this.focuseNote);
      const next = this.project.notes[index + 1];
      this.focuseNote = next || this.project.notes[0];
    },
    selectionUp() {
      const index = this.project.notes.indexOf(this.focuseNote);
      const next = this.project.notes[index - 1];
      const length = this.project.notes.length;
      this.focuseNote = next || this.project.notes[length - 1];
    },
    setFocusNote(note) {
      this.focuseNote = note;
    },
    resetfocuseNote() {
      this.focuseNote = null;
      this.editNote = null;
    },
    updatePositions() {
      const objs = [];
      for (let i = 0; i < this.project.notes.length; i++) {
        this.project.notes[i].position = i;
        const { __typename, ...obj } = this.project.notes[i];
        objs.push(obj);
      }
      this.mutateQueue({
        mutation: SORT_NOTES,
        variables: {
          objects: objs,
        },
      });
    },
    //updateCache(store, { data: { note } }) {
    //  const query = {
    //    query: GET_PROJECT,
    //    variables: {
    //      id: this.currentProject.id,
    //    },
    //  };
    //  const data = JSON.parse(JSON.stringify(store.readQuery(query)));
    //  data.project.notes = this.project.notes;
    //  // Write back to the cache
    //  store.writeQuery({
    //    ...query,
    //    data,
    //  });
    //},
    checkProject(project) {
      this.loading = true;
      let p = new Promise((resolve) => {
        setTimeout(() => {
          console.log("project.done", project.done);
          if (!project.done) return;
          this.mutateQueue({
            mutation: CHECK_PROJECT,
            variables: {
              id: project.id,
            },
          });
          this.$store.commit("user/updateCurrentProject", null);
          console.log("resolve");
          resolve();
        }, 1000);
      });
      this.promiseQueue.push(p);
    },
    checkNote(note) {
      console.log("check note", note);
      note.done = !note.done;
      let p = new Promise((resolve) => {
        setTimeout(() => {
          resolve();
          this.mutateQueue({
            mutation: CHECK_NOTE,
            variables: {
              id: note.id,
              done: note.done,
            },
          });
        }, 1000);
      });
      this.promiseQueue.push(p);
    },
    //removeToCache(store, { data: note }) {
    //  const query = {
    //    query: GET_PROJECT,
    //    variables: {
    //      id: this.project.id,
    //    },
    //  };
    //  const data = JSON.parse(JSON.stringify(store.readQuery(query)));
    //
    //  data.project.notes = data.project.notes.filter((n) => n.id != note.id);
    //  // Write back to the cache
    //  store.writeQuery({
    //    ...query,
    //    data,
    //  });
    //},
    //addToCache(store, { data: { note } }) {
    //  const query = {
    //    query: GET_PROJECT,
    //    variables: {
    //      id: this.project.id,
    //    },
    //  };
    //  const data = JSON.parse(JSON.stringify(store.readQuery(query)));
    //  data.project.notes = [...data.project.notes, note];
    //  // Write back to the cache
    //  store.writeQuery({
    //    ...query,
    //    data,
    //  });
    //},
    updateNote(note) {
      console.log("update note!! with throttle 1000", note);
      if (this.updateId) clearTimeout(this.updateId);
      this.updateId = setTimeout(() => {
        this.mutateQueue({
          mutation: UPDATE_NOTE,
          variables: {
            id: note.id,
            title: note.title ?? "",
            content: note.content ?? "",
            deadline: note.deadline,
          },
        });
      }, 500);
    },
  },
  computed: {},
});
</script>
<style lang="scss" scoped>
.note {
  margin-bottom: 15px;
}

.notes {
  position: relative;
  text-align: center;
}

.container {
  margin-left: 50px;
  margin-right: 50px;
}

.head-icon {
  margin-right: 5px;
}

.fill-window {
  height: calc(100vh - 105px);
  width: 100%;
}
</style>
