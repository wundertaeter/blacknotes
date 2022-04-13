<template>
  <timeline
    :config="config"
    backwards
    :start="today"
    group-by="completed_at"
    icon="assignment_turned_in"
    title="Logbook"
    :drop="false"
  />
</template>

<script>
import { defineComponent } from "vue";
const GET_LOGBOOK = require("src/gql/queries/GetLogbook.gql");
const SUBSCRIBE_LOGBOOK_NOTES = require("src/gql/subscriptions/SubscribeLogbookNotes.gql");
const SUBSCRIBE_LOGBOOK_PROJECTS = require("src/gql/subscriptions/SubscribeLogbookProjects.gql");
import Timeline from "src/components/Timeline.vue";
import { today } from "src/common/date.js";

export default defineComponent({
  name: "PageIndex",
  components: {
    Timeline,
  },
  data() {
    return {
      config: {
        query: GET_LOGBOOK,
        notes_subscription: SUBSCRIBE_LOGBOOK_NOTES,
        projects_subscription: SUBSCRIBE_LOGBOOK_PROJECTS,
        variables: {
          user_id: this.$store.state.user.id,
        },
      },
    };
  },

  computed: {
    today() {
      return today();
    },
  },
});
</script>

