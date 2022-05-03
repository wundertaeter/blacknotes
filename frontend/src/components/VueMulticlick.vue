<script>
import { h } from "vue";
export default {
  name: "vue-multiclick",
  props: {
    items: {
      type: Array,
      required: true,
    },
    uid: {
      type: String,
      required: true,
    },
    disableItems: {
      type: Array,
      required: false,
    },
  },
  data() {
    return {
      selectedItems: [],
      lastSelected: null,
    };
  },
  computed: {
    selectedIndexes() {
      return this.selectedItems.map((item) => this.items.indexOf(item));
    },
    lastSelectedIndex() {
      if (!this.lastSelected) {
        return -1;
      } else {
        return this.getItemIndex(this.lastSelected);
      }
    },
  },
  watch: {
    selectedItems() {
      this.$emit("selected", this.selectedItems);
    },
  },
  methods: {
    itemClicked(item, $event) {
      if (($event.metaKey || $event.ctrlKey) && !$event.shiftKey) {
        if (this.itemIsSelected(item)) {
          this.removeFromSelection(item);
        } else {
          this.appendToSelection(item);
        }
      } else if ($event.shiftKey) {
        this.setSelectedItemsFromLastSelected(item);
      } else {
        this.setSelectedItem(item);
      }
      this.lastSelected = item;
    },
    setLastSelected(item){
      this.lastSelected = item;
    },
    setSelectedItem(item) {
      if (this.itemIsDisabled(item)) return;
      this.selectedItems = [item];
    },
    setSelectedItems(items) {
      this.selectedItems = items;
    },
    setSelectedItemsFromLastSelected(item) {
      const itemIndex = this.getItemIndex(item);
      let itemsToSelect = [];

      if (!this.selectedItems.length) {
        itemsToSelect = this.getItemsFromRange(0, itemIndex);
      } else {
        itemsToSelect = this.getItemsFromRange(
          this.lastSelectedIndex,
          itemIndex
        );
      }
      itemsToSelect.forEach((i) => this.appendToSelection(i));
    },
    getItemsFromRange(start = 0, end = 0) {
      const items = [];
      const low = Math.min(start, end);
      const high = Math.max(start, end);

      for (let i = low; i <= high; i++) {
        items.push(this.items[i]);
      }

      return items;
    },
    appendToSelection(item) {
      if (this.itemIsDisabled(item)) return;
      if(!this.selectedItems.some(it => it[this.uid] == item[this.uid])){
        this.selectedItems.push(item)
      }
    },
    removeFromSelection(item) {
      this.selectedItems = this.selectedItems.filter(
        (i) => i[this.uid] !== item[this.uid]
      );
    },
    getItemIndex(item) {
      return this.items.findIndex((i) => {
        return i[this.uid] === item[this.uid];
      });
    },
    itemSelected(item) {
      console.warn(
        'The "itemSelected" method is deprecated in favour of "itemIsSelected" and will be removed in a future version.'
      );
      return this.itemIsSelected(item);
    },
    itemIsSelected(item) {
      return this.selectedItems.some((i) => i[this.uid] === item[this.uid]);
    },
    itemIsDisabled(item) {
      const disabled =
        this.disableItems && this.disableItems.some((it) => it.id == item.id);
      if (disabled && this.selectedItems.includes(item)) {
        this.removeFromSelection(item);
      }
      return disabled;
    },
    selectAll() {
      this.selectedItems = this.items;
    },
    selectNone() {
      this.selectedItems = [];
    },
  },
  render() {
    const $children =
      this.$slots.default &&
      this.$slots.default({
        selectedItems: this.selectedItems,
        lastSelectedItem: this.lastSelected,
        selectedIndexes: this.selectedIndexes,
        lastSelectedIndex: this.lastSelectedIndex,
        itemClicked: this.itemClicked,
        setSelectedItem: this.setSelectedItem,
        setSelectedItems: this.setSelectedItems,
        setSelectedItemsFromLastSelected: this.setSelectedItemsFromLastSelected,
        appendToSelection: this.appendToSelection,
        removeFromSelection: this.removeFromSelection,
        getItemIndex: this.getItemIndex,
        getItemsFromRange: this.getItemsFromRange,
        itemSelected: this.itemIsSelected,
        itemIsSelected: this.itemIsSelected,
        itemIsDisabled: this.itemIsDisabled,
        selectAll: this.selectAll,
        selectNone: this.selectNone,
      });

    return h("div", $children);
  },
};
</script>
