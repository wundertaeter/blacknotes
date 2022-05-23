<template>
  <project
    v-if="project"
    v-model="project"
    :config="config"
    :sort-by="sortBy"
  >
    <template v-slot:toolbar="{ revert, selectedItems }">
      <q-btn icon="replay" :disabled="!selectedItems.length" flat @click="revert" />
      <q-space />
      <q-btn icon="delete" flat @click="deleteAll" />
    </template>
  </project>
</template>

<script>
import { defineComponent } from "vue";
const SUBSCRIBE_TRASH_NOTES = require("src/gql/subscriptions/SubscribeTrashNotes.gql");
const SUBSCRIBE_TRASH_PROJECTS = require("src/gql/subscriptions/SubscribeTrashProjects.gql");
const DELETE_PROJECTS = require("src/gql/mutations/DeleteProjects.gql");
const DELETE_NOTES = require("src/gql/mutations/DeleteNotes.gql");
import Project from "src/components/Project.vue";

export default defineComponent({
  name: "PageIndex",
  components: {
    Project,
  },
  data() {
    return {
      project: { title: "Trash", icon: "delete", default: true, id: "trash" },
      config: {
        notes_subscription: SUBSCRIBE_TRASH_NOTES,
        projects_subscription: SUBSCRIBE_TRASH_PROJECTS,
        variables: {
          user_id: this.$store.state.user.id,
        },
      },
      sortBy: {
        column: "deleted_at",
        desc: true,
        date: true,
      },
    };
  },
  methods: {
    deleteAll(e) {
      e.stopPropagation();
      // const itemsToTrash = { notes: [], projects: [] };
      const notes = [];
      const projects= [];
      this.cache.forEach((item) => {
        if (item.deleted) {
          if (item.__typename.includes("_note")) {
            notes.push(item);
          } else {
            projects.push(item);
          }
        }
      });
      if (notes.length) {
        this.$mutateQueue({
          mutation: DELETE_NOTES,
          variables: {
            ids: notes.map((note) => note.id),
          },
        });
      }
      if (projects.length) {
        this.$mutateQueue({
          mutation: DELETE_PROJECTS,
          variables: {
            ids: projects.map((note) => note.id),
          },
        });
      }
      this.$store.commit("cache/update", {
        key: this.project.id,
        items: [],
      });
    },
  },
  computed: {
    cache(){
      return this.$store.state.cache[this.project.id]
    }
  }
});
</script>
