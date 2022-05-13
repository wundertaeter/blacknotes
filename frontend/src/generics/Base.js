import { date, toDatabaseString } from "src/common/date";
import { uuidv4 } from "src/common/utils";
import List from "src/components/list/List.vue";
const CREATE_NOTE = require("src/gql/mutations/CreateNote.gql");
const TRASH_PROJECTS = require("src/gql/mutations/TrashProjects.gql");
const TRASH_NOTES = require("src/gql/mutations/TrashNotes.gql");
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
    trash(e, set) {
      e.stopPropagation();
      const notes = [];
      const projects = [];
      this.selectedItems.forEach((item) => {
        item = { ...item, ...set }
        const { __typename, project, ...obj } = item;
        if (__typename.includes('_note')) {
          notes.push(obj);
        } else {
          projects.push(obj);
        }
        this.removeItem(item, false);
      })

      this.$store.commit('cache/save');

      if (notes.length) {
        this.$mutateQueue({
          mutation: TRASH_NOTES,
          variables: {
            objects: notes
          },
        });
      }

      if (projects.length) {
        this.$mutateQueue({
          mutation: TRASH_PROJECTS,
          variables: {
            objects: projects
          },
        });
      }
    },
    revert(e) {
      this.trash(e, { deleted: false, deleted_at: null });
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
    reset(e) {
      console.log("reset", e);
      // if(e.target.classList.contains('reset') || e.target.classList.contains('q-scrollarea__content')){
      this.listComponents.forEach((component) => component.reset());
      // }
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
          this.trash(e, { deleted: true, deleted_at: new Date() })
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
    check(item) {
      console.log("check note", item);
      this.$loading(true);
      if (this.checkTimeout) clearTimeout(this.checkTimeout);
      this.checkTimeout = setTimeout(() => {
        // we leave completed_at filled so that the timeline removeItem method can assing the item to a timeline date
        item = { ...item, completed_at: item.done ? new Date() : item.completed_at };
        this.$mutateQueue({
          mutation: item.__typename.includes("_note") ? CHECK_NOTE : CHECK_PROJECT,
          variables: item,
        });
        this.removeItem(item);
        if (item.__typename.includes('_note') && item.done && !item.deleted) {
          this.repeatNote(item);
        }

      }, 500);
    },
    repeatNote(note) {
      if (note.repeat) {
        const [unit, count] = note.repeat.split(':');
        const repeat = unit === 'week' ? { day: 7 * count } : { [unit]: count };
        const newNote = { ...note, id: uuidv4(), done: false, completed_at: null, when: toDatabaseString(date.addToDate(note.completed_at, repeat)) };
        this.$updateCache(newNote);
        this.createNote(newNote);
      }
    },
    createNote(note) {
      const { __typename, project, ...object } = note;
      this.$mutateQueue({
        mutation: CREATE_NOTE,
        variables: { object },
      });
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
      this.createNote(note);

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