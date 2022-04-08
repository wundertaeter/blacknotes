<template>
  <project v-if="project" v-model="project" :sort="false" keep />
</template>

<script>
import { defineComponent } from "vue";
const SUBSCRIBE_TRASH_NOTES = require("src/gql/subscriptions/SubscribeTrashNotes.gql");
const GET_TRASH = require("src/gql/queries/GetTrash.gql");
const SUBSCRIBE_TRASH_PROJECTS = require("src/gql/subscriptions/SubscribeTrashProjects.gql");
import Project from "src/components/Project.vue";

export default defineComponent({
  name: "PageIndex",
  components: {
    Project,
  },
  data() {
    return {
      project: { title: "Trash", icon: "delete", default: true, notes: [] },
      projects: null,
      notes: null,
    };
  },
  methods: {
    mergeList() {
      if (this.notes && this.projects) {
        this.project.notes = [...this.notes, ...this.projects].sort(
          (a, b) => new Date(b.deleted_at) - new Date(a.deleted_at)
        );
      }
    },
  },
  computed: {
    user() {
      return this.$store.state.user;
    },
  },
  apollo: {
    active_notes: {
      query: GET_TRASH,
      variables() {
        return {
          user_id: this.user.id,
        };
      },
      skip() {
        return !this.user.id;
      },
      result({ data }) {
        console.log("result", data);
        this.notes = data.active_notes;
        this.projects = data.notes_project;
        this.mergeList();
        this.$apollo.skipAllQueries = true;
      },
    },
    $subscribe: {
      note_note: {
        query: SUBSCRIBE_TRASH_NOTES,
        variables() {
          return {
            user_id: this.user.id,
          };
        },
        skip() {
          return !this.user.id || this.user.loading;
        },
        result({ data }) {
          console.log("note sub", data);
          this.notes = data.active_notes;
          this.mergeList();
        },
      },
      notes_project: {
        query: SUBSCRIBE_TRASH_PROJECTS,
        variables() {
          return {
            user_id: this.user.id,
          };
        },
        skip() {
          return !this.user.id || this.user.loading;
        },
        result({ data }) {
          console.log("project sub", data);
          this.projects = data.notes_project;
          this.mergeList();
        },
      },
    },
  },
});
</script>
