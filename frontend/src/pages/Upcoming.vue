<template>
  <timeline
    v-model="items"
    :start="tomorrow"
    group-by="deadline"
    drop
    :timeline="7"
    icon="date_range"
    title="Upcoming"
  >
    <template v-slot:toolbar="{addNote}">
      <q-btn icon="add" @click="addNote" />
    </template>
  </timeline>
</template>

<script>
import { defineComponent } from "vue";
const GET_UPCOMING = require("src/gql/queries/GetUpcoming.gql");
const SUBSCRIBE_UPCOMING_NOTES = require("src/gql/subscriptions/SubscribeUpcomingNotes.gql");
const SUBSCRIBE_UPCOMING_PROJECTS = require("src/gql/subscriptions/SubscribeUpcomingProjects.gql");
import Timeline from "src/components/Timeline.vue";
import { toDatabaseString, today, tomorrow } from "src/common/date.js";

export default defineComponent({
  name: "PageIndex",
  components: {
    Timeline,
  },
  data() {
    return {
      items: [],
      notes: null,
      projects: null,
    };
  },
  computed: {
    user() {
      return this.$store.state.user;
    },
    today() {
      return today();
    },
    tomorrow() {
      return tomorrow();
    },
  },
  methods: {
    mergeList() {
      if (this.notes && this.projects) {
        this.items = [...this.notes, ...this.projects].sort(
          (a, b) => new Date(a.deadline) - new Date(b.deadline)
        );
      }
    },
  },
  apollo: {
    notes_note: {
      query: GET_UPCOMING,
      variables() {
        return {
          user_id: this.user.id,
          today: toDatabaseString(this.today),
        };
      },
      skip() {
        return !this.user.id;
      },
      result({ data }) {
        console.log("result", data);
        this.notes = data.notes_note;
        this.projects = data.notes_project;
        this.mergeList();
        this.$apollo.skipAllQueries = true;
      },
    },
    $subscribe: {
      note_note: {
        query: SUBSCRIBE_UPCOMING_NOTES,
        variables() {
          return {
            user_id: this.user.id,
            today: toDatabaseString(this.today),
          };
        },
        skip() {
          return !this.user.id || this.user.loading;
        },
        result({ data }) {
          console.log("note sub", data);
          this.notes = data.notes_note;
          this.mergeList();
        },
      },
      notes_project: {
        query: SUBSCRIBE_UPCOMING_PROJECTS,
        variables() {
          return {
            user_id: this.user.id,
            today: toDatabaseString(this.today),
          };
        },
        skip() {
          return !this.user.id || this.user.loading;
        },
        result({ data }) {
          console.log("project sub", data);
          this.projects = data.notes_project;
          this.mergeList();
        },
      },
    },
  },
});
</script>
