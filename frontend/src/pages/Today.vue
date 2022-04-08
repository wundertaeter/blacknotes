<template>
  <project v-if="project" v-model="project" :deadline="today" sort-mode="today"/>
</template>

<script>
import { defineComponent } from "vue";
const GET_TODAY = require("src/gql/queries/GetToday.gql");
const SUBSCRIBE_TODAY_NOTES = require("src/gql/subscriptions/SubscribeTodayNotes.gql");
const SUBSCRIBE_TODAY_PROJECTS = require("src/gql/subscriptions/SubscribeTodayProjects.gql");
import Project from "src/components/Project.vue";

export default defineComponent({
  name: "PageIndex",
  components: {
    Project,
  },
  data() {
    return {
      project: { title: "Today", icon: "star", default: true, notes: [] },
      notes: null,
      projects: null,
    };
  },
  methods: {
    mergeList() {
      if (this.notes && this.projects) {
        this.project.notes = [...this.notes, ...this.projects].sort(
          (a, b) => new Date(a.today_position) - new Date(b.today_position)
        );
      }
    },
  },
  computed: {
    user() {
      return this.$store.state.user;
    },
    today() {
      return new Date();
    },
  },
  apollo: {
    active_notes: {
      query: GET_TODAY,
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
        query: SUBSCRIBE_TODAY_NOTES,
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
        query: SUBSCRIBE_TODAY_PROJECTS,
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
