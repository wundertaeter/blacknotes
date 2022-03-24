<template>
  <project v-if="project" v-model="project" />
</template>

<script>
import { defineComponent } from "vue";
const GET_LOGBOOK_NOTES = require("src/gql/queries/GetLogbookNotes.gql");
const SUBSCRIBE_LOGBOOK_NOTES = require("src/gql/subscriptions/SubscribeLogbookNotes.gql");
import Project from "src/components/Project.vue";

export default defineComponent({
  name: "PageIndex",
  components: {
    Project,
  },
  data() {
    return {
      project: { name: "Logbook", icon: "assignment_turned_in", default: true, notes: [] },
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
  },
  apollo: {
    notes: {
      query: GET_LOGBOOK_NOTES,
      variables() {
        return {
          user_id: this.user.id,
        };
      },
      skip() {
        return !this.user.id;
      },
      subscribeToMore: {
        document: SUBSCRIBE_LOGBOOK_NOTES,
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
