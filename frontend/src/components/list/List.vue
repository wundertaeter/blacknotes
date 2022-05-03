<template>
  <draggable
    :id="id"
    v-model="itemsCopy"
    :sort="sort"
    :drop="drop"
    @end="onEnd"
    :group="{ name: group, pull: drag, put: drop }"
    item-key="id"
  >
    <template #item="{ element }">
      <item
        :data-type="element.__typename.includes('_note') ? 'note' : 'project'"
        :id="element.id"
        @dragstart="(e) => dragStart(e, element)"
        @click.stop
        @mousedown="setSelected(element)"
        :focused="selectedItems.some((item) => item.id == element.id)"
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
import Item from "src/components/list/Item.vue";
import draggable from "vuedraggable";
import mitt from "mitt";
import { toDatabaseString } from "src/common/date.js";
// import { scroll } from "quasar";
// const { getScrollTarget, setVerticalScrollPosition } = scroll;
const bus = mitt();
const SORT_NOTES = require("src/gql/mutations/SortNotes.gql");
const SORT_PROJECTS = require("src/gql/mutations/SortProjects.gql");
// const DELETE_NOTE = require("src/gql/mutations/DeleteNoteByPk.gql");
// const DELETE_PROJECT = require("src/gql/mutations/DeleteProjectByPk.gql");
const CHECK_NOTE = require("src/gql/mutations/CheckNote.gql");
const CHECK_PROJECT = require("src/gql/mutations/CheckProject.gql");
const DELETE_PROJECTS = require("src/gql/mutations/DeleteProjects.gql");
const DELETE_NOTES = require("src/gql/mutations/DeleteNotes.gql");
// const TRASH_NOTES = require("src/gql/mutations/TrashNotes.gql");
// const TRASH_PROJECTS = require("src/gql/mutations/TrashProjects.gql");
import { uuidv4 } from "src/common/utils";
export default {
  name: "NoteList",
  components: {
    Item,
    draggable,
  },
  mounted() {
    bus.on(this.id, this.multiDrop);
    this.$emit("mounted", this);
  },
  unmounted() {
    bus.off(this.id, this.multiDrop);
  },
  data(props) {
    return {
      itemsCopy: JSON.parse(JSON.stringify(props.items)),
      updateId: null,
      editNote: null,
      checkTimeout: null,
      selectedItems: [],
      trigger: 0,
      id: uuidv4(),
    };
  },
  watch: {
    items: {
      handler(value) {
        this.itemsCopy = JSON.parse(JSON.stringify(value));
      },
    },
    selected: {
      handler(value) {
        this.selectedItems = value;
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
    selected: {
      type: Array,
      required: false,
    },
    edited: {
      required: false,
    },
  },
  methods: {
    multiDrop({ event, items }) {
      console.log("multidrop !!");
      var model = this.itemsCopy;
      if (event.from == event.to) {
        model = model.filter((item) => !items.find((it) => it.id == item.id));
      } else {
        // items.forEach(this.$refs.multiclick.appendToSelection);
        items = items.filter(
          (item) => !this.itemsCopy.find((it) => it.id == item.id)
        );
      }
      this.itemsCopy = [
        ...model.slice(0, event.newIndex),
        ...items,
        ...model.slice(event.newIndex, model.length),
      ];
      this.updatePositions();
    },
    onEnd(e) {
      console.log("on end", e.to.id);
      bus.emit(e.to.id, { event: e, items: this.selectedItems });
    },
    itemClicked(item, event) {
      const multiclick = this.$refs.multiclick;
      if (!multiclick.itemIsSelected(item)) {
        multiclick.itemClicked(item, event);
      } else if (event.shiftKey) {
        multiclick.removeFromSelection(item, event);
      }
    },
    dragStart(e, item) {
      item[this.positionColumn] = null;
      if (item.__typename.includes("_note")) {
        e.dataTransfer.setData("note", JSON.stringify(item));
      } else {
        e.dataTransfer.setData("project", JSON.stringify(item));
      }
    },
    setSelected(note) {
      console.log('emit select');
      this.$emit("select", [note]);
    },
    setEditNote(note) {
      this.editNote = note;
      this.$emit("edit", note);
    },
    setEdit(note) {
      this.setSelected([note]);
      this.setEditNote(note);
    },
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
        // console.log("this.selectedItems", this.selectedItems);
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

    reset() {
      // console.log("reset focus");
      this.setSelected(null);
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

        item[this.positionColumn] = i;

        const { __typename, project, ...obj } = item;
        if (this.when) {
          obj.when = this.when ? toDatabaseString(this.when) : null;
          item.when = this.when;
        }

        if (this.project) {
          obj.project_id = this.project.id;
          item.project = this.project;
        }

        if (item.__typename.includes("_note")) {
          notes.push(obj);
        } else {
          projects.push(obj);
        }

        this.$updateCache(item);
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
};
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
