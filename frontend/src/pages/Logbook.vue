<template>
  <project v-if="project" v-model="project" :sort="false" :done="false" />
</template>

<script>
import { defineComponent } from "vue";
const SUBSCRIBE_LOGBOOK_NOTES = require("src/gql/subscriptions/SubscribeLogbookNotes.gql");
const SUBSCRIBE_LOGBOOK_PROJECTS = require("src/gql/subscriptions/SubscribeLogbookProjects.gql");
import Project from "src/components/Project.vue";

export default defineComponent({
  name: "PageIndex",
  components: {
    Project,
  },
  data() {
    return {
      project: {
        title: "Logbook",
        icon: "assignment_turned_in",
        default: true,
        notes: [],
      },
      projects: [],
      notes: [],
    };
  },
  methods: {
    mergeList() {
      this.project.notes = [...this.notes, ...this.projects].sort(
        (a, b) => new Date(a.deadline) - new Date(b.deadline)
      );
    },
  },
  computed: {
    user() {
      return this.$store.state.user;
    },
  },
  apollo: {
    $subscribe: {
      projects: {
        query: SUBSCRIBE_LOGBOOK_PROJECTS,
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
          this.projects = data.projects;
          this.mergeList();
        },
      },
      notes: {
        query: SUBSCRIBE_LOGBOOK_NOTES,
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
          this.notes = data.notes;
          this.mergeList();
        },
      },
    },
  },
});
</script>
