<template>
  <router-view />
</template>
<script>
import { defineComponent } from "vue";
import { useQuasar } from "quasar";

const GET_USER_DATA = require("src/gql/queries/GetUserData.gql");
const SUBSCRIBE_PROJECTS = require("src/gql/subscriptions/SubscribeProjects.gql");

export default defineComponent({
  name: "App",
  setup() {
    const $q = useQuasar();
    $q.dark.set(true);
  },
  apollo: {
    user: {
      query: GET_USER_DATA,
      variables(){
        return {
          id: this.$store.state.user.id
        }
      },
      result(result){
        this.$store.commit("user/updateUser", result.data);
      },
      skip(){
        return !this.$store.state.user.id
      },
    },
    $subscribe: {
      projects: {
        query: SUBSCRIBE_PROJECTS,
        variables() {
          return {
            user_id: this.$store.state.user.id,
          };
        },
        skip() {
          return !this.$store.state.user.id;
        },
        result(result) {
          let projects = result.data.projects.map((p) => {
            return { ...p, edit: !p.title };
          });
          this.$store.commit('user/updateProjects', projects);
        },
      },
    },
  }
});
</script>
