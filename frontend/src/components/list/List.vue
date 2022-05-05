<template>
  <vue-multiclick
    @selected="onSelect"
    ref="multiclick"
    :items="allItemsCopy"
    uid="id"
    v-slot="{ itemIsSelected }"
  >
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
          @mousedown="itemClicked(element, $event)"
          :selected="itemIsSelected(element)"
          :edited="editItem && editItem.id == element.id"
          class="note"
          :ref="`item-${element.id}`"
          v-model="itemsCopy[itemsCopy.indexOf(element)]"
          @update:modelValue="updateItem"
          @check="check"
          @edit="setEditItem"
          @dblclick="setEdit(element)"
          :date-preview="datePreview"
        />
      </template>
    </draggable>
  </vue-multiclick>
</template>

<script>
import VueMulticlick from "src/components/VueMulticlick.vue";
import Item from "src/components/list/Item.vue";
import draggable from "vuedraggable";
import { toDatabaseString } from "src/common/date.js";
// import { scroll } from "quasar";
// const { getScrollTarget, setVerticalScrollPosition } = scroll;
import mitt from "mitt";
const bus = mitt();
const SORT_NOTES = require("src/gql/mutations/SortNotes.gql");
const SORT_PROJECTS = require("src/gql/mutations/SortProjects.gql");
// const DELETE_NOTE = require("src/gql/mutations/DeleteNoteByPk.gql");
// const DELETE_PROJECT = require("src/gql/mutations/DeleteProjectByPk.gql");
// const TRASH_NOTES = require("src/gql/mutations/TrashNotes.gql");
// const TRASH_PROJECTS = require("src/gql/mutations/TrashProjects.gql");
import { uuidv4 } from "src/common/utils";
export default {
  name: "NoteList",
  components: {
    Item,
    draggable,
    VueMulticlick,
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
      allItemsCopy: JSON.parse(JSON.stringify(props.allItems)),
      updateId: null,
      editItem: null,
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
    allItems: {
      handler(value) {
        this.allItemsCopy = JSON.parse(JSON.stringify(value));
      },
    },
    selected: {
      handler(value) {
        // console.log('whatch selected', value);
        this.setSelectedItems(value);
      },
    },
    edited: {
      handler(value) {
        // console.log('whatch edited', value);
        this.editItem = value;
      },
    },
  },
  props: {
    group: {
      type: String,
      required: false,
    },
    when: {
      type: String,
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
    items: {
      type: Array,
      required: true,
    },
    allItems: {
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
    updateItem(item) {
      this.$refs.multiclick.selectedItems[
        this.$refs.multiclick.selectedItems.findIndex((it) => it.id == item.id)
      ] = item;
    },
    multiDrop({ event, items }) {
      // this.itemsCopy = this.itemsCopy.filter(item => !items.some(it => it.id == item.id))
      var model = this.itemsCopy;
      if (event.from == event.to) {
        model = model.filter((item) => !items.find((it) => it.id == item.id));
      } else {
        items.forEach(this.$refs.multiclick.appendToSelection);
        items = items.filter(
          (item) => !this.itemsCopy.find((it) => it.id == item.id)
        );
      }

      this.itemsCopy = [
        ...model.slice(0, event.newIndex),
        ...JSON.parse(JSON.stringify(items)),
        ...model.slice(event.newIndex, model.length),
      ];
      this.updatePositions();
    },
    onEnd(e) {
      console.log("on end", e.to.id, this.selectedItems, this.itemsCopy);
      this.itemsCopy = this.itemsCopy.filter(
        (item) => !this.selectedItems.some((it) => it.id == item.id)
      );
      bus.emit(e.to.id, { event: e, items: this.selectedItems });
    },
    itemClicked(item, event) {
      // console.log('itemClicked', item);
      const multiclick = this.$refs.multiclick;
      if (!multiclick.itemIsSelected(item)) {
        multiclick.itemClicked(item, event);
      } else if (event.shiftKey) {
        multiclick.removeFromSelection(item, event);
      }
    },
    dragStart(e, item) {
      item = {...item, [this.positionColumn]: null};
      if (item.__typename.includes("_note")) {
        e.dataTransfer.setData("note", JSON.stringify(item));
      } else {
        e.dataTransfer.setData("project", JSON.stringify(item));
      }
    },
    onSelect(items) {
      this.$emit("select", items);
    },
    setSelectedItems(items) {
      // console.log('setSelectedItems list', items);
      this.$refs.multiclick?.setSelectedItems(items);
      this.selectedItems = items;
      if (items.length == 1) {
        this.$refs.multiclick?.setLastSelected(items[0]);
      }
    },
    setSelectedItem(item) {
      console.log("setSelectedItem ???????", item);
      this.setSelectedItems([item]);
      this.$refs.multiclick?.setLastSelected(item);
    },
    setEditItem(item) {
      this.editItem = item;
      this.$emit("edit", item);
    },
    setEdit(item) {
      this.setSelectedItem(item);
      this.setEditItem(item);
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
    selectNone() {
      this.$refs.multiclick?.selectNone();
    },
    reset() {
      // console.log("reset focus");
      this.selectNone();
      this.editItem = null;
    },
    updatePositions(updateCache) {
      console.log("update positions", this.itemsCopy);
      const notes = [];
      const projects = [];
      const update_columns = [this.positionColumn];
      if (this.when) update_columns.push("when");
      if (this.project) update_columns.push("project_id");
      let item;
      const when = this.when ? toDatabaseString(this.when) : null;
      for (let i = 0; i < this.itemsCopy.length; i++) {
        item = this.itemsCopy[i];

        item[this.positionColumn] = i;

        const { __typename, project, ...obj } = item;
        if (when) {
          if(when != item.when){
            item.when = when;
            // if(updateCache) this.$updateCache(item, true);
          }
          obj.when = when;
        }

        if (this.project) {
          if(item.project?.id != this.project?.id){
            item.prevProjectId = item.project.id;
            item.project = this.project;
            // this.$updateCache(item, true);
          }
          obj.project_id = this.project.id;
        }

        if (item.__typename.includes("_note")) {
          notes.push(obj);
        } else {
          projects.push(obj);
        }
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
      this.$emit("check", item);
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
