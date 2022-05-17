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

        <q-btn label="refresh" @click="refresh" />
      </div>
    </q-scroll-area>
    <q-footer class="fixed-bottom footer">
      <q-toolbar> </q-toolbar>
    </q-footer>
  </q-page>
</template>

<script>
import { defineComponent } from "vue";
import { CSRF } from "src/common/csrf_token.js";
export default defineComponent({
  name: "LoginView",
  data() {
    return {
      username: null,
      password: null,
    };
  },
  mounted(){
    if(this.$store.state.user.id){
      this.$router.push('profile');
    }
  },
  methods: {
    refresh() {
      this.$axios
        .post(
          process.env.DJANGO_URL + "/token/refresh/",
          {},
          {
            withCredentials: true,
          }
        )
        .then((resp) => {
          console.log("user refresh tokens", resp);
        });
    },
    login() {
      if (!this.username || !this.password) return;
      // we still nedd the api service CSRF
      this.$axios
        .post(
          process.env.DJANGO_URL + "/token/",
          {
            username: this.username,
            password: this.password,
          },
          {
            withCredentials: true,
            headers: {
              "content-type": "application/json",
            },
          }
        )
        .then(({data}) => {
          console.log("user tokens", data);
          this.$store.commit('user/updateAccessToken', data.access)
          this.$router.push("today");
        });
    },
  },
});
</script>
