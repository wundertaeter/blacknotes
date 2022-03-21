<template>
  <q-page class="flex flex-center">
    <div class="q-pa-md">
      <div class="q-gutter-md" style="max-width: 300px">
        <q-input label="email" />
        <q-input label="password" />
        <q-btn label="login" v-on:click="login"/>
      </div>
    </div>
  </q-page>
</template>

<script>
import { defineComponent } from "vue";
export default defineComponent({
  name: "PageIndex",
  data(){
    return {
      email: null,
      password: null
    }
  },
  methods: {
    login(){
      console.log('login', this.email, this.password)
      // we still nedd the api service CSRF
    }
  }
});
</script>
