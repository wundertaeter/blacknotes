<template>
  <timeline
    v-model="items"
    backwards
    :start="today"
    group-by="completed_at"
    icon="assignment_turned_in"
    title="Logbook"
  />
</template>

<script>
import { defineComponent } from "vue";
const GET_LOGBOOK = require("src/gql/queries/GetLogbook.gql");
const SUBSCRIBE_LOGBOOK_NOTES = require("src/gql/subscriptions/SubscribeLogbookNotes.gql");
const SUBSCRIBE_LOGBOOK_PROJECTS = require("src/gql/subscriptions/SubscribeLogbookProjects.gql");
import Timeline from "src/components/Timeline.vue";
import { today, date } from "src/common/date.js";

export default defineComponent({
  name: "PageIndex",
  components: {
    Timeline,
  },
  data() {
    return {
      items: [],
      projects: null,
      notes: null,
      timeline: 7,
    };
  },
  methods: {
    mergeList() {
      if (this.notes && this.projects) {
        this.items = [...this.notes, ...this.projects].sort(
          (a, b) => new Date(a.deadline) - new Date(b.deadline)
        );
        this.notes = null;
        this.projects = null;
        console.log('new items', this.items);
      }
    },
  },
  computed: {
    user() {
      return this.$store.state.user;
    },
    dates() {
      const dates = [];
      let nextDate;
      for (let d = 0; d < this.timeline; d++) {
        nextDate = date.subtractFromDate(this.today, { day: d });
        dates.push({ title: this.formatDate(nextDate), date: nextDate });
      }
      return dates;
    },
    timelineEnd() {
      return date.subtractFromDate(this.today, { day: this.timeline });
    },
    today() {
      return today();
    },
  },
  apollo: {
    active_notes: {
      query: GET_LOGBOOK,
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
        this.notes = data.active_notes;
        this.projects = data.notes_project;
        this.mergeList();
        this.$apollo.skipAllQueries = true;
      },
    },
    $subscribe: {
      note_note: {
        query: SUBSCRIBE_LOGBOOK_NOTES,
        variables() {
          return {
            user_id: this.user.id,
          };
        },
        skip() {
          return !this.user.id || this.user.loading;
        },
        result({ data }) {
          console.log("note sub", data);
          this.notes = data.active_notes;
          this.mergeList();
        },
      },
      notes_project: {
        query: SUBSCRIBE_LOGBOOK_PROJECTS,
        variables() {
          return {
            user_id: this.user.id,
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

