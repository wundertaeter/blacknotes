<template>
  <router-view v-if="userProjects" />
</template>
<script>
import { defineComponent } from "vue";
import { QSpinnerFacebook } from "quasar";
const GET_USER_DATA = require("src/gql/queries/GetUserData.gql");
const SUBSCRIBE_PROJECTS = require("src/gql/subscriptions/SubscribeProjects.gql");
const SUBSCRIBE_FRIENDS = require("src/gql/subscriptions/SubscribeFriends.gql");
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
    this.$store.commit("cache/load");
    if(!this.userId){
      this.$q.dark.set(true);
    }
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
      variables() {
        return {
          id: this.userId,
        };
      },
      result(result) {
        this.$q.dark.set(!result.data.user.profile.white_mode);
        this.$store.commit("user/updateUser", result.data);
      },
      skip() {
        return !this.userId;
      },
    },
    $subscribe: {
      projects: {
        query: SUBSCRIBE_PROJECTS,
        variables() {
          return {
            user_id: this.userId,
          };
        },
        skip() {
          return !this.userId || !this.user || this.user.loading;
        },
        result(result) {
          if (result.data.projects) {
            this.$store.commit("user/updateUser", result.data);
          }
        },
      },
      friends: {
        query: SUBSCRIBE_FRIENDS,
        variables() {
          return {
            user_id: this.userId,
          };
        },
        skip() {
          return !this.userId || !this.user || this.user.loading;
        },
        result(result) {
          if (result.data.friends) {
            this.$store.commit("user/updateUser", result.data);
          }
        },
      },
    },
  },
});
</script>
