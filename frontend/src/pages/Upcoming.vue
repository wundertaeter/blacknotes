<template>
  <q-page>
    <q-scroll-area class="fill-window">
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
              :date-preview="false"
            />
          </q-timeline-entry>

          <!--q-timeline-entry heading>
        November, 2017
      </q-timeline-entry-->
        </q-timeline>
      </div>
    </q-scroll-area>
    <q-footer class="fixed-bottom footer">
      <q-toolbar>
        <q-btn icon="add" @click="addNote" />
      </q-toolbar>
    </q-footer>
  </q-page>
</template>

<script>
import { defineComponent } from "vue";
const GET_UPCOMING_NOTES = require("src/gql/queries/GetUpcomingNotes.gql");
const SUBSCRIBE_UPCOMING_NOTES = require("src/gql/subscriptions/SubscribeUpcomingNotes.gql");
const CREATE_NOTE = require("src/gql/mutations/CreateNote.gql");
const TRASH_NOTE = require("src/gql/mutations/TrashNote.gql");
import NoteList from "src/components/NoteList.vue";
import { bus } from "src/components/NoteList.vue";
import {
  toDatabaseString,
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
      timeline: 7,
      loading: false,
      promiseQueue: [],
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
        Promise.all(this.promiseQueue).finally(() => {
          this.promiseQueue = [];
          this.loading = false;
        });

        if (!this.loading) {
          this.dates.forEach((date) => {
            this.sortedNotes[date.title] = [];
          });
          notes.forEach((note) => {
            let dateString = this.formatDate(note.deadline);
            console.log(dateString);
            this.sortedNotes[dateString].push(note);
          });
          console.log("this.sorted", this.sortedNotes);
        }
      },
      deep: true,
    },
    focusNote: {
      handler(value) {
        console.log("emit focus note");
        bus.emit("focusNote", value);
      },
    },
  },
  methods: {
    mutateQueue(mutation) {
      this.loading = true;
      let p = this.$apollo.mutate(mutation);
      this.promiseQueue.push(p);
      return p;
    },
    addNote() {
      const deadline = this.focusNote
        ? this.focusNote.deadline
        : this.editNote
        ? this.editNote.deadline
        : this.tomorrow;
      this.mutateQueue({
        mutation: CREATE_NOTE,
        variables: {
          user_id: this.user.id,
          position: 0,
          project_id: null,
          deadline: toDatabaseString(deadline),
        },
      }).then((result) => {
        this.sortedNotes[this.formatDate(deadline)].push(result.data.note);
      });
    },
    onKeydown(e) {
      console.log("onKeydown", e.keyCode, this.editNote, this.focusNote);
      if (!this.editNote) {
        if (e.keyCode === 8) {
          if (this.focusNote) this.trashNote();
        } else if (e.keyCode == 38) {
          e.preventDefault();
          this.selectionUp();
        } else if (e.keyCode == 40) {
          e.preventDefault();
          this.selectionDown();
        }
      }
    },
    trashNote() {
      const note = this.focusNote;
      const deadline = this.formatDate(note.deadline);
      const index = this.sortedNotes[deadline].findIndex(
        (n) => n.id == note.id
      );

      this.sortedNotes[deadline].splice(index, 1);
      let next = this.sortedNotes[deadline][index];
      if (!next) {
        const length = this.sortedNotes[deadline].length;
        next = this.sortedNotes[deadline][length - 1];
      }
      const dates = [...this.dates];
      while (dates[0].title != deadline) {
        dates.push(dates.shift());
      }
      if (!next) {
        for (const date of dates) {
          next = this.sortedNotes[date.title][0];
          if (next) break;
        }
      }
      this.focusNote = next;

      this.mutateQueue({
        mutation: TRASH_NOTE,
        variables: {
          id: note.id,
          deleted: true,
        },
      });
    },
    resetFocusedNote() {
      console.log("resetFocusedNote");
      bus.emit("resetFocusedNote");
      this.focusNote = null;
      this.editNote = null;
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
        return this.selectNextNote(this.today);
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
    timelineEnd() {
      return date.addToDate(tomorrow(), { day: this.timeline });
    },
    today() {
      return today();
    },
    tomorrow() {
      return tomorrow();
    },
  },
  apollo: {
    notes: {
      query: GET_UPCOMING_NOTES,
      variables() {
        return {
          user_id: this.user.id,
          today: toDatabaseString(this.today),
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
            today: toDatabaseString(this.today),
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
