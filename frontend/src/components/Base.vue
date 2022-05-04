<script>
import List from "src/components/list/List.vue";
const CREATE_NOTE = require("src/gql/mutations/CreateNote.gql");
const TRASH_PROJECT = require("src/gql/mutations/TrashProject.gql");
const TRASH_NOTE = require("src/gql/mutations/TrashNote.gql");

export default {
  name: "BaseComponent",
  components: {
    List,
  },
  data() {
    return {
      projects: null,
      notes: null,
      selectedItems: [],
      edit: null,
      listComponents: [],
    };
  },
  mounted() {
    document.addEventListener("click", this.reset);
    document.addEventListener("keydown", this.onKeydown);
  },
  unmounted() {
    document.removeEventListener("click", this.reset);
    document.removeEventListener("keydown", this.onKeydown);
  },
  props: {
    when: {
      type: Object,
      required: false,
      default: null,
    },
    positionColumn: {
      type: String,
      required: false,
    },
    sort: {
      type: Boolean,
      required: false,
      default: false,
    },
    drop: {
      type: Boolean,
      required: false,
      default: false,
    },
    drag: {
      type: Boolean,
      required: false,
      default: false,
    },
    config: {
      type: Object,
      required: true,
    },
  },
  computed: {
    user() {
      return this.$store.state.user;
    },
    selectedItem() {
      return this.selectedItems[this.selectedItems.length - 1];
    },
  },
  methods: {
    listComponentMounted(component) {
      component.updatePositions();
      this.listComponents.push(component);
    },
    revert(e) {
      e.stopPropagation();
      this.selectedItems.forEach((item) => {
        item = { ...item, deleted: false, deleted_at: null };
        this.$mutateQueue({
          mutation: item.__typename.includes("_note")
            ? TRASH_NOTE
            : TRASH_PROJECT,
          variables: item,
        });
        this.removeItem(item);
      });
    },
    setEditItem(item) {
      this.edit = item;
    },
    setSelectedItems(items) {
      // console.log('setSelectedItems base', items);
      this.selectedItems = items;
    },
    setSelectedItem(item) {
      this.setSelectedItems(item ? [item] : []);
    },
    updateSelected(item) {
      const index = this.selectedItems.findIndex((it) => it.id == item.id);
      if (index >= 0) {
        this.selectedItems[index] = item;
      }
    },
    reset() {
      console.log("reset");
      this.listComponents.forEach((component) => component.reset());
    },
    setEdit(note) {
      if (note) {
        this.setSelectedItem(note);
      }
      this.edit = note;
    },
    scrollTo(item) {
      this.listComponents.forEach((component) => component.scrollTo(item));
    },
    onKeydown(e) {
      if (!this.edit && this.selectedItem) {
        if (e.keyCode === 8) {
          e.stopPropagation();
          this.selectedItems.forEach((item) => this.trash(item));
        } else if (e.keyCode == 38) {
          e.preventDefault();
          this.selectionUp();
          this.scrollTo(this.selectedItem);
        } else if (e.keyCode == 40) {
          e.preventDefault();
          this.selectionDown();
          this.scrollTo(this.selectedItem);
        }
      }
    },
    trash(item) {
      item = { ...item, deleted: true, deleted_at: new Date() };
      item.deleted = true;
      item.deleted_at = new Date();
      this.$mutateQueue({
        mutation: item.__typename.includes("_note")
          ? TRASH_NOTE
          : TRASH_PROJECT,
        variables: item,
      });
      this.removeItem(item);
    },
    sortMethod(a, b) {
      if (a[this.sortBy.column] === null) return 1;
      if (b[this.sortBy.column] === null) return -1;
      if (this.sortBy.date) {
        return this.sortBy.desc
          ? new Date(b[this.sortBy.column]) - new Date(a[this.sortBy.column])
          : new Date(a[this.sortBy.column]) - new Date(b[this.sortBy.column]);
      } else {
        return this.sortBy.desc
          ? b[this.sortBy.column] - a[this.sortBy.column]
          : a[this.sortBy.column] - b[this.sortBy.column];
      }
    },
    addNote(e) {
      console.log('addNote', this.edit);
      e.stopPropagation();
      if (this.edit) return;
      const note = this.newNote();

      this.$updateCache(note);

      this.$nextTick(() => {
        this.setEdit(note);
        this.$nextTick(() => {
          this.scrollTo(note);
        });
      });
      this.$mutateQueue({
        mutation: CREATE_NOTE,
        variables: note,
      });
    },
  },
  apollo: {
    $subscribe: {
      active_notes: {
        query() {
          return this.config.notes_subscription;
        },
        variables() {
          return this.config.variables;
        },
        skip() {
          return (
            !this.config.notes_subscription ||
            !this.user.id ||
            this.user.loading
          );
        },
        result({ data }) {
          console.log("note sub", data);
          this.notes = data.active_notes;
          this.updateCache();
        },
      },
      notes_project: {
        query() {
          return this.config.projects_subscription;
        },
        variables() {
          return this.config.variables;
        },
        skip() {
          return (
            !this.config.projects_subscription ||
            !this.user.id ||
            this.user.loading
          );
        },
        result({ data }) {
          console.log("project sub", data);
          this.projects = data.notes_project;
          this.updateCache();
        },
      },
    },
  },
};
</script>
