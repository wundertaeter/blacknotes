<template>
  <q-page>
    <q-scroll-area class="fill-window">
      <div class="q-pa-md container">
        <h4>
          <q-icon :name="icon" />
          {{ title }}
        </h4>
        <q-timeline color="secondary">
          <q-timeline-entry
            v-for="date in orderdDates"
            :key="date.title"
            :subtitle="date.title"
            xxavatar="https://cdn.quasar.dev/img/avatar2.jpg"
          >
            <list
              v-if="items[date.title]"
              @select="setFocusNote"
              @edit="setEditNote"
              :select="false"
              :position-column="positionColumn"
              group="people"
              :projects="items[date.title].projects"
              :notes="items[date.title].notes"
              :deadline="updateDeadline ? date.date : undefined"
              :date-preview="false"
              :drop="drop"
              :sort="sort"
              :sortMethod="sortMethod"
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
        <slot name="toolbar" v-bind:addNote="addNote" />
      </q-toolbar>
    </q-footer>
  </q-page>
</template>

<script>
import { defineComponent } from "vue";
const CREATE_NOTE = require("src/gql/mutations/CreateNote.gql");
const TRASH_NOTE = require("src/gql/mutations/TrashNote.gql");
import List from "src/components/list/List.vue";
import { bus } from "src/components/list/List.vue";
import { loading } from "src/common/system.js";
import {
  toDatabaseString,
  isToday,
  isYesterday,
  isCurrentWeek,
  isTomorrow,
  date,
  today,
  yesterday,
  tomorrow,
} from "src/common/date.js";

export default defineComponent({
  name: "PageIndex",
  components: {
    //Project,
    List,
  },
  data() {
    return {
      items: {},
      projects: [],
      notes: [],
      deadlines: [],
      watchers: [],
      focusNote: null,
      editNote: null,
      loading: false,
      promiseQueue: [],
      dates: [],
    };
  },
  props: {
    timeline: {
      type: Number,
      required: false,
      default: 0,
    },
    backwards: {
      type: Boolean,
      required: false,
      defautl: false,
    },
    start: {
      type: Object,
      required: true,
    },
    groupBy: {
      type: String,
      required: true,
    },
    drop: {
      type: Boolean,
      required: false,
      default: false,
    },
    sort: {
      type: Boolean,
      required: false,
      default: false,
    },
    title: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      required: true,
    },
    positionColumn: {
      type: String,
      required: false,
    },
    updateDeadline: {
      type: Boolean,
      required: false,
      default: false,
    },
    config: {
      type: Object,
      required: false,
    },
  },
  mounted() {
    let nextDate;
    for (let d = 0; d < this.timeline; d++) {
      if (this.backwards) {
        nextDate = date.subtractFromDate(this.start, { day: d });
      } else {
        nextDate = date.addToDate(this.start, { day: d });
      }
      if (!this.dates.some((d) => d.title == this.formatDate(nextDate))) {
        this.dates.push({ title: this.formatDate(nextDate), date: nextDate });
      }
    }
    this.updateData();
    document.addEventListener("click", this.resetFocusedNote);
    document.addEventListener("keydown", this.onKeydown);
  },
  unmounted() {
    document.removeEventListener("click", this.resetFocusedNote);
    document.removeEventListener("keydown", this.onKeydown);
  },
  watch: {
    focusNote: {
      handler(value) {
        console.log("emit focus note");
        bus.emit("focusNote", value);
      },
    },
  },
  methods: {
    sortMethod(a, b) {
      return this.positionColumn
        ? a[this.positionColumn] - b[this.positionColumn]
        : new Date(b[this.groupBy]) - new Date(a[this.groupBy]);
    },
    updateData() {
      console.log("update!!!????????");
      this.dates.forEach((date) => {
        this.items[date.title] = { notes: [], projects: [] };
      });
      this.notes.forEach((note) => {
        let dateString = this.formatDate(note[this.groupBy]);
        if (!this.items[dateString]) {
          this.dates.push({
            title: dateString,
            date: new Date(note[this.groupBy]),
          });
          this.items[dateString] = { notes: [], projects: [] };
        }
        this.items[dateString].notes.push(note);
      });
      this.projects.forEach((note) => {
        let dateString = this.formatDate(note[this.groupBy]);
        if (!this.items[dateString]) {
          this.dates.push({
            title: dateString,
            date: new Date(note[this.groupBy]),
          });
          this.items[dateString] = { notes: [], projects: [] };
        }
        this.items[dateString].projects.push(note);
      });
      console.log("this.sorted", this.items, this.dates);
    },
    mutateQueue(mutation) {
      loading(true);
      let p = this.$apollo.mutate(mutation);
      p.finally(() => loading(false));
      //this.promiseQueue.push(p);
      return p;
    },
    addNote() {
      const deadline = this.focusNote
        ? this.focusNote.deadline
        : this.editNote
        ? this.editNote.deadline
        : this.start;
      this.mutateQueue({
        mutation: CREATE_NOTE,
        variables: {
          user_id: this.user.id,
          position: 0,
          project_id: null,
          deadline: toDatabaseString(deadline),
        },
      }).then((result) => {
        this.items[this.formatDate(deadline)].push(result.data.note);
      });
    },
    onKeydown(e) {
      console.log("onKeydown", e.keyCode, this.editNote, this.focusNote);
      if (!this.editNote && this.focusNote) {
        if (e.keyCode === 8) {
          this.trashNote();
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
      const groupBy = this.formatDate(note[this.groupBy]);
      const index = this.items[groupBy].findIndex((n) => n.id == note.id);

      this.items[groupBy].splice(index, 1);
      let next = this.items[groupBy][index];
      if (!next) {
        const length = this.items[groupBy].length;
        next = this.items[groupBy][length - 1];
      }
      const dates = [...this.dates];
      while (dates[0].title != groupBy) {
        dates.push(dates.shift());
      }
      if (!next) {
        for (const date of dates) {
          next = this.items[date.title][0];
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
    selectNextNote(date) {
      const nextDay = this.backwards ? yesterday(date) : tomorrow(date);
      let items = this.items[this.formatDate(nextDay)];
      console.log("selectNextNote", items, this.formatDate(nextDay));
      if (items === undefined) {
        return this.selectNextNote(
          this.backwards ? tomorrow(this.start) : yesterday(this.start)
        );
      }
      items = [...items.notes, ...items.projects].sort(this.sortMethod);
      const next = items[0];
      if (next) {
        this.focusNote = next;
      } else {
        this.selectNextNote(nextDay);
      }
    },
    selectionDown() {
      if (this.focusNote) {
        let items = this.items[this.formatDate(this.focusNote[this.groupBy])];
        items = [...items.notes, ...items.projects].sort(this.sortMethod);
        const index = items.findIndex((note) => note.id == this.focusNote.id);
        const next = items[index + 1];
        if (next) {
          this.focusNote = next;
        } else {
          this.selectNextNote(new Date(this.focusNote[this.groupBy]));
        }
        console.log("this note", this.focusNote);
        //this.focusedNote = next || this.notes[0];
      }
    },
    selectPrevNote(date) {
      const prevDay = this.backwards ? tomorrow(date) : yesterday(date);
      let items = this.items[this.formatDate(prevDay)];
      if (items === undefined) {
        return this.selectPrevNote(this.timelineEnd);
      }
      items = [...items.notes, ...items.projects].sort(this.sortMethod);
      console.log("selectNextNote", items);
      const next = items[items.length - 1];
      if (next) {
        this.focusNote = next;
      } else {
        this.selectPrevNote(prevDay);
      }
    },
    selectionUp() {
      if (this.focusNote) {
        let items = this.items[this.formatDate(this.focusNote[this.groupBy])];
        items = [...items.notes, ...items.projects].sort(this.sortMethod);
        const index = items.findIndex((note) => note.id == this.focusNote.id);
        const next = items[index - 1];
        if (next) {
          this.focusNote = next;
        } else {
          this.selectPrevNote(new Date(this.focusNote[this.groupBy]));
        }
        console.log("this note", this.focusNote);
        //this.focusedNote = next || this.notes[0];
      }
    },
    getNotesForDate(date) {
      return this.items[this.formatDate(date)];
    },
    toDate(string) {
      return new Date(string);
    },
    updatePositions(notes) {
      console.log("upcoming updatePositions", dateString, notes);
      console.log(this.items);
      console.log("this.watchers", this.watchers);
    },
    formatDateForward(timestamp) {
      if (isTomorrow(timestamp)) {
        return "Tomorrow";
      } else if (isCurrentWeek(timestamp)) {
        return date.formatDate(timestamp, "dddd");
      }
      return date.formatDate(timestamp, "MMMM");
    },
    formatDateBackwards(timestamp) {
      if (isToday(timestamp)) {
        return "Today";
      } else if (isYesterday(timestamp)) {
        return "Yesterday";
      } else if (isCurrentWeek(timestamp)) {
        return date.formatDate(timestamp, "dddd");
      }
      return date.formatDate(timestamp, "MMMM");
    },
    formatDate(timestamp) {
      return this.backwards
        ? this.formatDateBackwards(timestamp)
        : this.formatDateForward(timestamp);
    },
    updateCache() {
      if (!this.config?.query) return;
      const apolloClient = this.$apollo.provider.defaultClient;
      apolloClient.writeQuery({
        query: this.config?.query,
        data: {
          active_notes: this.notes,
          notes_project: this.projects,
        },
        variables: this.config?.variables,
      });
    },
  },
  computed: {
    user() {
      return this.$store.state.user;
    },
    titles() {
      return Object.keys(this.items);
    },
    orderdDates() {
      const dates = [...this.dates]; //.filter(d => this.items[d.title].length);
      return this.backwards
        ? dates
            .filter(
              (d) =>
                this.items[d.title].projects.length ||
                this.items[d.title].notes.length
            )
            .sort((a, b) => b.date - a.date)
        : dates.sort((a, b) => a.date - b.date);
    },
    timelineEnd() {
      return this.backwards
        ? date.subtractFromDate(this.start, { day: this.timeline })
        : date.addToDate(this.start, { day: this.timeline });
    },
    today() {
      return today();
    },
  },
  apollo: {
    active_notes: {
      query() {
        return this.config?.query;
      },
      fetchPolicy: "cache-first",
      variables() {
        return this.config?.variables;
      },
      skip() {
        return !this.config?.query || !this.user.id;
      },
      result({ data }) {
        console.log("result", data);
        this.notes = data.active_notes
          ? JSON.parse(JSON.stringify(data.active_notes))
          : [];
        this.projects = data.notes_project
          ? JSON.parse(JSON.stringify(data.notes_project))
          : [];
        this.$apollo.skipAllQueries = true;
        this.updateData();
      },
    },
    $subscribe: {
      active_notes: {
        query() {
          return this.config?.notes_subscription;
        },
        variables() {
          return this.config?.variables;
        },
        skip() {
          return (
            !this.config?.notes_subscription ||
            !this.user.id ||
            this.user.loading
          );
        },
        result({ data }) {
          console.log("note sub", data);
          this.notes = JSON.parse(JSON.stringify(data.active_notes));
          this.updateData();
          this.updateCache();
        },
      },
      notes_project: {
        query() {
          return this.config?.projects_subscription;
        },
        variables() {
          return this.config?.variables;
        },
        skip() {
          return (
            !this.config?.projects_subscription ||
            !this.user.id ||
            this.user.loading
          );
        },
        result({ data }) {
          console.log("project sub", data);
          this.projects = JSON.parse(JSON.stringify(data.notes_project));
          this.updateData();
          this.updateCache();
        },
      },
    },
  },
});
</script>