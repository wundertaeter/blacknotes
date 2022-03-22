<template>
  <router-view />
</template>
<script>
import { defineComponent } from "vue";
import { useQuasar } from "quasar";

import GET_USER_DATA from "src/gql/queries/GetUserData.gql";

export default defineComponent({
  name: "App",
  setup() {
    const $q = useQuasar();
    $q.dark.set(true);
  },
  created() {
    this.$axios.get("/get_user").then((resp) => {
      this.$store.commit("user/initUser", resp.data);
    });
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
    
  }
});
</script>
