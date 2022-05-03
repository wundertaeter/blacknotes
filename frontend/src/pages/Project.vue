<template>
  <project
    v-if="currentProject"
    v-model="currentProject"
    more
    sort
    select
    :config="{
        notes_subscription: SUBSCRIBE_PROJECT,
        variables: {
          project_id: currentProject.id,
          done: currentProject.done ? {} : { _eq: false },
        },
      }"
    position-column="position"
  >
    <template v-slot:toolbar="{ addNote }">
      <q-btn icon="add" @click="addNote" />
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
  data() {
    return {
      config: null,
      SUBSCRIBE_PROJECT
    };
  },
  created(){
    if(!this.currentProject) this.$router.push('/today');
  },
  computed: {
    currentProject() {
      return this.$store.getters["user/getCurrentProject"];
    },
    user() {
      return this.$store.state.user;
    },
  },
});
</script>
