import { toDatabaseString } from "src/common/date";
import List from "src/components/list/List.vue";
const CREATE_NOTE = require("src/gql/mutations/CreateNote.gql");
const TRASH_PROJECT = require("src/gql/mutations/TrashProject.gql");
const TRASH_NOTE = require("src/gql/mutations/TrashNote.gql");
const CHECK_NOTE = require("src/gql/mutations/CheckNote.gql");
const CHECK_PROJECT = require("src/gql/mutations/CheckProject.gql");

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
      checkTimeout: null,
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
      if (this.sort) {
        if (this.positionColumn && component.items.some(item => item[this.positionColumn] === null)) {
          console.log('update POSITIONS from base', this.positionColumn, component.items);
          component.updatePositions();
        }
        //setTimeout(() => {
        //})
      }
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
      if(!item.deleted){
        item = { ...item, deleted: true, deleted_at: new Date() };
        this.$mutateQueue({
          mutation: item.__typename.includes("_note")
            ? TRASH_NOTE
            : TRASH_PROJECT,
          variables: item,
        });
        this.removeItem(item);
      }
    },
    check(item) {
      console.log("check note", item);
      this.$loading(true);
      if (this.checkTimeout) clearTimeout(this.checkTimeout);
      this.checkTimeout = setTimeout(() => {
        // we leave completed_at filled so that the timeline removeItem method can assing the item to a timeline date
        item = { ...item, done: !item.done, completed_at: item.done ? item.completed_at : toDatabaseString(new Date()) };
        this.$mutateQueue({
          mutation: item.__typename.includes("_note") ? CHECK_NOTE : CHECK_PROJECT,
          variables: item,
        });
        this.removeItem(item);
      }, 500);
    },
    addNote(e) {
      console.log('addNote', this.edit);
      e.stopPropagation();
      if (this.edit) return;
      const note = this.newNote();

      console.log('new note', note);

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