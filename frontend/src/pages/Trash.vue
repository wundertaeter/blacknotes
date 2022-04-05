<template>
  <project v-if="project" v-model="project" :sort="false" />
</template>

<script>
import { defineComponent } from "vue";
const SUBSCRIBE_TRASH_NOTES = require("src/gql/subscriptions/SubscribeTrashNotes.gql");
const GET_TRASH_NOTES = require("src/gql/queries/GetTrashNotes.gql");
const SUBSCRIBE_TRASH_PROJECTS = require("src/gql/subscriptions/SubscribeTrashProjects.gql");
const GET_TRASH_PROJECTS = require("src/gql/queries/GetTrashProjects.gql");
import Project from "src/components/Project.vue";

export default defineComponent({
  name: "PageIndex",
  components: {
    Project,
  },
  data() {
    return {
      project: { title: "Trash", icon: "delete", default: true, notes: [] },
      projects: [],
      notes: [],
    };
  },
  watch: {
    notes: {
      handler(notes) {
        this.project.notes = notes;
      },
      deep: true,
    },
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
    notes: {
      query: GET_TRASH_NOTES,
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
        this.mergeList();
      },
      subscribeToMore: {
        document: SUBSCRIBE_TRASH_NOTES,
        variables() {
          return {
            user_id: this.user.id,
          };
        },
        skip() {
          return !this.user.id;
        },
        result(data) {
          console.log("result sub", data);
          this.mergeList();
        },
        updateQuery: (previousResult, { subscriptionData }) => {
          if (subscriptionData.data) {
            return { notes: subscriptionData.data.notes };
          }
          return previousResult;
        },
      },
    },
    projects: {
      query: GET_TRASH_PROJECTS,
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
        this.mergeList();
      },
      subscribeToMore: {
        document: SUBSCRIBE_TRASH_PROJECTS,
        variables() {
          return {
            user_id: this.user.id,
          };
        },
        skip() {
          return !this.user.id;
        },
        result(data) {
          console.log("result sub", data);
          this.mergeList();
        },
        updateQuery: (previousResult, { subscriptionData }) => {
          if (subscriptionData.data) {
            return { projects: subscriptionData.data.projects };
          }
          return previousResult;
        },
      },
    },
  },
});
</script>
