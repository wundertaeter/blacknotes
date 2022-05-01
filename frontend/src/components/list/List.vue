<template>
  <draggable
    v-model="itemsCopy"
    :sort="sort"
    :drop="drop"
    :group="{ name: group, pull: drag, put: drop }"
    @update:modelValue="updatePositions"
    item-key="id"
  >
    <template #item="{ element }">
      <item
        :data-type="element.__typename.includes('_note') ? 'note' : 'project'"
        :id="element.id"
        @dragstart="(e) => dragStart(e, element)"
        @click.stop="setFocus(element)"
        :focused="focusNote && focusNote.id == element.id"
        :edited="editNote && editNote.id == element.id"
        class="note"
        :ref="`item-${element.id}`"
        v-model="itemsCopy[itemsCopy.indexOf(element)]"
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
// import { scroll } from "quasar";
// const { getScrollTarget, setVerticalScrollPosition } = scroll;
export const bus = mitt();
const SORT_NOTES = require("src/gql/mutations/SortNotes.gql");
const SORT_PROJECTS = require("src/gql/mutations/SortProjects.gql");
const TRASH_NOTE = require("src/gql/mutations/TrashNote.gql");
const TRASH_PROJECT = require("src/gql/mutations/TrashProject.gql");
// const DELETE_NOTE = require("src/gql/mutations/DeleteNoteByPk.gql");
// const DELETE_PROJECT = require("src/gql/mutations/DeleteProjectByPk.gql");
const CHECK_NOTE = require("src/gql/mutations/CheckNote.gql");
const CHECK_PROJECT = require("src/gql/mutations/CheckProject.gql");
const DELETE_PROJECTS = require("src/gql/mutations/DeleteProjects.gql");
const DELETE_NOTES = require("src/gql/mutations/DeleteNotes.gql");
// const TRASH_NOTES = require("src/gql/mutations/TrashNotes.gql");
// const TRASH_PROJECTS = require("src/gql/mutations/TrashProjects.gql");

export default defineComponent({
  name: "NoteList",
  components: {
    Item,
    draggable,
  },
  mounted() {
    console.log("items", this.itemsCopy);
    bus.on("sort", this.updatePositions);
    bus.on("revert", this.revert);
    bus.on("deleteAll", this.deleteAll);
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
    bus.off("sort", this.updatePositions);
    bus.off("revert", this.revert);
    bus.off("deleteAll", this.deleteAll);
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
  data(props) {
    // console.log(props.items)
    return {
      itemsCopy: JSON.parse(JSON.stringify(props.items)),
      updateId: null,
      trashNoteTimeout: null,
      focusNote: null,
      editNote: null,
      checkTimeout: null,
      trigger: 0,
    };
  },
  watch: {
    items: {
      handler(value) {
        this.itemsCopy = JSON.parse(JSON.stringify(value));
      },
    },
    focused: {
      handler(value) {
        this.focusNote = value;
      },
    },
    edited: {
      handler(value) {
        this.editNote = value;
      },
    },
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
    project: {
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
    items: {
      type: Array,
      required: true,
    },
    sortMethod: {
      type: Function,
      required: false,
    },
    focused: {
      required: false,
    },
    edited: {
      required: false,
    },
  },
  methods: {
    dragStart(e, item) {
      item[this.positionColumn] = null;
      if (item.__typename.includes("_note")) {
        e.dataTransfer.setData("note", JSON.stringify(item));
      } else {
        e.dataTransfer.setData("project", JSON.stringify(item));
      }
    },
    setFocus(note) {
      if (this.select) {
        this.focusNote = note;
      }
      this.$emit("select", note);
    },
    setEditNote(note) {
      this.editNote = note;
      this.$emit("edit", note);
    },
    setEdit(note) {
      this.setFocus(note);
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
        if (!this.elementInViewport(ref.$el)) {
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

      while (el.offsetParent) {
        el = el.offsetParent;
        top += el.offsetTop;
        left += el.offsetLeft;
      }

      return (
        top >= window.pageYOffset &&
        left >= window.pageXOffset &&
        top + height <= window.pageYOffset + window.innerHeight &&
        left + width <= window.pageXOffset + window.innerWidth
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
    revert() {
      const item = this.focusNote;
      console.log("list revert item", item);
      if (!item) return;
      if (item.deleted) {
        console.log("revert", item);
        item.deleted = false;
        item.deleted_at = null;
        this.$mutateQueue({
          mutation: item.__typename.includes("_note")
            ? TRASH_NOTE
            : TRASH_PROJECT,
          variables: item,
        });
        this.removeItem(item);
      }
    },
    removeItem(item) {
      let next;
      const index = this.itemsCopy.findIndex(
        (it) => it.id == item.id && it.__typename == item.__typename
      );
      // console.log("index", index);
      // console.log(this.itemsCopy);

      this.$updateCache(item);

      this.$nextTick(() => {
        // console.log(this.itemsCopy);
        next = this.itemsCopy[index];
        if (!next) {
          const length = this.itemsCopy.length;
          next = this.itemsCopy[length - 1];
        }
        this.focusNote = next;
        // console.log("next item", next);
      });
    },
    deleteAll() {
      // const itemsToTrash = { notes: [], projects: [] };
      const itemsToDelete = { notes: [], projects: [] };
      this.items.forEach((item) => {
        if (item.deleted) {
          if (item.__typename.includes("_note")) {
            itemsToDelete.notes.push(item);
          } else {
            itemsToDelete.projects.push(item);
          }
        }
        //  else {
        //   item.deleted = true;
        //   item.deleted_at = new Date();
        //   if (item.__typename.includes("_note")) {
        //     itemsToTrash.notes.push(item);
        //   } else {
        //     itemsToTrash.projects.push(item);
        //   }
        // }
      });
      // if (itemsToTrash.notes.length) {
      //   this.$mutateQueue({
      //     mutation: TRASH_NOTES,
      //     variables: {
      //       objects: itemsToTrash.notes
      //     }
      //   })
      // }
      // if (itemsToTrash.projects.length) {
      //   this.$mutateQueue({
      //     mutation: TRASH_PROJECTS,
      //     variables: {
      //       objects: itemsToTrash.projects
      //     }
      //   })
      // }
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
    },
    trashNote() {
      const item = this.focusNote;
      console.log("trashNote!!!", item);
      if (!item) return;

      if (item.deleted) {
        // console.log("delete note!!");
        // item.permanentDeleted = true;
        // this.$apollo.mutate({
        //   mutation: item.__typename.includes("_note")
        //     ? DELETE_NOTE
        //     : DELETE_PROJECT,
        //   variables: {
        //     id: item.id,
        //   },
        // });
      } else {
        console.log("trash note!!");
        item.deleted = true;
        item.deleted_at = new Date();
        this.$mutateQueue({
          mutation: item.__typename.includes("_note")
            ? TRASH_NOTE
            : TRASH_PROJECT,
          variables: item,
        });
        this.removeItem(item);
      }
    },
    // removeFromCache(item, query) {
    //   const apolloClient = this.$apollo.provider.defaultClient;
    //   const cacheData = apolloClient.readQuery(query);
    //   console.log("removeFromCache data", cacheData);
    // },
    selectionDown() {
      const index = this.itemsCopy.findIndex(
        (it) =>
          it.id == this.focusNote.id &&
          it.__typename == this.focusNote.__typename
      );
      const next = this.itemsCopy[index + 1];
      if (next) this.setFocus(next);
    },
    selectionUp() {
      const index = this.itemsCopy.findIndex(
        (it) =>
          it.id == this.focusNote.id &&
          it.__typename == this.focusNote.__typename
      );
      const next = this.itemsCopy[index - 1];
      if (next) this.setFocus(next);
    },
    resetFocus() {
      // console.log("reset focus");
      this.setFocus(null);
      this.setEdit(null);
    },
    updatePositions() {
      console.log("update positions", this.itemsCopy);
      const notes = [];
      const projects = [];
      const update_columns = [this.positionColumn];
      if (this.when) update_columns.push("when");
      if (this.project) update_columns.push("project_id");
      let item;
      for (let i = 0; i < this.itemsCopy.length; i++) {
        item = this.itemsCopy[i];
        // console.log("note", item);
        // item = JSON.parse(JSON.stringify(item));
        item[this.positionColumn] = i;

        const { __typename, project, ...obj } = item;
        if (this.when) {
          obj.when = this.when ? toDatabaseString(this.when) : null;
          item.prevWhen = item.when;
          item.when = this.when;
        }

        if (this.project) {
          obj.project_id = this.project.id;
          item.prevProject = { ...item.project };
          item.project = this.project;
        }

        if (item.__typename.includes("_note")) {
          notes.push(obj);
        } else {
          projects.push(obj);
        }
        this.$updateCache(item, this.sortMethod);
      }

      if (notes.length) {
        this.$mutateQueue({
          mutation: SORT_NOTES,
          variables: {
            objects: notes,
            update_columns: update_columns,
          },
        });
      }
      if (projects.length) {
        this.$mutateQueue({
          mutation: SORT_PROJECTS,
          variables: {
            objects: projects,
            update_columns: update_columns,
          },
        });
      }
    },
    check(item) {
      console.log("check note", item);
      const type = item.__typename;
      this.$loading(true);
      item.done = !item.done;
      if (item.done) {
        item.completed_at = new Date();
      }
      if (this.checkTimeout) clearTimeout(this.checkTimeout);
      this.checkTimeout = setTimeout(() => {
        console.log("timeout", this.done, item.done === this.done);
        if (item.done === this.done && !this.keep) {
          this.removeItem(item);
        }
        this.$mutateQueue({
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
