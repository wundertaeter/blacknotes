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
      selected: null,
      edit: null,
      listComponents: []
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
    done: {
      type: Boolean,
      required: false,
      default: true,
    },
    drop: {
      type: Boolean,
      required: false,
      default: false,
    },
    keep: {
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
  },
  methods: {
    listComponentMounted(component){
      component.updatePositions();
      this.listComponents.push(component);
    },
    revert(e) {
      e.stopPropagation();
      const item = {...this.selected, deleted: false, deleted_at: null}
      this.$mutateQueue({
        mutation: item.__typename.includes("_note")
          ? TRASH_NOTE
          : TRASH_PROJECT,
        variables: item,
      });
      this.removeItem(item);
    },
    setSelected(note) {
      this.selected = note;
    },
    reset() {
      console.log("reset");
      this.listComponents.forEach(component => component.reset());
    },
    setEdit(note) {
      this.edit = note;
    },
    scrollTo(item){
      this.listComponents.forEach(component => component.scrollTo(item));
    },
    onKeydown(e) {
      if (!this.edit && this.selected) {
        if (e.keyCode === 8) {
          this.trash(this.selected);
        } else if (e.keyCode == 38) {
          e.preventDefault();
          this.selectionUp();
          this.scrollTo(this.selected);
        } else if (e.keyCode == 40) {
          e.preventDefault();
          this.selectionDown();
          this.scrollTo(this.selected);
        }
      }
    },
    trash(item) {
      item = {...item, deleted: true, deleted_at: new Date()};
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
      e.stopPropagation();
      if (this.edit) return;
      const note = this.newNote();

      this.$updateCache(note);

      this.$nextTick(() => {
        this.edit = note;
        this.selected = note;
        this.$nextTick(() => {
          this.scrollTo(note)
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
