<template>
  <project v-if="project" v-model="project"/>
</template>

<script>
import { defineComponent } from "vue";
const GET_ANYTIME_NOTES = require("src/gql/queries/GetAnytimeNotes.gql");
const SUBSCRIBE_ANYTIME_NOTES = require("src/gql/subscriptions/SubscribeAnytimeNotes.gql");
import Project from "src/components/Project.vue";

export default defineComponent({
  name: "PageIndex",
  components: {
    Project,
  },
  data() {
    return {
      project: { name: "Anytime", icon: "reorder", default: true, notes: [] },
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
    today() {
      return new Date();
    },
  },
  apollo: {
    notes: {
      query: GET_ANYTIME_NOTES,
      variables() {
        return {
          user_id: this.user.id,
        };
      },
      skip() {
        return !this.user.id;
      },
      subscribeToMore: {
        document: SUBSCRIBE_ANYTIME_NOTES,
        variables() {
          return {
            user_id: this.user.id,
          };
        },
        skip() {
          return !this.user.id || this.user.loading;;
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
