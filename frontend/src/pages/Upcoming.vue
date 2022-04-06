<template>
  <timeline v-model="notes" :start="tomorrow" group-by="deadline" drop :timeline="7"/>
</template>

<script>
import { defineComponent } from "vue";
const GET_UPCOMING_NOTES = require("src/gql/queries/GetUpcomingNotes.gql");
const SUBSCRIBE_UPCOMING_NOTES = require("src/gql/subscriptions/SubscribeUpcomingNotes.gql");
import Timeline from "src/components/list/Timeline.vue";
import {
  toDatabaseString,
  today,
  tomorrow
} from "src/common/date.js";

export default defineComponent({
  name: "PageIndex",
  components: {
    Timeline
  },
  data(){
    return {
      notes: []
    }
  },
  computed: {
    user() {
      return this.$store.state.user;;
    },
    today() {
      return today();
    },
    tomorrow(){
      return tomorrow();
    }
  },
  apollo: {
    notes: {
      query: GET_UPCOMING_NOTES,
      variables() {
        return {
          user_id: this.user.id,
          today: toDatabaseString(this.today),
        };
      },
      skip() {
        return !this.user.id;
      },
      subscribeToMore: {
        document: SUBSCRIBE_UPCOMING_NOTES,
        variables() {
          return {
            user_id: this.user.id,
            today: toDatabaseString(this.today),
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
