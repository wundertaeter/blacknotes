<template>
  <q-page>
    <q-scroll-area class="fill-window">
      <div class="q-pa-md container">
        <h4>
          <q-icon name="register" />
          register
        </h4>
        <q-card>
          <q-card-section class="bg-primary text-white">
            <q-input
              borderless
              v-model="username"
              type="text"
              name="username"
              label="username"
              :rules="[(value) => !!value || 'required', checkUsername]"
              :debounce="500"
              @keydown.enter="register"
            />
            <q-input
              borderless
              v-model="password"
              type="password"
              name="password"
              label="password"
              :rules="[(value) => !!value || 'required']"
              @keydown.enter="register"
            />
            <q-input
              borderless
              v-model="password2"
              type="password"
              name="password2"
              label="repeat password"
              reactive-rules
              :rules="[
                (value) => !!value || 'required',
                (value) => value === password || 'password dont match',
              ]"
              @keydown.enter="register"
            />
          </q-card-section>
          <q-separator />
          <q-card-actions align="left">
            <q-btn label="register" flat v-on:click="register" />
          </q-card-actions>
        </q-card>
        <router-link to="login" class="login-instead"
          >login instead</router-link
        >
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
      password2: null,
    };
  },
  mounted() {
    if (this.$store.state.user.id) {
      this.$router.push("profile");
    }
  },
  methods: {
    checkUsername(value) {
      if (!value) return true;
      return this.$axios
        .post(
          process.env.DJANGO_URL + "/username/",
          {
            username: value,
          },
          {
            withCredentials: true,
            headers: {
              "content-type": "application/json",
            },
          }
        )
        .then(({ data }) => !data.exists || "username already exists")
        .catch(() => true);
    },
    register() {
      if (!this.username || this.password !== this.password2) return;
      this.$axios
        .post(
          process.env.DJANGO_URL + "/user/",
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
          console.log("user register", data);
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
              this.$router.push("today");
            });
        })
        .catch((error) => {
          console.log("error", error.response);
          const data = error.response?.data;
          console.error(data);
          // if (
          //   data &&
          //   data.username &&
          //   data.username.includes("A user with that username already exists.")
          // ) {
          //   console.error("username already taken");
          // }
        });
    },
  },
});
</script>
<style lang="scss">
@import "../css/quasar.variables.scss";
input:-webkit-autofill {
  -webkit-box-shadow: 200px 200px 100px $orange inset;
  box-shadow: 200px 200px 100px $orange inset;
}
.login-instead {
  color: orange;
  margin-right: 5px;
  float: right;
}
</style>
