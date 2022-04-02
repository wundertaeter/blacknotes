<template>
  <draggable
    v-model="notes"
    @add="updatePositions"
    @sort="updatePositions"
    :group="group"
    item-key="id"
  >
    <template #item="{ element }">
      <note
        @click.stop="setFocusNote(element)"
        :focused="focusedNote && focusedNote.id == element.id"
        class="note"
        v-model="notes[notes.indexOf(element)]"
        @update:modelValue="updateNote"
        @check="checkNote"
        @edit="setEditNote"
        :date-preview="datePreview"
      />
    </template>
  </draggable>
</template>

<script>
import { defineComponent } from "vue";
import Note from "src/components/Note.vue";
import draggable from "vuedraggable";
import mitt from "mitt";
import { toDatabaseString } from "src/common/date.js";
export const bus = mitt();
const CHECK_PROJECT = require("src/gql/mutations/CheckProject.gql");
const UPDATE_NOTE = require("src/gql/mutations/UpdateNote.gql");
const SORT_NOTES = require("src/gql/mutations/SortNotes.gql");
const TRASH_NOTE = require("src/gql/mutations/TrashNote.gql");
const DELETE_NOTE = require("src/gql/mutations/DeleteNoteByPk.gql");
const CHECK_NOTE = require("src/gql/mutations/CheckNote.gql");

export default defineComponent({
  name: "NoteList",
  components: {
    Note,
    draggable,
  },
  mounted() {
    if (this.selectable) {
      document.addEventListener("click", this.resetFocusedNote);
      document.addEventListener("keydown", this.onKeydown);
    } else {
      bus.on("focusNote", this.focusNote);
      bus.on("resetFocusedNote", this.resetFocusedNote);
      //bus.on("trashNote", this.trashNote);
    }
  },
  unmounted() {
    if (this.selectable) {
      document.removeEventListener("click", this.resetFocusedNote);
      document.removeEventListener("keydown", this.onKeydown);
    } else {
      bus.off("focusNote", this.focusNote);
      bus.off("resetFocusedNote", this.resetFocusedNote);
      //bus.off("trashNote", this.trashNote);
    }
  },
  data() {
    return {
      notes: JSON.parse(JSON.stringify(this.modelValue)),
      updateId: null,
      trashNoteTimeout: null,
      focusedNote: null,
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
    group: {
      type: String,
      required: false,
    },
    deadline: {
      type: Object,
      required: false,
    },
    datePreview: {
      type: Boolean,
      required: false,
      default: true,
    },
    selectable: {
      type: Boolean,
      required: false,
      default: true,
    },
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
          this.notes = JSON.parse(JSON.stringify(value));
        }
      },
      deep: true,
    },
  },
  methods: {
    setEditNote(note) {
      this.editNote = note;
      this.$emit("edit", note);
    },
    onKeydown(e) {
      if (!this.editNote) {
        if (e.keyCode === 8 && this.focusedNote) {
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
      console.log("trashNote!!!");
      const note = this.focusedNote;
      const index = this.notes.findIndex((n) => n.id == note.id);
      this.notes.splice(index, 1);
      let next = this.notes[index];
      if (!next) {
        const length = this.notes.length;
        next = this.notes[length - 1];
      }
      this.focusedNote = next;

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
    focusNote(note) {
      this.focusedNote = note;
    },
    selectionDown() {
      const index = this.notes.findIndex(
        (note) => note.id == this.focusedNote.id
      );
      const next = this.notes[index + 1];
      this.focusNote(next || this.notes[0]);
    },
    selectionUp() {
      const index = this.notes.findIndex(
        (note) => note.id == this.focusedNote.id
      );
      const next = this.notes[index - 1];
      const length = this.notes.length;
      this.focusNote(next || this.notes[length - 1]);
    },
    setFocusNote(note) {
      if (this.selectable) {
        this.focusedNote = note;
      } else {
        this.$emit("select", note);
      }
    },
    resetFocusedNote() {
      this.focusedNote = null;
      this.editNote = null;
    },
    updatePositions() {
      const objs = [];
      for (let i = 0; i < this.notes.length; i++) {
        this.notes[i].position = i;
        const { __typename, ...obj } = this.notes[i];
        if (this.deadline) {
          obj.deadline = this.deadline ? toDatabaseString(this.deadline) : null;
          this.notes[i].deadline = this.deadline;
        }
        this.$emit("update:modelValue", this.notes);
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
    //  data.notes = this.notes;
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
          if (note.done) {
            const index = this.notes.indexOf(note);
            this.notes.splice(index, 1);
          }
          this.mutateQueue({
            mutation: CHECK_NOTE,
            variables: {
              id: note.id,
              done: note.done,
            },
          }).finally(() => this.$nextTick(resolve));
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
    //  data.notes = data.notes.filter((n) => n.id != note.id);
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
    //  data.notes = [...data.notes, note];
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
            deadline: note.deadline ? toDatabaseString(note.deadline) : null,
          },
        });
      }, 500);
    },
  },
  computed: {
    user() {
      return this.$store.state.user;
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
</style>
