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
              :when="updateWhen ? date.date : undefined"
              :date-preview="false"
              :drop="drop"
              :sort="sort"
              :sortMethod="sortMethod"
              :focused="focusNote"
              :edited="editNote"
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
import { getQueries } from "src/common/queries";
import { uuidv4 } from "src/common/utils.js";
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
      whens: [],
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
    updateWhen: {
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
      console.log("nextDate", this.formatDate(nextDate));
      if (!this.dates.some((d) => d.title == this.formatDate(nextDate))) {
        this.dates.push({ title: this.formatDate(nextDate), date: nextDate });
      }
    }
    console.log("dates", this.dates);
    this.updateData();
    document.addEventListener("click", this.resetFocusedNote);
    document.addEventListener("keydown", this.onKeydown);
  },
  unmounted() {
    document.removeEventListener("click", this.resetFocusedNote);
    document.removeEventListener("keydown", this.onKeydown);
  },
  methods: {
    mutateQueue(mutation) {
      loading(true);
      let p = this.$apollo.mutate(mutation);
      p.finally(() => loading(false));
      getQueries(mutation.variables).forEach((query) => {
        console.log("mutateQueue query", query);
        this.$addToCache(mutation.variables, query);
      });
      return p;
    },
    sortMethod(a, b) {
      return this.positionColumn
        ? a[this.positionColumn] - b[this.positionColumn]
        : new Date(a[this.groupBy]) - new Date(b[this.groupBy]);
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
    addNote(e) {
      e.stopPropagation();
      if (this.editNote) return;
      const note = this.newNote;
      const dateString = this.formatDate(this.selectedwhen);
      this.items[dateString].notes = [...this.items[dateString].notes, note];
      this.$nextTick(() => {
        this.editNote = note;
        this.focusNote = note;
        this.$nextTick(() => {
          bus.emit("scrollTo", { item: note, top: true });
        });
      });
      this.mutateQueue({
        mutation: CREATE_NOTE,
        variables: note,
      });
    },
    onKeydown(e) {
      // console.log("onKeydown", e.keyCode, this.editNote, this.focusNote);
      if (!this.editNote && this.focusNote) {
        if (e.keyCode === 8) {
          this.trashNote();
        } else if (e.keyCode == 38) {
          e.preventDefault();
          this.selectionUp();
          bus.emit("scrollTo", this.focusNote);
        } else if (e.keyCode == 40) {
          e.preventDefault();
          this.selectionDown();
          bus.emit("scrollTo", this.focusNote);
        }
      }
    },
    trashNote() {
      const item = this.focusNote;
      const groupBy = this.formatDate(item[this.groupBy]);
      const type = item.__typename.includes("_note") ? "notes" : "projects";
      const index = this.items[groupBy][type].findIndex(
        (it) => it.id == item.id
      );

      this.items[groupBy][type].splice(index, 1);
      this.items[groupBy][type] = [...this.items[groupBy][type]];
      let next = this.items[groupBy][type][index];
      if (!next) {
        const length = this.items[groupBy][type].length;
        next = this.items[groupBy][type][length - 1];
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
      item.deleted = true;
      item.deleted_at = new Date();
      this.mutateQueue({
        mutation: TRASH_NOTE,
        variables: item,
      });
    },
    resetFocusedNote() {
      console.log("resetFocusedNote");
      bus.emit("resetFocus");
    },
    setFocusNote(note) {
      console.log("select ", note);
      this.focusNote = note;
    },
    setEditNote(note) {
      console.log("edit ", note);
      this.editNote = note;
    },
    getNextDateString(currentDate) {
      // console.log("get next date string", this.formatDate(currentDate));
      let nextDate = this.nextDay(currentDate);

      // console.log("nextDate", this.formatDate(nextDate));

      // console.log("this.end", this.formatDate(this.nextMonth(this.end)));

      if (
        this.formatDate(nextDate) === this.formatDate(this.nextMonth(this.end))
      ) {
        return null;
      }

      const nextDateString = this.formatDate(nextDate);
      let items = this.items[nextDateString];
      items = items ? [...items.notes, ...items.projects] : null;

      // console.log('nextDateString', nextDateString, items);
      // console.log(nextDateString, this.formatDate(currentDate));
      if (
        nextDateString === this.formatDate(currentDate) ||
        !(items && items.length)
      ) {
        if (nextDateString === this.formatDate(this.nextDay(nextDate))) {
          nextDate = this.nextMonth(nextDate);
        }
        return this.getNextDateString(nextDate);
      }

      return nextDateString;
    },
    getPrevDateString(currentDate) {
      let prevDate = this.prevDay(currentDate);

      if (this.formatDate(currentDate) === this.orderdDates[0].title) {
        return null;
      }

      const prevDateString = this.formatDate(prevDate);
      let items = this.items[prevDateString];
      items = items ? [...items.notes, ...items.projects] : null;

      if (
        prevDateString === this.formatDate(currentDate) ||
        !(items && items.length)
      ) {
        if (prevDateString === this.formatDate(this.prevDay(prevDate))) {
          prevDate = this.prevMonth(prevDate);
        }
        return this.getPrevDateString(prevDate);
      }

      return prevDateString;
    },
    nextMonth(d) {
      return this.backwards
        ? date.subtractFromDate(d, { month: 1 })
        : date.addToDate(d, { month: 1 });
    },
    nextDay(d) {
      return this.backwards ? yesterday(d) : tomorrow(d);
    },
    prevMonth(d) {
      return this.backwards
        ? date.addToDate(d, { month: 1 })
        : date.subtractFromDate(d, { month: 1 });
    },
    prevDay(d) {
      return this.backwards ? tomorrow(d) : yesterday(d);
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
          let nextDateString = this.getNextDateString(
            new Date(this.focusNote[this.groupBy])
          );
          if (nextDateString) {
            items = this.items[nextDateString];
            items = [...items.notes, ...items.projects].sort(this.sortMethod);
            this.focusNote = items[0];
          }
        }
        // console.log("this note", this.focusNote);
        //this.focusedNote = next || this.notes[0];
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
          let prevDateString = this.getPrevDateString(
            new Date(this.focusNote[this.groupBy])
          );
          if (prevDateString) {
            items = this.items[prevDateString];
            items = [...items.notes, ...items.projects].sort(this.sortMethod);
            this.focusNote = items[items.length - 1];
          }
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
    formatDateForward(timestamp) {
      if (isTomorrow(timestamp)) {
        return "Tomorrow";
      }
      let dateString = date.formatDate(timestamp, "dddd");
      if (
        this.timelineDates.some((d) =>
          date.isSameDate(d.date, timestamp, "day")
        )
      ) {
        return dateString;
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
    //this.dates.some(d => date.isSameDate(d.date, timestamp, 'day'))
    timelineDates() {
      const dates = [];
      let next;
      for (let i = 0; i <= this.timeline; i++) {
        next = date.addToDate(this.today, { day: i });
        dates.push({ date: next, title: date.formatDate(next, "dddd") });
      }
      return dates;
    },
    end() {
      return this.orderdDates[this.orderdDates.length - 1].date;
    },
    today() {
      return today();
    },
    selectedwhen() {
      return this.focusNote
        ? this.focusNote.when
        : this.editNote
        ? this.editNote.when
        : this.start;
    },
    newNote() {
      const when = this.selectedwhen;
      const items = this.items[this.formatDate(when)];
      const positions = [...items.notes, ...items.projects].map(
        (it) => it[this.positionColumn]
      );
      const maxPosition = positions.length ? Math.max(...positions) : 0;
      return {
        __typename: "active_notes",
        id: uuidv4(),
        title: "",
        content: "",
        done: false,
        deleted: false,
        user_id: this.user.id,
        upcoming_position: null,
        today_position: null,
        someday_position: null,
        anytime_position: null,
        [this.positionColumn]: maxPosition + 1,
        project: null,
        when: toDatabaseString(when),
      };
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