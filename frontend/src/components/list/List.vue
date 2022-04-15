<template>
  <draggable
    v-model="items"
    :sort="sort"
    :drop="drop"
    @add="addEvent"
    @remove="removeEvent"
    @sort="sortEvent"
    :group="{ name: group, pull: drag, put: drop }"
    item-key="id"
  >
    <template #item="{ element }">
      <item
        data-type="note"
        :id="element.id"
        v-if="element.__typename.includes('_note')"
        @dragstart="(e) => dragStart(e, element)"
        @click.stop="setFocusNote(element)"
        :focused="focusedNote && focusedNote.id == element.id"
        class="note"
        :ref="`item-${element.id}`"
        v-model="notesCopy[notesCopy.indexOf(element)]"
        @check="check"
        @edit="setEditNote"
        :date-preview="datePreview"
      />
      <item
        v-else
        data-type="project"
        :id="element.id"
        @dragstart="(e) => dragStart(e, element)"
        @click.stop="setFocusNote(element)"
        :focused="focusedNote && focusedNote.id == element.id"
        class="note"
        :ref="`item-${element.id}`"
        v-model="projectsCopy[projectsCopy.indexOf(element)]"
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
import { toDatabaseString } from "src/common/date.js";
import { getQueries } from "src/common/queries";
import { loading } from "src/common/system.js";
import { scroll } from "quasar";
const { getScrollTarget, setVerticalScrollPosition } = scroll;
export const bus = mitt();
const SORT_NOTES = require("src/gql/mutations/SortNotes.gql");
const SORT_PROJECTS = require("src/gql/mutations/SortProjects.gql");
const TRASH_NOTE = require("src/gql/mutations/TrashNote.gql");
const TRASH_PROJECT = require("src/gql/mutations/TrashProject.gql");
const DELETE_NOTE = require("src/gql/mutations/DeleteNoteByPk.gql");
const DELETE_PROJECT = require("src/gql/mutations/DeleteProjectByPk.gql");
const CHECK_NOTE = require("src/gql/mutations/CheckNote.gql");
const CHECK_PROJECT = require("src/gql/mutations/CheckProject.gql");

export default defineComponent({
  name: "NoteList",
  components: {
    Item,
    draggable,
  },
  mounted() {
    console.log("items", this.items);
    bus.on("revert", this.revert);
    if (this.select) {
      document.addEventListener("click", this.resetFocusedNote);
      document.addEventListener("keydown", this.onKeydown);
    } else {
      bus.on("focusNote", this.focusNote);
      bus.on("resetFocusedNote", this.resetFocusedNote);
      bus.on("trash", this.trashNote);
    }
  },
  unmounted() {
    bus.off("revert", this.revert);
    if (this.select) {
      document.removeEventListener("click", this.resetFocusedNote);
      document.removeEventListener("keydown", this.onKeydown);
    } else {
      bus.off("focusNote", this.focusNote);
      bus.off("resetFocusedNote", this.resetFocusedNote);
      bus.off("trash", this.trashNote);
    }
  },
  data() {
    return {
      notesCopy: JSON.parse(JSON.stringify(this.notes)),
      projectsCopy: JSON.parse(JSON.stringify(this.projects)),
      updateId: null,
      trashNoteTimeout: null,
      focusedNote: null,
      loading: false,
      editNote: null,
      checkTimeout: null,
      newItems: null,
    };
  },
  watch: {
    notes: {
      handler(value) {
        this.notesCopy = JSON.parse(JSON.stringify(value));
      },
    },
    projects: {
      handler(value) {
        this.projectsCopy = JSON.parse(JSON.stringify(value));
      },
    },
  },
  props: {
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
      default: true,
    },
    positionColumn: {
      type: String,
      required: false,
    },
    done: {
      type: Boolean,
      required: false,
      default: false,
    },
    keep: {
      type: Boolean,
      required: false,
      default: false,
    },
    notes: {
      type: Array,
      required: false,
      default() {
        return [];
      },
    },
    projects: {
      type: Array,
      required: false,
      default() {
        return [];
      },
    },
    sortMethod: {
      type: Function,
      required: true,
    },
  },
  methods: {
    dragStart(e, item) {
      if (item.__typename.includes("_note")) {
        e.dataTransfer.setData("note", JSON.stringify(item));
      } else {
        e.dataTransfer.setData("project", JSON.stringify(item));
      }
    },
    setEditNote(note) {
      this.editNote = note;
      this.$emit("edit", note);
    },
    scrollToElement(el) {
      const target = getScrollTarget(el);
      const offset = el.offsetTop - window.innerHeight / 3;
      const duration = 500;
      setVerticalScrollPosition(target, offset, duration);
    },
    scrollToItem() {
      this.scrollToElement(this.$refs[`item-${this.focusedNote.id}`].$el);
    },
    onKeydown(e) {
      if (!this.editNote && this.focusedNote) {
        if (e.keyCode === 8) {
          this.trashNote();
        } else if (e.keyCode == 38) {
          e.preventDefault();
          this.selectionUp();
          this.scrollToItem();
        } else if (e.keyCode == 40) {
          e.preventDefault();
          this.selectionDown();
          this.scrollToItem();
        }
      }
    },
    mutateQueue(mutation) {
      loading(true);
      let p = this.$apollo.mutate(mutation);
      p.finally(() => loading(false));
      getQueries(mutation.variables).forEach((query) => {
        console.log("mutateQueue query", query);
        this.addToCache(mutation.variables, query);
      });

      return p;
    },
    revert() {
      const item = this.focusedNote;
      console.log("list revert item", item);
      if (!item) return;
      this.removeItem(item);
      if (item.deleted) {
        console.log("revert", item);
        item.deleted = false;
        item.deleted_at = null;
        this.mutateQueue({
          mutation: item.__typename.includes("_note")
            ? TRASH_NOTE
            : TRASH_PROJECT,
          variables: item,
        });
      }
    },
    removeItem(item) {
      const index = this.items.findIndex(
        (it) => it.id == item.id && it.__typename == item.__typename
      );
      console.log("index", index);
      this.items.splice(index, 1);
      let next = this.items[index];
      if (!next) {
        const length = this.items.length;
        next = this.items[length - 1];
      }
      this.focusedNote = next;
      console.log("remove item", item);
    },
    trashNote() {
      console.log("trashNote!!!");
      const item = this.focusedNote;
      if (!item) return;
      this.removeItem(item);

      if (item.deleted) {
        console.log("delete note!!");
        this.$apollo.mutate({
          mutation: item.__typename.includes("_note")
            ? DELETE_NOTE
            : DELETE_PROJECT,
          variables: {
            id: item.id,
          },
        });
      } else {
        console.log("trash note!!");
        item.deleted = true;
        item.deleted_at = new Date();
        this.mutateQueue({
          mutation: item.__typename.includes("_note")
            ? TRASH_NOTE
            : TRASH_PROJECT,
          variables: item,
        });
      }
    },
    // removeFromCache(item, query) {
    //   const apolloClient = this.$apollo.provider.defaultClient;
    //   const cacheData = apolloClient.readQuery(query);
    //   console.log("removeFromCache data", cacheData);
    // },
    addToCache(item, query) {
      if (!item.__typename) return;
      const apolloClient = this.$apollo.provider.defaultClient;
      const cacheData = apolloClient.readQuery(query);
      console.log("addToCache data", cacheData, item);

      if (cacheData) {
        let type;
        let data;
        if (cacheData["project"]) {
          data = {
            project: {
              ...cacheData.project,
              notes: [...cacheData.project.notes, item],
            },
          };
        } else {
          if (item.__typename.includes("_note")) {
            type = cacheData["active_notes"] ? "active_notes" : "notes_note";
          } else {
            type = "notes_project";
          }
          data = {
            ...cacheData,
            [type]: [...cacheData[type], item],
          };
        }
        apolloClient.writeQuery({ ...query, data });
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
    removeEvent(e) {
      console.log("removeEvent", e);
      if (e.item.dataset.type == "note") {
        this.notesCopy.splice(e.oldIndex, 1);
      } else {
        this.projectsCopy.splice(e.oldIndex, 1);
      }
    },
    addEvent(e) {
      console.log("addEvent", e);
      if (e.item.dataset.type == "note") {
        this.notesCopy.splice(
          e.newIndex,
          0,
          this.newItems.find((item) => item.id == e.item.id)
        );
      } else {
        this.projectsCopy.splice(
          e.newIndex,
          0,
          this.newItems.find((item) => item.id == e.item.id)
        );
      }
    },
    sortEvent(e) {
      this.updatePositions(this.newItems);
    },
    updatePositions(items) {
      console.log("update positions", items);
      if (!items) return;
      const notes = [];
      const projects = [];
      const update_columns = ["deadline", this.positionColumn];
      let item;
      for (let i = 0; i < items.length; i++) {
        item = items[i];
        console.log("note", item);
        item[this.positionColumn] = i;

        const { __typename, ...obj } = item;
        if (this.deadline) {
          obj.deadline = this.deadline ? toDatabaseString(this.deadline) : null;
          item.deadline = this.deadline;
        }

        if (item.__typename.includes("_note")) {
          notes.push(obj);
        } else {
          projects.push(obj);
        }
      }

      if (notes.length) {
        this.mutateQueue({
          mutation: SORT_NOTES,
          variables: {
            objects: notes,
            update_columns: update_columns,
          },
        });
      }
      if (projects.length) {
        this.mutateQueue({
          mutation: SORT_PROJECTS,
          variables: {
            objects: projects,
            update_columns: update_columns,
          },
        });
      }

      this.newItems = null;
    },
    check(item) {
      console.log("check note", item);
      const type = item.__typename;
      //this.loading = true;
      loading(true);
      item.done = !item.done;
      item.completed_at = new Date();
      if (this.checkTimeout) clearTimeout(this.checkTimeout);
      this.checkTimeout = setTimeout(() => {
        console.log("timeout", this.done, item.done === this.done);
        if (item.done === this.done && !this.keep) {
          const index = this.items.findIndex(
            (it) => it.id == item.id && it.__typename == type
          );
          this.items.splice(index, 1);
        }
        this.mutateQueue({
          mutation: type.includes("_note") ? CHECK_NOTE : CHECK_PROJECT,
          variables: item,
        });
      }, 500);
    },
  },
  computed: {
    user() {
      return this.$store.state.user;
    },
    items: {
      get() {
        return [...this.notesCopy, ...this.projectsCopy].sort(this.sortMethod);
      },
      set(newItems) {
        console.log("set new value", newItems);
        this.newItems = newItems;
        // this.updatePositions(newValue);
      },
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
