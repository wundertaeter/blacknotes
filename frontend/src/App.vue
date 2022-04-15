<template>
  <router-view v-if="user.projects" />
</template>
<script>
import { defineComponent, computed } from "vue";
import { useQuasar, QSpinnerFacebook } from "quasar";
import { useStore } from "vuex";
const GET_USER_DATA = require("src/gql/queries/GetUserData.gql");
const SUBSCRIBE_PROJECTS = require("src/gql/subscriptions/SubscribeProjects.gql");
const GET_PROJECTS = require("src/gql/queries/GetProjects.gql");

export default defineComponent({
  name: "App",
  setup() {
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
    const user = computed(() => store.state.user);
    // watch(() => user.value.projects, $q.loading.hide);
    return {
      user,
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
    },
    projects: {
      query: GET_PROJECTS,
      fetchPolicy: "cache-first",
      variables() {
        return {
          user_id: this.user.id,
        };
      },
      skip() {
        return !this.user.id;
      },
      result(result) {
        let projects = result.data.projects.map((p) => {
          return { ...p, edit: !p.title };
        });
        this.$store.commit("user/updateProjects", projects);
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
          let projects = data.projects.map((p) => {
            return { ...p, edit: !p.title };
          });
          this.$store.commit("user/updateProjects", projects);
        },
      },
    },
  },
});
</script>
