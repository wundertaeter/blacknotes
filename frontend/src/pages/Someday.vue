<template>
  <project
    v-if="project"
    v-model="project"
    :deadline="someday"
    :config="config"
    position-column="someday_position"
  >
    <template v-slot:toolbar="{ addNote }">
      <q-btn icon="add" @click="addNote" />
    </template>
  </project>
</template>

<script>
import { defineComponent } from "vue";
const GET_SOMEDAY = require("src/gql/queries/GetSomeday.gql");
const SUBSCRIBE_SOMEDAY_PROJECTS = require("src/gql/subscriptions/SubscribeSomedayProjects.gql");
const SUBSCRIBE_SOMEDAY_NOTES = require("src/gql/subscriptions/SubscribeSomedayNotes.gql");
import Project from "src/components/Project.vue";

export default defineComponent({
  name: "PageIndex",
  components: {
    Project,
  },
  data() {
    return {
      project: { title: "Someday", icon: "unarchive", default: true },
      config: {
        query: GET_SOMEDAY,
        notes_subscription: SUBSCRIBE_SOMEDAY_NOTES,
        projects_subscription: SUBSCRIBE_SOMEDAY_PROJECTS,
        variables: {
          user_id: this.$store.state.user.id,
        },
      },
    };
  },
  computed: {
    someday() {
      return new Date(0);
    },
  },
});
</script>
