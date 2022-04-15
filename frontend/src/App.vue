<template>
  <router-view v-if="user.projects" />
</template>
<script>
import { defineComponent, computed } from "vue";
import { useQuasar, QSpinnerFacebook } from "quasar";
import { useStore } from "vuex";
const GET_USER_DATA = require("src/gql/queries/GetUserData.gql");
const SUBSCRIBE_PROJECTS = require("src/gql/subscriptions/SubscribeProjects.gql");

export default defineComponent({
  name: "App",
  setup() {
    console.log("App setup");
    const $q = useQuasar();
    $q.loading.show({
      spinner: QSpinnerFacebook,
      spinnerColor: "orange",
      spinnerSize: 140,
      // backgroundColor: 'purple',
      // message: 'Some important process is in progress. Hang on...',
      // messageColor: 'black'
    });
    $q.dark.set(true);
    const store = useStore();
    return {
      user: computed(() => store.state.user),
    };
  },
  apollo: {
    user: {
      query: GET_USER_DATA,
      fetchPolicy: "cache-first",
      variables() {
        return {
          id: this.user.id,
        };
      },
      result(result) {
        this.$store.commit("user/updateUser", result.data);
      },
      skip() {
        return !this.user.id;
      },
      subscribeToMore: {
        document: SUBSCRIBE_PROJECTS,
        variables() {
          return {
            user_id: this.user.id,
          };
        },
        skip() {
          return !this.user.id;
        },
        result(data) {
          this.$store.commit("user/updateProjects", data.projects);
        },
      },
    },
  },
});
</script>
