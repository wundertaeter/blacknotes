<template>
  <q-page>
    <q-scroll-area class="fill-window">
      <div class="q-pa-md container">
        <h4>
          <q-icon name="account_circle" />
          Profile
        </h4>

        
      </div>
    </q-scroll-area>
    <q-footer class="fixed-bottom footer">
      <q-toolbar>
        <q-btn icon="logout" label="Logout" @click="logout" />
      </q-toolbar>
    </q-footer>
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
        this.$router.push("/login");
      });
    },
  },
};
</script>
