<template>
  <q-page>
    <project v-if="project" v-model="project" @select="noteSelected"/>
    <q-footer class="fixed-bottom footer">
      <q-toolbar>
        <q-btn icon="add" @click="addNote" />
      </q-toolbar>
    </q-footer>
  </q-page>
</template>

<script>
import { defineComponent } from "vue";
const GET_PROJECT = require("src/gql/queries/GetProject.gql");
const SUBSCRIBE_PROJECT = require("src/gql/subscriptions/SubscribeProject.gql");
const CREATE_NOTE = require("src/gql/mutations/CreateNote.gql");
const TRASH_NOTE = require("src/gql/mutations/TrashNote.gql");
import Project from "src/components/Project.vue";

export default defineComponent({
  name: "PageIndex",
  components: {
    Project
  },
  data() {
    return {
      projectCopy: null,
      selectedNote: null,
    };
  },
  computed: {
    currentProject() {
      return this.$store.getters["user/getCurrentProject"];
    },
  },
  methods: {
    noteSelected(note){
      this.selectedNote = note;
    },
    addNote() {
      this.$apollo.mutate({
        mutation: CREATE_NOTE,
        variables: {
          user_id: this.$store.state.user.id,
          position: this.project.notes.length + 1,
          project_id: this.project.id,
        },
        //update: this.addToCache,
      });
    },
  },
  apollo: {
    project: {
      query: GET_PROJECT,
      variables() {
        return {
          id: this.currentProject.id,
        };
      },
      skip() {
        return !this.currentProject;
      },
      subscribeToMore: {
        document: SUBSCRIBE_PROJECT,
        variables() {
          return {
            id: this.currentProject.id,
          };
        },
        skip() {
          return !this.currentProject;
        },
        updateQuery: (previousResult, { subscriptionData }) => {
          if (subscriptionData.data) {
            return { project: subscriptionData.data.project };
          }
          return previousResult;
        },
      },
    },
  },
});
</script>
