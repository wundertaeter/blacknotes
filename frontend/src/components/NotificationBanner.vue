<template>
  <q-banner
    v-if="showNotificationBanner"
    inline-actions
    class="text-dark banner"
  >
    <strong>Do you wanna receive messages?</strong>
    <template v-slot:action>
      <q-btn
        flat
        style="margin-right: 0.5vw"
        label="Yes"
        @click="enableNotification"
      />
      <q-btn
        flat
        style="margin-right: 0.5vw"
        label="No"
        @click="neverShowNotificationBanner"
      />
      <q-btn flat label="Later" @click="showNotificationBanner = false" />
    </template>
  </q-banner>
</template>
<script>
const CREATE_PUSH_SUBSCRIPTION = require("src/gql/mutations/CreatePushSubscription.gql");
export default {
  data() {
    return {
      showNotificationBanner: false,
      serviceWorkerSupport: "serviceWorker" in navigator,
      pushNotificationSupport: "Notification" in window,
    };
  },
  mounted() {
    // Init notification banner
    if (
      this.serviceWorkerSupport &&
      this.pushNotificationSupport &&
      this.user.id
    ) {
      setTimeout(() => {
        let neverShowNotificationBanner = localStorage.getItem(
          "neverShowNotificationBanner"
        );
        if (!neverShowNotificationBanner) {
          this.showNotificationBanner = true;
        }
      }, 2500);
    }
  },
  computed: {
    user() {
      return this.$store.state.user;
    },
  },
  methods: {
    neverShowNotificationBanner() {
      localStorage.setItem("neverShowNotificationBanner", true);
      this.showNotificationBanner = false;
    },
    enableNotification() {
      Notification.requestPermission((result) => {
        this.neverShowNotificationBanner();
        if (result == "granted") {
          this.checkForExistingPushSubscription();
        }
      });
    },
    checkForExistingPushSubscription() {
      navigator.serviceWorker.ready.then((register) => {
        return register.pushManager.getSubscription().then((subscription) => {
          if (!subscription) {
            this.createPushSubscription(register);
          }
        });
      });
    },
    createPushSubscription(register) {
      if (!this.user.id) throw "user not authenticated";
      const publicVapidKey = process.env.WP_PUBLIC_VAPID_KEY;
      register.pushManager
        .subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(publicVapidKey),
        })
        .then((subscription) => {
          console.log("Push registered...");

          //Save Push Notification
          this.$apollo
            .mutate({
              mutation: CREATE_PUSH_SUBSCRIPTION,
              variables: { subscription, user_id: this.user.id },
            })
            .then((resp) => {
              console.log("createPushSubscription resp: ", resp);
            })
            .catch((err) => console.log("createPushSubscription error: ", err));
        });
    },
    urlBase64ToUint8Array(base64String) {
      const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
      const base64 = (base64String + padding)
        .replace(/\-/g, "+")
        .replace(/_/g, "/");

      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);

      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    },
  },
};
</script>
<style scoped lang="scss">
.banner {
  position: fixed;
  bottom: 0;
  width: 100%;
  background-color: $orange;
  z-index: 9999999;
}
</style>