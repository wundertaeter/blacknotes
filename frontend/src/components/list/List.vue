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
        @click.stop="setFocus(element)"
        :focused="focusNote && focusNote.id == element.id"
        :edited="editNote && editNote.id == element.id"
        class="note"
        :ref="`item-${element.id}`"
        v-model="notesCopy[notesCopy.indexOf(element)]"
        @check="check"
        @edit="setEditNote"
        @dblclick="setEdit(element)"
        :date-preview="datePreview"
      />
      <item
        v-else
        data-type="project"
        :id="element.id"
        @dragstart="(e) => dragStart(e, element)"
        @click.stop="setFocus(element)"
        :focused="focusNote && focusNote.id == element.id"
        :edited="editNote && editNote.id == element.id"
        class="note"
        :ref="`item-${element.id}`"
        v-model="projectsCopy[projectsCopy.indexOf(element)]"
        @check="check"
        @edit="setEditNote"
        @dblclick="setEdit(element)"
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
// import { scroll } from "quasar";
// const { getScrollTarget, setVerticalScrollPosition } = scroll;
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
    bus.on("scrollTo", this.scrollTo);
    bus.on("setFocus", this.setFocus);
    bus.on("setEdit", this.setEdit);
    bus.on("resetFocus", this.resetFocus);
    bus.on("trash", this.trashNote);
    if (this.select) {
      document.addEventListener("click", this.resetFocus);
      document.addEventListener("keydown", this.onKeydown);
    }
  },
  unmounted() {
    bus.off("revert", this.revert);
    bus.off("scrollTo", this.scrollTo);
    bus.off("setFocus", this.setFocus);
    bus.off("setEdit", this.setEdit);
    bus.off("resetFocus", this.resetFocus);
    bus.off("trash", this.trashNote);
    if (this.select) {
      document.removeEventListener("click", this.resetFocus);
      document.removeEventListener("keydown", this.onKeydown);
    }
  },
  data() {
    return {
      notesCopy: JSON.parse(JSON.stringify(this.notes)),
      projectsCopy: JSON.parse(JSON.stringify(this.projects)),
      updateId: null,
      trashNoteTimeout: null,
      focusNote: null,
      loading: false,
      editNote: null,
      checkTimeout: null,
      newItems: null,
      trigger: 0,
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
    focused: {
      handler(value){
        this.focusNote = value;
      }
    },
    edited: {
      handler(value){
        this.editNote = value;
      }
    }
  },
  props: {
    group: {
      type: String,
      required: false,
    },
    when: {
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
      required: false,
    },
    focused: {
      required: false
    },
    edited: {
      required: false
    }
  },
  methods: {
    dragStart(e, item) {
      if (item.__typename.includes("_note")) {
        e.dataTransfer.setData("note", JSON.stringify(item));
      } else {
        e.dataTransfer.setData("project", JSON.stringify(item));
      }
    },
    setFocus(note) {
      if(this.select){
        this.focusNote = note;
      }
      this.$emit('select', note);
    },
    setEditNote(note){
      this.editNote = note;
      this.$emit('edit', note);
    },
    setEdit(note) {
      this.setFocus(note)
      this.setEditNote(note);
    },
    // scrollToElement(el) {
    //   const target = getScrollTarget(el);
    //   const offset = el.offsetTop - window.innerHeight / 3;
    //   const duration = 250;
    //   console.log('offset', offset);
    //   setVerticalScrollPosition(target, offset, duration);
    // },
    scrollTo(args) {
      const item = args.item ? args.item : args;
      const top = args.item ? args.top : false;
      // console.log("scrollTo top", top);
      const ref = this.$refs[`item-${item.id}`];
      if (ref) {
        // console.log("ref ", item);
        // this.scrollToElement(ref.$el);
        if(!this.elementInViewport(ref.$el)){
          ref.$el.scrollIntoView(!!top);
        }
        // console.log("this.focusNote", this.focusNote);
      }
    },
    elementInViewport(el) {
      var top = el.offsetTop;
      var left = el.offsetLeft;
      var width = el.offsetWidth;
      var height = el.offsetHeight;

      while(el.offsetParent) {
        el = el.offsetParent;
        top += el.offsetTop;
        left += el.offsetLeft;
      }

      return (
        top >= window.pageYOffset &&
        left >= window.pageXOffset &&
        (top + height) <= (window.pageYOffset + window.innerHeight) &&
        (left + width) <= (window.pageXOffset + window.innerWidth)
      );
    },
    onKeydown(e) {
      if (!this.editNote && this.focusNote) {
        if (e.keyCode === 8) {
          this.trashNote();
        } else if (e.keyCode == 38) {
          e.preventDefault();
          this.selectionUp();
          this.scrollTo(this.focusNote);
        } else if (e.keyCode == 40) {
          e.preventDefault();
          this.selectionDown();
          this.scrollTo(this.focusNote);
        }
      }
    },
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
    revert() {
      const item = this.focusNote;
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
      let next;
      if (item.__typename.includes("_note")) {
        const index = this.notesCopy.findIndex(
          (it) => it.id == item.id && it.__typename == item.__typename
        );
        console.log("note index", index);
        console.log(this.items);
        this.items = {
          notes: this.notesCopy.filter((n) => n.id != item.id),
          projects: this.projectsCopy,
        };
        console.log(this.items);
        next = this.notesCopy[index];
        if (!next) {
          const length = this.notesCopy.length;
          next = this.notesCopy[length - 1];
        }
      } else {
        const index = this.projectsCopy.findIndex(
          (it) => it.id == item.id && it.__typename == item.__typename
        );
        console.log("project index", index);
        this.projectsCopy.splice(index, 1);
        this.projectsCopy = [...this.projectsCopy];
        next = this.projectsCopy[index];
        if (!next) {
          const length = this.projectsCopy.length;
          next = this.projectsCopy[length - 1];
        }
      }
      this.focusNote = next;
      console.log("remove item", item);
    },
    trashNote() {
      const item = this.focusNote;
      console.log("trashNote!!!", item);
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
    selectionDown() {
      const index = this.items.findIndex(
        (it) =>
          it.id == this.focusNote.id &&
          it.__typename == this.focusNote.__typename
      );
      const next = this.items[index + 1];
      if(next) this.setFocus(next);
    },
    selectionUp() {
      const index = this.items.findIndex(
        (it) =>
          it.id == this.focusNote.id &&
          it.__typename == this.focusNote.__typename
      );
      const next = this.items[index - 1];
      if(next) this.setFocus(next);
    },
    resetFocus() {
      console.log("reset focus");
      this.setFocus(null)
      this.setEdit(null);
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
      const update_columns = ["when", this.positionColumn];
      let item;
      for (let i = 0; i < items.length; i++) {
        item = items[i];
        console.log("note", item);
        item[this.positionColumn] = i;

        const { __typename, project, ...obj } = item;
        if (this.when) {
          obj.when = this.when ? toDatabaseString(this.when) : null;
          item.when = this.when;
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
      if (item.done) {
        item.completed_at = new Date();
      }
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
        const items = [...this.notesCopy, ...this.projectsCopy];
        return this.sortMethod ? items.sort(this.sortMethod) : items;
      },
      set(newItems) {
        console.log("set new value", newItems);
        if (newItems.notes && newItems.projects) {
          this.notesCopy = newItems.notes;
          this.projectsCopy = newItems.projects;
        } else {
          this.newItems = newItems;
        }
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
