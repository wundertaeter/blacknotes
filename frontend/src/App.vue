<template>
  <router-view v-if="userProjects" />
</template>
<script>
import { defineComponent } from "vue";
import { QSpinnerFacebook } from "quasar";
const GET_USER_DATA = require("src/gql/queries/GetUserData.gql");
const SUBSCRIBE_PROJECTS = require("src/gql/subscriptions/SubscribeProjects.gql");

export default defineComponent({
  name: "App",
  created() {
    this.$q.loading.show({
      spinner: QSpinnerFacebook,
      spinnerColor: "orange",
      spinnerSize: 140,
      // backgroundColor: 'purple',
      // message: 'Some important process is in progress. Hang on...',
      // messageColor: 'black'
    });
    this.$q.dark.set(true);
  },
  computed: {
    userId() {
      return this.$store.state.user.id;
    },
    userProjects() {
      return this.$store.state.user.projects;
    },
  },
  apollo: {
    user: {
      query: GET_USER_DATA,
      fetchPolicy: "cache-first",
      variables() {
        return {
          id: this.userId,
        };
      },
      result(result) {
        this.$store.commit("user/updateUser", result.data);
      },
      skip() {
        return !this.userId;
      },
      subscribeToMore: {
        document: SUBSCRIBE_PROJECTS,
        variables() {
          return {
            user_id: this.userId,
          };
        },
        skip() {
          return !this.userId || !this.user;
        },
        result(data) {
          if (data.projects) {
            this.$store.commit("user/updateProjects", data.projects);
          }
        },
        updateQuery: (previousResult, { subscriptionData }) => {
          if (previousResult.projects && previousResult.user) {
            return {
              ...previousResult,
              projects: subscriptionData.data.projects,
            };
          }
        },
      },
    },
  },
});
</script>
