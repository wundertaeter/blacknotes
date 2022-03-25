<template>
  <div class="q-px-lg q-pb-md">
    <q-timeline color="secondary">
      <q-timeline-entry heading> Timeline heading </q-timeline-entry>

      <q-timeline-entry
        v-for="title in titles"
        :key="title"
        :subtitle="title"
        avatar="https://cdn.quasar.dev/img/avatar2.jpg"
      >
        <note-list v-model="sortedNotes[title]" />
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
import { formatDate, date } from "src/common/date.js";

export default defineComponent({
  name: "PageIndex",
  components: {
    //Project,
    NoteList,
  },
  data() {
    return {
      project: {
        name: "Upcomeing",
        icon: "date_range",
        default: true,
        notes: [],
      },
      sortedNotes: {},
      deadlines: [],
    };
  },
  watch: {
    notes: {
      handler(notes) {
        console.log("notes", notes);
        let lastNote = null;
        notes.forEach((note) => {
          let dateString = formatDate(note.deadline, "ddd D. MMM");
          if (
            lastNote &&
            date.isSameDate(lastNote.deadline, new Date(note.deadline))
          ) {
            this.sortedNotes[dateString].push(note);
          } else {
            this.sortedNotes[dateString] = [note];
          }
          lastNote = note;
        });
        console.log("this.sortedNotes", this.sortedNotes);
        this.project.notes = notes;
      },
      deep: true,
    },
  },
  methods: {},
  computed: {
    user() {
      return this.$store.state.user;
    },
    titles() {
      return Object.keys(this.sortedNotes);
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
