<template>
  <timeline
    :config="config"
    :start="tomorrow"
    group-by="when"
    drop
    sort
    :timeline="7"
    icon="date_range"
    title="Upcoming"
    position-column="upcoming_position"
    update-when
  >
    <template v-slot:toolbar="{ addNote }">
      <q-btn icon="add" @click="addNote" />
    </template>
  </timeline>
</template>

<script>
import { defineComponent } from "vue";
const GET_UPCOMING = require("src/gql/queries/GetUpcoming.gql");
const SUBSCRIBE_UPCOMING_NOTES = require("src/gql/subscriptions/SubscribeUpcomingNotes.gql");
const SUBSCRIBE_UPCOMING_PROJECTS = require("src/gql/subscriptions/SubscribeUpcomingProjects.gql");
import Timeline from "src/components/Timeline.vue";
import { toDatabaseString, today, tomorrow } from "src/common/date.js";

export default defineComponent({
  name: "PageIndex",
  components: {
    Timeline,
  },
  data() {
    return {
      config: {
        query: GET_UPCOMING,
        notes_subscription: SUBSCRIBE_UPCOMING_NOTES,
        projects_subscription: SUBSCRIBE_UPCOMING_PROJECTS,
        variables: {
          user_id: this.$store.state.user.id,
          today: toDatabaseString(today()),
        },
      },
    };
  },
  computed: {
    tomorrow() {
      return tomorrow();
    },
  },
});
</script>
