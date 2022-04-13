<template>
  <project v-if="project" v-model="project" position-column="anytime_position" :config="config">
    <template v-slot:toolbar="{addNote}">
      <q-btn icon="add" @click="addNote" />
    </template>
  </project>
</template>

<script>
import { defineComponent } from "vue";
const GET_ANYTIME_NOTES = require("src/gql/queries/GetAnytime.gql");
const SUBSCRIBE_ANYTIME_NOTES = require("src/gql/subscriptions/SubscribeAnytimeNotes.gql");
import Project from "src/components/Project.vue";

export default defineComponent({
  name: "PageIndex",
  components: {
    Project,
  },
  data() {
    return {
      project: { name: "Anytime", icon: "reorder", default: true },
      config: {
        query: GET_ANYTIME_NOTES,
        notes_subscription: SUBSCRIBE_ANYTIME_NOTES,
        variables: {
          user_id: this.$store.state.user.id,
        },
      },
    };
  },
});
</script>
