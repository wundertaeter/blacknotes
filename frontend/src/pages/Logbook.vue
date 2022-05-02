<template>
  <timeline
    :config="config"
    backwards
    :start="today"
    group-by="completed_at"
    icon="assignment_turned_in"
    title="Logbook"
    id="logbook"
    :drop="false"
  />
</template>

<script>
import { defineComponent } from "vue";
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
      // const user_id = this.$store.state.user.id;
      // const where = {_and: {user_id: {_eq: user_id}, deleted: {_eq: false}, done: {_eq: true}}};
      // const group_by = {completed_at: desc};
      config: {
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

