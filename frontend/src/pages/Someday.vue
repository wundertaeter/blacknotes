<template>
  <project v-if="project" v-model="project" :deadline="someday"/>
</template>

<script>
import { defineComponent } from "vue";
const GET_SOMEDAY_NOTES = require("src/gql/queries/GetSomedayNotes.gql");
const SUBSCRIBE_SOMEDAY_NOTES = require("src/gql/subscriptions/SubscribeSomedayNotes.gql");
import Project from "src/components/Project.vue";

export default defineComponent({
  name: "PageIndex",
  components: {
    Project,
  },
  data() {
    return {
      project: { name: "Someday", icon: "unarchive", default: true, notes: [] },
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
  methods: {},
  computed: {
    user() {
      return this.$store.state.user;
    },
    someday() {
      return new Date(0);
    },
  },
  apollo: {
    notes: {
      query: GET_SOMEDAY_NOTES,
      variables() {
        return {
          user_id: this.user.id,
        };
      },
      skip() {
        return !this.user.id;
      },
      subscribeToMore: {
        document: SUBSCRIBE_SOMEDAY_NOTES,
        variables() {
          return {
            user_id: this.user.id,
          };
        },
        skip() {
          return !this.user.id;
        },
        updateQuery: (previousResult, { subscriptionData }) => {
          if (subscriptionData.data) {
            return { notes: subscriptionData.data.notes };
          }
          return previousResult;
        },
      },
    },
  },
});
</script>
