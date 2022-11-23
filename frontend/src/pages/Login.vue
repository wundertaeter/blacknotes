<template>
  <q-page>
    <q-scroll-area class="fill-window">
      <div class="q-pa-md container">
        <h4>
          <q-icon name="login" />
          Login
        </h4>
        <q-card>
          <q-card-section class="bg-primary text-white">
            <q-input
              borderless
              v-model="username"
              type="text"
              name="username"
              label="username"
              :rules="[(value) => !!value || 'required']"
              @keydown.enter="login"
            />
            <q-input
              borderless
              v-model="password"
              type="password"
              name="password"
              label="password"
              :rules="[(value) => !!value || 'required']"
              @keydown.enter="login"
            />
          </q-card-section>
          <q-separator />
          <q-card-actions align="left">
            <q-btn label="login" flat v-on:click="login" />
          </q-card-actions>
        </q-card>
        <router-link to="register" class="register-now">register now</router-link>
      </div>
    </q-scroll-area>
    <q-footer class="fixed-bottom footer">
      <q-toolbar> </q-toolbar>
    </q-footer>
  </q-page>
</template>

<script>
import { defineComponent } from "vue";
export default defineComponent({
  name: "LoginView",
  data() {
    return {
      username: null,
      password: null,
    };
  },
  mounted() {
    if (this.$store.state.user.id) {
      this.$router.push("profile");
    }
  },
  methods: {
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
        .then(({ data }) => {
          console.log("user tokens", data);
          this.$store.commit("user/updateAccessToken", data.access);
          this.$router.push("/");
        });
    },
    register(){
      
    }
  },
});
</script>
<style lang="scss">
@import "../css/quasar.variables.scss";
input:-webkit-autofill {
  -webkit-box-shadow: 200px 200px 100px $orange inset;
  box-shadow: 200px 200px 100px $orange inset;
}
.register-now{
  color: orange;
  margin-right: 5px;
  float: right;
}
</style>
