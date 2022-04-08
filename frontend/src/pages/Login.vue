<template>
  <q-page class="flex flex-center">
    <div class="q-pa-md" style="width: 50%">
      
        <q-input v-model="username" type="username" label="username" />
        <q-input v-model="password" type="password" label="password" />
        <q-btn label="login" v-on:click="login" />
    
    </div>
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
          this.$store.commit('user/initUser', resp.data.user);
          this.$router.push('/')
        });
    },
  },
});
</script>
