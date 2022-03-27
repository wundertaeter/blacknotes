<template>
  <div class="q-px-lg q-pb-md">
    <q-timeline color="secondary">
      <q-timeline-entry heading> Timeline heading </q-timeline-entry>

      <q-timeline-entry
        v-for="date in dates"
        :key="date.title"
        :subtitle="date.title"
        avatar="https://cdn.quasar.dev/img/avatar2.jpg"
      >
        <note-list
          group="people"
          v-model="sortedNotes[date.title]"
          :deadline="date.date"
          xxdate-preview="false"
        />
      </q-timeline-entry>

      <!--q-timeline-entry heading>
        November, 2017
      </q-timeline-entry-->
    </q-timeline>
  </div>
</template>

<script>
import { defineComponent } from "vue";
const GET_UPCOMING_NOTES = require("src/gql/queries/GetUpcomingNotes.gql");
const SUBSCRIBE_UPCOMING_NOTES = require("src/gql/subscriptions/SubscribeUpcomingNotes.gql");
import NoteList from "src/components/NoteList.vue";
import { formatDate, date, tomorrow } from "src/common/date.js";

export default defineComponent({
  name: "PageIndex",
  components: {
    //Project,
    NoteList,
  },
  data() {
    return {
      sortedNotes: {},
      deadlines: [],
      watchers: [],
    };
  },
  created() {
    this.dates.forEach((date) => {
      this.sortedNotes[date.title] = [];
    });
  },
  watch: {
    notes: {
      handler(notes) {
        this.dates.forEach((date) => {
          this.sortedNotes[date.title] = [];
        });
        notes.forEach((note) => {
          let dateString = this.formatDate(note.deadline);
          this.sortedNotes[dateString].push(note);
        });
        console.log('this.sorted', this.sortedNotes);
      },
      deep: true,
    },
  },
  methods: {
    getNotesForDate(date) {
      return this.sortedNotes[formatDate(date)];
    },
    toDate(string) {
      return new Date(string);
    },
    updatePositions(notes) {
      console.log("upcoming updatePositions", dateString, notes);
      console.log(this.sortedNotes);
      console.log("this.watchers", this.watchers);
    },
    formatDate(timestamp) {
      return formatDate(timestamp, "dddd");
    },
  },
  computed: {
    user() {
      return this.$store.state.user;
    },
    titles() {
      return Object.keys(this.sortedNotes);
    },
    dates() {
      const dates = [];
      const t = tomorrow();
      let nextDate;
      for (let d = 0; d < 7; d++) {
        nextDate = date.addToDate(t, { day: d });
        dates.push({title: this.formatDate(nextDate), date: nextDate});
      }
      return dates;
    },
  },
  apollo: {
    notes: {
      query: GET_UPCOMING_NOTES,
      variables() {
        return {
          user_id: this.user.id,
        };
      },
      skip() {
        return !this.user.id;
      },
      subscribeToMore: {
        document: SUBSCRIBE_UPCOMING_NOTES,
        variables() {
          return {
            user_id: this.user.id,
          };
        },
        skip() {
          return !this.user.id;
        },
        updateQuery: (previousResult, { subscriptionData }) => {
          if (subscriptionData.data) {
            return { notes: subscriptionData.data.notes };
          }
          return previousResult;
        },
      },
    },
  },
});
</script>
