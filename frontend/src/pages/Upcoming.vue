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
          v-if="sortedNotes[date.title]"
          @select="setFocusNote"
          @edit="setEditNote"
          :selectable="false"
          :on-keydown="onKeydown"
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
import { bus } from "src/components/NoteList.vue";
import {
  formatDate,
  date,
  tomorrow,
  today,
  yesterday,
} from "src/common/date.js";

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
      focusNote: null,
      editNote: null,
      timeline: 7
    };
  },
  mounted() {
    document.addEventListener("click", this.resetFocusedNote);
    document.addEventListener("keydown", this.onKeydown);
  },
  unmounted() {
    document.removeEventListener("click", this.resetFocusedNote);
    document.removeEventListener("keydown", this.onKeydown);
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
        console.log("this.sorted", this.sortedNotes);
      },
      deep: true,
    },
    focusNote: {
      handler(value) {
        bus.emit("focusNote", value);
      },
    },
  },
  methods: {
    onKeydown(e) {
      console.log("onKeydown", e.keyCode, this.editNote, this.focusNote);
      if (!this.editNote) {
        if (e.keyCode === 8) {
          if (this.focuseNote) bus.emit("trashNote");
        } else if (e.keyCode == 38) {
          this.selectionUp();
        } else if (e.keyCode == 40) {
          this.selectionDown();
        }
      }
    },
    resetFocusedNote() {
      console.log("resetFocusedNote");
      bus.emit("resetFocusedNote");
    },
    setFocusNote(note) {
      console.log("select ", note);
      this.focusNote = note;
    },
    setEditNote(note) {
      console.log("edit ", note);
      this.editNote = note;
    },
    selectNextNote(deadline) {
      const nextDay = tomorrow(deadline);
      const notes = this.sortedNotes[this.formatDate(nextDay)];
      console.log("selectNextNote", notes);
      if (notes === undefined) {
        return this.selectNextNote(today());
      }
      const next = notes[0];
      if (next) {
        this.focusNote = next;
      } else {
        this.selectNextNote(nextDay);
      }
    },
    selectionDown() {
      if (this.focusNote) {
        let notes = this.sortedNotes[this.formatDate(this.focusNote.deadline)];
        const index = notes.findIndex((note) => note.id == this.focusNote.id);
        const next = notes[index + 1];
        if (next) {
          this.focusNote = next;
        } else {
          this.selectNextNote(new Date(this.focusNote.deadline));
        }
        console.log("this note", this.focusNote);
        //this.focusedNote = next || this.notes[0];
      }
    },
    selectPrevNote(deadline) {
      const prevDay = yesterday(deadline);
      const notes = this.sortedNotes[this.formatDate(prevDay)];
      console.log("selectNextNote", notes);
      if (notes === undefined) {
        return this.selectPrevNote(this.timelineEnd);
      }
      const next = notes[notes.length - 1];
      if (next) {
        this.focusNote = next;
      } else {
        this.selectPrevNote(prevDay);
      }
    },
    selectionUp() {
      if (this.focusNote) {
        let notes = this.sortedNotes[this.formatDate(this.focusNote.deadline)];
        const index = notes.findIndex((note) => note.id == this.focusNote.id);
        const next = notes[index - 1];
        if (next) {
          this.focusNote = next;
        } else {
          this.selectPrevNote(new Date(this.focusNote.deadline));
        }
        console.log("this note", this.focusNote);
        //this.focusedNote = next || this.notes[0];
      }
    },
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
      for (let d = 0; d < this.timeline; d++) {
        nextDate = date.addToDate(t, { day: d });
        dates.push({ title: this.formatDate(nextDate), date: nextDate });
      }
      return dates;
    },
    timelineEnd(){
      return date.addToDate(tomorrow(), { day: this.timeline});
    }
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
