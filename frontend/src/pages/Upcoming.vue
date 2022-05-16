<template>
  <upcoming
    :config="config"
    :start="tomorrow"
    group-by="when"
    icon="date_range"
    title="Upcoming"
    id="upcoming"
    position-column="upcoming_position"
  >
    <template v-slot:toolbar="{ addNote }">
      <q-btn icon="add" flat @click="addNote" />
    </template>
  </upcoming>
</template>

<script>
import { defineComponent } from "vue";
const SUBSCRIBE_UPCOMING_NOTES = require("src/gql/subscriptions/SubscribeUpcomingNotes.gql");
const SUBSCRIBE_UPCOMING_PROJECTS = require("src/gql/subscriptions/SubscribeUpcomingProjects.gql");
import Upcoming from "src/components/Upcoming.vue";
import { toDatabaseString, today, tomorrow } from "src/common/date.js";

export default defineComponent({
  name: "PageIndex",
  components: {
    Upcoming,
  },
  data() {
    return {
      config: {
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
