<template>
  <project v-if="project" v-model="project" :deadline="someday" sort-mode="someday"/>
</template>

<script>
import { defineComponent } from "vue";
const GET_SOMEDAY = require("src/gql/queries/GetSomeday.gql");
const SUBSCRIBE_SOMEDAY_PROJECTS = require("src/gql/subscriptions/SubscribeSomedayProjects.gql");
const SUBSCRIBE_SOMEDAY_NOTES = require("src/gql/subscriptions/SubscribeSomedayNotes.gql");
import Project from "src/components/Project.vue";

export default defineComponent({
  name: "PageIndex",
  components: {
    Project,
  },
  data() {
    return {
      project: { title: "Someday", icon: "unarchive", default: true, notes: [] },
      projects: null,
      notes: null,
    };
  },
  methods: {
     mergeList() {
      if (this.notes && this.projects) {
        this.project.notes = [...this.notes, ...this.projects].sort(
          (a, b) => a.someday_position - b.someday_position
        );
      }
    },
  },
  computed: {
    user() {
      return this.$store.state.user;
    },
    someday() {
      return new Date(0);
    },
  },
  apollo: {
    active_notes: {
      query: GET_SOMEDAY,
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
      active_notes: {
        query: SUBSCRIBE_SOMEDAY_NOTES,
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
        query: SUBSCRIBE_SOMEDAY_PROJECTS,
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
