<template>
  <project
    v-if="project"
    v-model="project"
    :config="config"
    :when="today"
    sort
    position-column="today_position"
  >
    <template v-slot:toolbar="{ addNote, trash, edit, selectedItems }">
      <q-btn icon="add" :disabled="edit" flat @click.stop="addNote" />
      <q-space />
      <q-btn icon="delete" flat @click="trash" :disabled="!selectedItems.length"/>
    </template>
  </project>
</template>

<script>
import { defineComponent } from "vue";
const SUBSCRIBE_TODAY_NOTES = require("src/gql/subscriptions/SubscribeTodayNotes.gql");
const SUBSCRIBE_TODAY_PROJECTS = require("src/gql/subscriptions/SubscribeTodayProjects.gql");
import Project from "src/components/Project.vue";
import { toDatabaseString, today } from "src/common/date";
export default defineComponent({
  name: "PageIndex",
  components: {
    Project,
  },
  data() {
    return {
      project: { title: "Today", icon: "star", default: true, id: "today" },
      config: {
        notes_subscription: SUBSCRIBE_TODAY_NOTES,
        projects_subscription: SUBSCRIBE_TODAY_PROJECTS,
        variables: {
          user_id: this.$store.state.user.id,
          today: toDatabaseString(today()),
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
