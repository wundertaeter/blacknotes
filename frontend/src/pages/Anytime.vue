<template>
  <projects
    title="Anytime"
    id="anytime"
    icon="reorder"
    position-column="anytime_position"
    sort
    select
    :config="config"
  >
    <template v-slot:toolbar="{ addNote }">
      <q-btn icon="add" @click="addNote" />
    </template>
  </projects>
</template>

<script>
import { defineComponent } from "vue";
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
