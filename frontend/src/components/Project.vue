<template>
  <div>
    <q-scroll-area class="fill-window" @click="resetSelectedNote">
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
              @click.stop="focusNote(element)"
              @dblclick="editNote(element)"
              @keydown.enter="editedNote ? editedNote = null : editedNote = element"
              :focused="focusedNote && focusedNote.id == element.id"
              :edit="editedNote && editedNote.id == element.id"
              class="note"
              v-model="project.notes[project.notes.indexOf(element)]"
              @update:modelValue="updateNote"
              @done="checkNote(note)"
            />
          </template>
        </draggable>
      </div>
    </q-scroll-area>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import Note from "src/components/Note.vue";
import draggable from "vuedraggable";
const CREATE_NOTE = require("src/gql/mutations/CreateNote.gql");
const DELETE_NOTE_BY_PK = require("src/gql/mutations/DeleteNoteByPk.gql");
const PROJECT_TO_TRASH = require("src/gql/mutations/ProjectToTrash.gql");
const CHECK_PROJECT = require("src/gql/mutations/CheckProject.gql");
const UPDATE_NOTE = require("src/gql/mutations/UpdateNote.gql");
const SORT_NOTES = require("src/gql/mutations/SortNotes.gql");
const TRASH_NOTE = require("src/gql/mutations/TrashNote.gql");

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
      editedNote: null,
      focusedNote: null,
      loading: false,
      promiseQueue: [],
    };
  },
  props: {
    modelValue: {
      type: Object,
      required: true,
    },
  },
  watch: {
    modelValue: {
      handler(value) {
        Promise.all(this.promiseQueue).then(() => (this.loading = false));
        if (!this.loading) {
          this.project = JSON.parse(JSON.stringify(value));
        }
      },
      deep: true,
    },
    selectedNote: {
      handler(value) {
        this.$emit("select", value);
      },
    },
  },
  methods: {
    onKeydown(e) {
      if (this.editedNote) return;
      if (e.keyCode === 8 && this.selectedNote) {
        this.trashNote();
      } else if (e.keyCode == 38) {
        this.selectionUp();
      } else if (e.keyCode == 40) {
        this.selectionDown();
      }
    },
    mutateQueue(mutation){
      this.loading = true;
      this.promiseQueue.push(this.$apollo.mutate(mutation));
    },
    trashNote() {
      this.loading = true;
      console.log("trash note!!");
      const note = this.selectedNote;
      const index = this.project.notes.indexOf(this.focusedNote);
      this.project.notes.splice(this.project.notes.indexOf(note), 1);
      const next = this.project.notes[index];
      const length = this.project.notes.length;
      this.focusedNote = next || this.project.notes[length - 1];
      this.mutateQueue({
        mutation: TRASH_NOTE,
        variables: {
          id: note.id,
          deleted: true,
        },
      });
    },
    selectionDown() {
      const index = this.project.notes.indexOf(this.focusedNote);
      const next = this.project.notes[index + 1];
      this.focusedNote = next || this.project.notes[0];
    },
    selectionUp() {
      const index = this.project.notes.indexOf(this.focusedNote);
      const next = this.project.notes[index - 1];
      const length = this.project.notes.length;
      this.focusedNote = next || this.project.notes[length - 1];
    },
    focusNote(note) {
      if (!this.editedNote || this.editedNote.id !== note.id) {
        this.editedNote = null;
        this.focusedNote = note;
      }
    },
    editNote(note) {
      if (!this.editedNote) {
        //this.focusedNote = null;
        this.editedNote = note;
      }
    },
    resetSelectedNote() {
      this.editedNote = null;
      this.focusedNote = null;
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
      setTimeout(() => {
        if (!project.done) return;
        this.mutateQueue({
          mutation: CHECK_PROJECT,
          variables: {
            id: project.id,
          },
        });
        this.$store.commit("user/updateCurrentProject", null);
      }, 1000);
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
      }, 1000);
    },
  },
  computed: {
    selectedNote() {
      return this.editedNote || this.focusedNote;
    },
  },
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
