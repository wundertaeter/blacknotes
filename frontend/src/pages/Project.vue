<template>
  <project v-if="project" v-model="project" />
</template>

<script>
import { defineComponent } from "vue";
const GET_PROJECT = require("src/gql/queries/GetProject.gql");
const SUBSCRIBE_PROJECT = require("src/gql/subscriptions/SubscribeProject.gql");
import Project from "src/components/Project.vue";

export default defineComponent({
  name: "PageIndex",
  components: {
    Project,
  },
  computed: {
    currentProject() {
      return this.$store.getters["user/getCurrentProject"];
    },
    user(){
      return this.$store.state.user
    }
  },
  apollo: {
    project: {
      query: GET_PROJECT,
      variables() {
        return {
          id: this.currentProject.id,
        };
      },
      skip() {
        return !this.currentProject;
      },
      result(result){
        if(!result.data.project) this.$router.push('today');
      },
      subscribeToMore: {
        document: SUBSCRIBE_PROJECT,
        variables() {
          return {
            id: this.currentProject?.id,
          };
        },
        skip() {
          return !this.currentProject || this.user.loading;
        },
        updateQuery: (previousResult, { subscriptionData }) => {
          if (subscriptionData.data) {
            return { project: subscriptionData.data.project };
          }
          return previousResult;
        },
      },
    },
  },
});
</script>
