<template>
  <q-page>
    <h1>Profile</h1>
    <q-btn icon="logout" label="Logout" @click="logout" />
  </q-page>
</template>

<script>
export default {
  methods: {
    logout() {
      this.$axios.get("/logout_view").then((resp) => {
        console.log("logout", resp);
        this.$store.commit("user/initUser", {});
        this.$store.commit("user/updateProjects", []);
        this.$router.push('/login');
      });
    },
  },
};
</script>
