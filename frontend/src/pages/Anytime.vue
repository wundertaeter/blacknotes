<template>
  <projects
    title="Anytime"
    icon="reorder"
    position-column="anytime_position"
    :config="config"
  >
    <template v-slot:toolbar="{ addNote }">
      <q-btn icon="add" @click="addNote" />
    </template>
  </projects>
</template>

<script>
import { defineComponent } from "vue";
const GET_ANYTIME = require("src/gql/queries/GetAnytime.gql");
const SUBSCRIBE_ANYTIME_NOTES = require("src/gql/subscriptions/SubscribeAnytimeNotes.gql");
const SUBSCRIBE_ANYTIME_PROJECTS = require("src/gql/subscriptions/SubscribeAnytimeProjects.gql");
import Projects from "src/components/Projects.vue";

export default defineComponent({
  name: "PageIndex",
  components: {
    Projects,
  },
  data() {
    return {
      config: {
        query: GET_ANYTIME,
        notes_subscription: SUBSCRIBE_ANYTIME_NOTES,
        projects_subscription: SUBSCRIBE_ANYTIME_PROJECTS,
        variables: {
          user_id: this.$store.state.user.id,
        },
      },
    };
  },
});
</script>
