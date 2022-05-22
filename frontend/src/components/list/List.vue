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
      tag="transition-group"
      :component-data="{
          tag: 'div',
          type: 'transition-group',
          name: !drag ? 'flip-list' : null
      }"
      v-bind="dragOptions"
      :sort="sort"
      :drop="drop"
      xxremove="onRemove"
      @end="onEnd"
      :group="{ name: group, pull: drag, put: drop }"
      item-key="id"
    >
      <template #item="{ element }">
        <item
          :data-type="element.__typename.includes('_note') ? 'note' : 'project'"
          :id="element.id"
          @dragstart="dragStart"
          @click.stop="isMobile && (editItem ? editItem.id !== element.id && reset() : setEdit(element))"
          @mousedown="!isMobile && itemClicked(element, $event)"
          :selected="!isMobile && itemIsSelected(element)"
          :edited="editItem && editItem.id == element.id"
          class="note"
          :ref="`item-${element.id}`"
          v-model="itemsCopy[itemsCopy.indexOf(element)]"
          @update:modelValue="updateItem"
          @check="check"
          @edit="setEditItem"
          @dblclick="!isMobile && setEdit(element)"
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
const projects = ['anytime', 'logbook', 'upcoming'];
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
    selected: {
      type: Array,
      required: false,
    },
    edited: {
      required: false,
    },
    projectIndex: {
      required: false,
    },
    cacheKey: {
      required: true,
    },
    when: {
      type: String,
      required: false,
    },
    updateWhen: {
      required: false,
      default: false,
    },
    project: {
      type: Object,
      required: false,
    },
    updateProject: {
      required: false,
      default: false,
    },
  },
  methods: {
    updateItem(item) {
      this.$refs.multiclick.selectedItems[
        this.$refs.multiclick.selectedItems.findIndex((it) => it.id == item.id)
      ] = item;
    },
    multiDrop({ event, items }) {
      console.log("multiDrop", event, items, event.to.id);

      if (event.from !== event.to) {
        items.forEach(this.$refs.multiclick.appendToSelection);
      }

      const model = this.itemsCopy.filter(
        (item) => !items.find((it) => it.id == item.id)
      );

      if(projects.includes(this.cacheKey)){
        items.forEach((item) => {
          this.$store.commit("cache/removeProjects", {
            key: this.cacheKey,
            item,
          });
        });
      }else{
        items.forEach((item) => {
          this.$store.commit("cache/remove", {
            key: this.cacheKey,
            item,
          });
        });
      }

      this.itemsCopy = JSON.parse(
        JSON.stringify([
          ...model.slice(0, event.newIndex),
          ...items,
          ...model.slice(event.newIndex, model.length),
        ])
      );
      this.updatePositions();
    },
    onEnd(e) {
      console.log("on end", e.to.id, this.selectedItems, this.itemsCopy);
      if (e.from === e.to && e.newIndex === e.oldIndex) {
        return;
      }
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
    dragStart(e) {
      const notes = this.selectedItems
        .filter((item) => item.__typename.includes("_note"))
        .map((item) => ({ ...item, [this.positionColumn]: null }));
      e.dataTransfer.setData("notes", JSON.stringify(notes));
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
    cacheCommit() {
      // Update 'current' cache
      if (this.projectIndex === undefined) {
        this.$store.commit("cache/update", {
          key: this.cacheKey,
          items: this.itemsCopy,
        });
      } else {
        this.$store.commit("cache/updateOnIndex", {
          key: this.cacheKey,
          index: this.projectIndex,
          items: this.itemsCopy,
        });
      }
    },
    updatePositions() {
      console.log(
        "update positions",
        this.itemsCopy,
        this.updateWhen,
        this.when
      );
      const notes = [];
      const projects = [];
      const update_columns = [this.positionColumn];
      if (this.updateProject) update_columns.push("project_id");
      var when;
      if (this.updateWhen) {
        when = toDatabaseString(this.when);
        update_columns.push("when");
      }
      let item;
      for (let i = 0; i < this.itemsCopy.length; i++) {
        item = this.itemsCopy[i];

        item[this.positionColumn] = i;

        if (this.updateProject) {
          // Update 'project' cache
          if(item.project){
            this.$store.commit("cache/remove", { key: item.project.id, item });
          }
          item.project = { title: this.project.title, id: this.project.id };
          item.project_id = this.project.id;
          this.$store.commit("cache/add", { key: item.project.id, item });
        }

        if (this.updateWhen) {
          item.when = when;
        }

        const { __typename, project, multiclickId, ...obj } = item;

        if (__typename.includes("_note")) {
          notes.push(obj);
        } else {
          projects.push(obj);
        }
      }

      this.cacheCommit();

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
    dragOptions() {
      return {
        animation: 200,
        group: "description",
        disabled: !!this.editItem,
        ghostClass: "ghost",
        // chosenClass: "",
        // dragClass: "",
        delayOnTouchOnly: true,
        delay: 50,
      };
    },
    isMobile(){
      return this.$q.platform.is.mobile;
    }
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
.flip-list-move {
  transition: transform 0.5s;
}
.no-move {
  transition: transform 0s;
}
.ghost {
  opacity: 0.5;

}
.list-group {
  min-height: 20px;
}
.list-group-item {
  cursor: move;
}
.list-group-item i {
  cursor: pointer;
}
</style>
