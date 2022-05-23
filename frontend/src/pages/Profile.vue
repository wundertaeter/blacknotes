<template>
  <q-page>
    <q-scroll-area class="fill-window">
      <div class="q-pa-md container">
        <h4>
          <q-icon name="account_circle" />
          Profile
        </h4>
        <hr />
        <div v-if="user?.friends" style="max-width: 350px">
          <h6>Your Friends</h6>
          <q-list bordered separator v-if="user.friends.length">
            <q-item
              xxclickable
              xxv-ripple
              v-for="friend in user.friends"
              :key="friend.id"
            >
              <q-item-section>{{ friend.user.username }}</q-item-section>
              <q-item-section side>
                <q-btn icon="delete" @click.stop="deleteFriend(friend)" flat />
              </q-item-section>
            </q-item>
          </q-list>
          <div v-else>You do not have any friends... Go find some!</div>
        </div>

        <hr style="margin-top: 50px; margin-bottom: 50px" />
        <div class="row">
          <h3>Dark Mode</h3>
          <q-toggle
            size="150px"
            v-model="whiteMode"
            @update:modelValue="changeDarkMode"
          />
        </div>
        <hr style="margin-top: 50px" />
      </div>
    </q-scroll-area>
    <q-footer class="fixed-bottom footer">
      <q-toolbar>
        <q-btn
          @click="addFriendDialog = true"
          flat
          label="Add Friend"
          icon="add"
        />
        <q-space />
        <q-btn icon="logout" flat label="Logout" @click="logout" />
      </q-toolbar>
    </q-footer>

    <q-dialog v-model="addFriendDialog">
      <q-card>
        <q-card-section>
          <div class="text-h6">Add Friend</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input type="text" v-model="username" />
        </q-card-section>

        <q-card-actions align="center">
          <q-btn flat label="Add" @click="addFriend" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
const ADD_FRIEND = require("src/gql/mutations/AddFriend.gql");
const GET_USER_ID_BY_USERNAME = require("src/gql/queries/GetUserIdByUsername.gql");
const DELETE_FRIEND = require("src/gql/mutations/DeleteFriend.gql");
const UNSHARE_PROJECTS = require("src/gql/mutations/UnshareProjects.gql");
const UPDATE_PROFILE = require("src/gql/mutations/UpdateProfile.gql");
export default {
  data() {
    return {
      username: null,
      addFriendDialog: null,
    };
  },
  methods: {
    changeDarkMode() {
      this.$q.dark.set(!this.whiteMode);
    },
    logout() {
      this.$store.commit("user/initUser", {});
      this.$store.commit("user/updateAccessToken", null);
      this.$store.commit("user/updateProjects", []);
      this.$store.commit("cache/clear");
      this.$axios
        .post(
          process.env.DJANGO_URL + "/user/logout/",
          {},
          { withCredentials: true }
        )
        .then(() => {
          this.$router.push("login");
        });
    },
    getUserByUsername(username) {
      return this.$apollo.query({
        query: GET_USER_ID_BY_USERNAME,
        variables: {
          username: username,
        },
      });
    },
    addFriend() {
      if (this.username) {
        this.getUserByUsername(this.username)
          .then((resp) => {
            const objects = [
              {
                profile_id: this.user.profile.id,
                user_id: resp.data.users[0]?.id,
              },
              {
                profile_id: resp.data.users[0].profile.id,
                user_id: this.user.id,
              },
            ];
            return this.$mutateQueue({
              mutation: ADD_FRIEND,
              variables: {
                objects,
              },
            });
          })
          .then((resp) => {
            console.log("resp", resp);
            if (resp.data?.friend) {
              this.addFriendDialog = false;
            }
          });
      }
    },
    deleteFriend(friend) {
      this.$mutateQueue({
        mutation: DELETE_FRIEND,
        variables: {
          user_id: friend.user.id,
          profile_id: this.user.profile.id,
        },
      });
      this.$mutateQueue({
        mutation: DELETE_FRIEND,
        variables: {
          user_id: this.user.id,
          profile_id: friend.user.profile.id,
        },
      });
      this.$mutateQueue({
        mutation: UNSHARE_PROJECTS,
        variables: {
          user_id: this.user.id,
          friend_id: friend.user.id,
        },
      });
    },
  },
  computed: {
    user() {
      return this.$store.state.user;
    },
    whiteMode: {
      get() {
        return this.user.profile?.white_mode;
      },
      set(value) {
        this.$store.commit("user/updateWhiteMode", value);
        this.$mutateQueue({
          mutation: UPDATE_PROFILE,
          variables: {
            id: this.user.profile.id,
            data: {
              white_mode: value,
            },
          },
        });
      },
    },
  },
};
</script>
