<template>
  <draggable
    v-model="items"
    @add="updatePositions"
    @sort="updatePositions"
    :sort="sort"
    :drop="drop"
    :group="{ name: group, pull: drag, put: drop }"
    item-key="id"
  >
    <template #item="{ element }">
      <item
        @click.stop="setFocusNote(element)"
        :focused="focusedNote && focusedNote.id == element.id"
        class="note"
        v-model="items[items.indexOf(element)]"
        @update:modelValue="updateNote"
        @check="check"
        @edit="setEditNote"
        :date-preview="datePreview"
      />
    </template>
  </draggable>
</template>

<script>
import { defineComponent } from "vue";
import Item from "src/components/list/Item.vue";
import draggable from "vuedraggable";
import mitt from "mitt";
import { toDatabaseString, today } from "src/common/date.js";
export const bus = mitt();
const UPDATE_NOTE = require("src/gql/mutations/UpdateNote.gql");
const SORT_NOTES = require("src/gql/mutations/SortNotes.gql");
const TRASH_NOTE = require("src/gql/mutations/TrashNote.gql");
const DELETE_NOTE = require("src/gql/mutations/DeleteNoteByPk.gql");
const CHECK_NOTE = require("src/gql/mutations/CheckNote.gql");
const CHECK_PROJECT = require("src/gql/mutations/CheckProject.gql");

export default defineComponent({
  name: "NoteList",
  components: {
    Item,
    draggable,
  },
  mounted() {
    if (this.select) {
      document.addEventListener("click", this.resetFocusedNote);
      document.addEventListener("keydown", this.onKeydown);
    } else {
      bus.on("focusNote", this.focusNote);
      bus.on("resetFocusedNote", this.resetFocusedNote);
      //bus.on("trashNote", this.trashNote);
    }
  },
  unmounted() {
    if (this.select) {
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
      items: JSON.parse(JSON.stringify(this.modelValue)),
      updateId: null,
      trashNoteTimeout: null,
      focusedNote: null,
      loading: false,
      promiseQueue: [],
      editNote: null,
      checkTimeout: null
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
    drop: {
      type: Boolean,
      required: false,
      default: true,
    },
    drag: {
      type: Boolean,
      required: false,
      default: true
    },
    sortMode: {
      type: String,
      required: false,
      default: "",
    },
    done: {
      type: Boolean,
      required: false,
      default: false
    },
    keep: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  watch: {
    modelValue: {
      handler(value) {
        console.log("update note list", value);

        Promise.all(this.promiseQueue).finally(() => {
          this.promiseQueue = [];
          this.loading = false;
        });

        if (!this.loading) {
          this.items = JSON.parse(JSON.stringify(value));
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
      if (!this.editNote && this.focusedNote) {
        if (e.keyCode === 8) {
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
      const index = this.items.findIndex(
        (it) => it.id == note.id && it.__typename == note.__typename
      );
      this.items.splice(index, 1);
      let next = this.items[index];
      if (!next) {
        const length = this.items.length;
        next = this.items[length - 1];
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
      const index = this.items.findIndex(
        (it) =>
          it.id == this.focusedNote.id &&
          it.__typename == this.focusedNote.__typename
      );
      const next = this.items[index + 1];
      this.focusNote(next || this.items[0]);
    },
    selectionUp() {
      const index = this.items.findIndex(
        (it) =>
          it.id == this.focusedNote.id &&
          it.__typename == this.focusedNote.__typename
      );
      const next = this.items[index - 1];
      const length = this.items.length;
      this.focusNote(next || this.items[length - 1]);
    },
    setFocusNote(note) {
      if (this.select) {
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
      const update_columns = ["deadline", this.positionColumn];
      for (let i = 0; i < this.items.length; i++) {
        this.items[i][this.positionColumn] = i;
        const { __typename, ...obj } = this.items[i];
        if (this.deadline) {
          obj.deadline = this.deadline ? toDatabaseString(this.deadline) : null;
          this.items[i].deadline = this.deadline;
        }
        this.$emit("update:modelValue", this.items);
        objs.push(obj);
      }
      this.mutateQueue({
        mutation: SORT_NOTES,
        variables: {
          objects: objs,
          update_columns: update_columns,
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
    //  data.notes = this.items;
    //  // Write back to the cache
    //  store.writeQuery({
    //    ...query,
    //    data,
    //  });
    //},

    check(item) {
      console.log("check note", item.__typename);
      const type = item.__typename;
      this.loading = true;
      item.done = !item.done;
      let p = new Promise((resolve) => {
        if(this.checkTimeout) clearTimeout(this.checkTimeout);
        this.checkTimeout = setTimeout(() => {
          console.log('timeout', this.done, item.done === this.done);
          if (item.done === this.done && !this.keep) {
            const index = this.items.findIndex(
              (it) => it.id == item.id && it.__typename == type
            );
            this.items.splice(index, 1);
          }
          this.mutateQueue({
            mutation: type == "notes_note" ? CHECK_NOTE : CHECK_PROJECT,
            variables: {
              id: item.id,
              done: item.done,
              completed_at: item.done ? toDatabaseString(today()) : null
            },
          }).finally(() => this.$nextTick(resolve));
        }, 500);
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
    positionColumn() {
      return this.sortMode ? `${this.sortMode}_position` : "position";
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
