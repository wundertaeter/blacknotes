<template>
  <project
    v-if="project"
    v-model="project"
    :when="someday"
    :config="config"
    sort
    position-column="someday_position"
  >
    <template v-slot:toolbar="{ addNote }">
      <q-btn icon="add" flat @click="addNote" />
    </template>
  </project>
</template>

<script>
import { defineComponent } from "vue";
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
      project: {
        title: "Someday",
        icon: "unarchive",
        default: true,
        id: "someday",
      },
      config: {
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
