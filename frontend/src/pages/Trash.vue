<template>
  <project v-if="project" v-model="project" :sort="false" />
</template>

<script>
import { defineComponent } from "vue";
const SUBSCRIBE_TRASH_NOTES = require("src/gql/subscriptions/SubscribeTrashNotes.gql");
const SUBSCRIBE_TRASH_PROJECTS = require("src/gql/subscriptions/SubscribeTrashProjects.gql");
import Project from "src/components/Project.vue";

export default defineComponent({
  name: "PageIndex",
  components: {
    Project,
  },
  data() {
    return {
      project: { title: "Trash", icon: "delete", default: true, notes: [] },
      projects: [],
      notes: [],
    };
  },
  watch: {
    notes: {
      handler(notes) {
        this.project.notes = notes;
      },
      deep: true,
    },
  },
  methods: {
    mergeList() {
      this.project.notes = [...this.notes, ...this.projects].sort(
        (a, b) => new Date(a.deadline) - new Date(b.deadline)
      );
    },
  },
  computed: {
    user() {
      return this.$store.state.user;
    },
  },
  apollo: {
    $subscribe: {
      projects: {
        query: SUBSCRIBE_TRASH_PROJECTS,
        variables() {
          return {
            user_id: this.user.id,
          };
        },
        skip() {
          return !this.user.id;
        },
        result({ data }) {
          console.log("result", data);
          this.projects = data.projects;
          this.mergeList();
        },
      },
      notes: {
        query: SUBSCRIBE_TRASH_NOTES,
        variables() {
          return {
            user_id: this.user.id,
          };
        },
        skip() {
          return !this.user.id;
        },
        result({ data }) {
          console.log("result", data);
          this.notes = data.notes;
          this.mergeList();
        },
      },
    },
  },
});
</script>
