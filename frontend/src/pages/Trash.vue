<template>
  <project v-if="project" v-model="project" :sort="false" keep :config="config" :sort-by="sortBy">
    <template v-slot:toolbar="{revert}">
      <q-btn icon="replay" @click="revert" />
    </template>
  </project>
</template>

<script>
import { defineComponent } from "vue";
const GET_TRASH = require("src/gql/queries/GetTrash.gql");
const SUBSCRIBE_TRASH_NOTES = require("src/gql/subscriptions/SubscribeTrashNotes.gql");
const SUBSCRIBE_TRASH_PROJECTS = require("src/gql/subscriptions/SubscribeTrashProjects.gql");
import Project from "src/components/Project.vue";

export default defineComponent({
  name: "PageIndex",
  components: {
    Project,
  },
  data() {
    return {
      project: { title: "Trash", icon: "delete", default: true },
      config: {
        query: GET_TRASH,
        notes_subscription: SUBSCRIBE_TRASH_NOTES,
        projects_subscription: SUBSCRIBE_TRASH_PROJECTS,
        variables: {
          user_id: this.$store.state.user.id,
        },
      },
      sortBy: {
        column: 'deleted_at',
        desc: true,
        date: true,
      }
    };
  },
});
</script>
