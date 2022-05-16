<template>
  <project
    v-if="project"
    v-model="project"
    more
    sort
    :config="{
      notes_subscription: SUBSCRIBE_PROJECT,
      variables: {
        project_id: id,
        done: project.done ? {} : { _eq: false },
      },
    }"
    position-column="position"
  >
    <template v-slot:toolbar="{ addNote }">
      <q-btn icon="add" flat @click="addNote" />
    </template>
  </project>
</template>

<script>
import { defineComponent } from "vue";
const SUBSCRIBE_PROJECT = require("src/gql/subscriptions/SubscribeProject.gql");
import Project from "src/components/Project.vue";

export default defineComponent({
  name: "PageIndex",
  components: {
    Project,
  },
  props: {
    id: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      config: null,
      SUBSCRIBE_PROJECT,
      unwatch: null,
    };
  },
  computed: {
    project() {
      return this.projects.find((project) => project.id == this.id);
    },
    projects() {
      return this.$store.state.user.projects;
    },
    user() {
      return this.$store.state.user;
    },
  },
});
</script>
