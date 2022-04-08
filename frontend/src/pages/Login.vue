<template>
  <q-page>
    <q-scroll-area class="fill-window">
      <div class="q-pa-md container">
        <h4>
          <q-icon name="login" />
          Login
        </h4>

        <q-input v-model="username" type="username" label="username" />
        <q-input v-model="password" type="password" label="password" />
        <q-btn label="login" v-on:click="login" />
      </div>
    </q-scroll-area>
    <q-footer class="fixed-bottom footer">
      <q-toolbar>
       
      </q-toolbar>
    </q-footer>
  </q-page>
</template>

<script>
import { defineComponent } from "vue";

export default defineComponent({
  name: "PageIndex",
  data() {
    return {
      username: null,
      password: null,
    };
  },
  methods: {
    login() {
      if (!this.username || !this.password) return;
      console.log("login", this.username, this.password);
      // we still nedd the api service CSRF
      this.$axios
        .post("/login_view", {
          username: this.username,
          password: this.password,
        })
        .then((resp) => {
          console.log("login_view", resp);
          this.$store.commit("user/initUser", resp.data.user);
          this.$router.push("/");
        });
    },
  },
});
</script>
