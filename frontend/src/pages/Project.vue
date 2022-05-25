<template>
  <project
    v-if="project"
    v-model="project"
    more
    sort
    :config="{
      notes_subscription: project.done ? SUBSCRIBE_DONE_PROJECT: SUBSCRIBE_PROJECT,
      variables: {
        project_id: id,
      },
    }"
    position-column="position"
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
const SUBSCRIBE_PROJECT = require("src/gql/subscriptions/SubscribeProject.gql");
const SUBSCRIBE_DONE_PROJECT = require("src/gql/subscriptions/SubscribeDoneProject.gql");
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
      SUBSCRIBE_DONE_PROJECT,
      unwatch: null,
    };
  },
  computed: {
    project() {
      console.log('this.projects', this.projects);
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
