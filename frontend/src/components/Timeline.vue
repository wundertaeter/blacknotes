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
              v-if="cache && cache[date.title]"
              @select="setSelected"
              @edit="setEdit"
              :position-column="positionColumn"
              group="people"
              :items="cache[date.title]"
              :when="updateWhen ? date.date : undefined"
              :date-preview="false"
              :drop="drop"
              :sort="sort"
              :sortMethod="sortMethod"
              :focused="selected"
              :edited="edit"
              @mounted="listComponentMounted"
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
import { uuidv4 } from "src/common/utils.js";
import {
  toDatabaseString,
  formatDateBackwards,
  formatDateForward,
  timelineDates,
  date,
  today,
  yesterday,
  tomorrow,
} from "src/common/date.js";

import Base from "src/components/Base.vue";

export default {
  name: "TimelineComponent",
  extends: Base,
  data() {
    return {
      whens: [],
      selected: null,
      edit: null,
      dates: [],
      timeline: 7,
    };
  },
  props: {
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
    title: {
      type: String,
      required: true,
    },
    id: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      required: true,
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
      // console.log("nextDate", this.formatDate(nextDate));
      if (!this.dates.some((d) => d.title == this.formatDate(nextDate))) {
        this.dates.push({ title: this.formatDate(nextDate), date: nextDate });
      }
    }
  },
  methods: {
    sortMethod(a, b) {
      if (this.positionColumn) {
        if (this.backwards) {
          if (a[this.positionColumn] === null) return -1;
          if (b[this.positionColumn] === null) return 1;
          return b[this.positionColumn] - a[this.positionColumn];
        } else {
          if (a[this.positionColumn] === null) return 1;
          if (b[this.positionColumn] === null) return -1;
          return a[this.positionColumn] - b[this.positionColumn];
        }
      } else {
        if (this.backwards) {
          if (a[this.positionColumn] === null) return -1;
          if (b[this.positionColumn] === null) return 1;
          return new Date(b[this.groupBy]) - new Date(a[this.groupBy]);
        } else {
          if (a[this.positionColumn] === null) return 1;
          if (b[this.positionColumn] === null) return -1;
          return new Date(a[this.groupBy]) - new Date(b[this.groupBy]);
        }
      }
    },
    updateSelected(item) {
      if (item.id == this.selected.id) {
        this.selected = item;
      }
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
      let items = this.cache[nextDateString];

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
      let items = this.cache[prevDateString];

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
      if (this.selected) {
        let items = this.cache[this.formatDate(this.selected[this.groupBy])];
        const index = items.findIndex((note) => note.id == this.selected.id);
        const next = items[index + 1];
        if (next) {
          this.selected = next;
        } else {
          let nextDateString = this.getNextDateString(
            new Date(this.selected[this.groupBy])
          );
          // console.log("next date string", nextDateString);
          if (nextDateString) {
            items = this.cache[nextDateString];
            this.selected = items[0];
          }
        }
        // console.log("this note", this.selected);
        //this.focusedNote = next || this.notes[0];
      }
    },
    selectionUp() {
      if (this.selected) {
        let items = this.cache[this.formatDate(this.selected[this.groupBy])];
        const index = items.findIndex((note) => note.id == this.selected.id);
        const next = items[index - 1];
        if (next) {
          this.selected = next;
        } else {
          let prevDateString = this.getPrevDateString(
            new Date(this.selected[this.groupBy])
          );
          if (prevDateString) {
            items = this.cache[prevDateString];
            this.selected = items[items.length - 1];
          }
        }
        // console.log("this note", this.selected);
        //this.focusedNote = next || this.notes[0];
      }
    },
    getNotesForDate(date) {
      return this.cache[this.formatDate(date)];
    },
    toDate(string) {
      return new Date(string);
    },
    formatDate(timestamp) {
      return this.backwards
        ? formatDateBackwards(timestamp)
        : formatDateForward(timestamp, this.timelineDates);
    },
    updateCache() {
      if (this.projects && this.notes) {
        this.$store.commit("cache/update", {
          key: this.id,
          notes: this.notes,
          projects: this.projects,
        });
        this.notes = null;
        this.projects = null;
      }
    },
    removeItem() {
      const item = { ...this.selected, deleted: true, deleted_at: new Date() };
      const groupBy = this.formatDate(item[this.groupBy]);
      const index = this.cache[groupBy].findIndex((it) => it.id == item.id);

      this.$updateCache(item);

      this.$nextTick(() => {
        let next = this.cache[groupBy][index];
        if (!next) {
          const length = this.cache[groupBy].length;
          next = this.cache[groupBy][length - 1];
        }
        if (!next) {
          const dates = [...this.dates].reverse();
          while (dates[0].title != groupBy) {
            dates.push(dates.shift());
          }
          for (const date of dates) {
            next = this.cache[date.title][this.cache[date.title].length - 1];
            if (next) break;
          }
        }
        this.selected = next;
      });
    },
    newNote() {
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
        [this.positionColumn]: this.maxPosition + 1,
        project: null,
        when: toDatabaseString(this.selectedWhen),
      };
    },
  },
  computed: {
    cache() {
      const cache = this.$store.state.cache[this.id];
      const items = {};
      this.dates.forEach((date) => {
        items[date.title] = [];
      });
      if (cache) {
        cache.notes.forEach((note) => {
          let dateString = this.formatDate(note[this.groupBy]);
          if (!items[dateString]) {
            this.dates.push({
              title: dateString,
              date: new Date(note[this.groupBy]),
            });
            items[dateString] = [];
          }
          items[dateString].push(note);
        });
        cache.projects.forEach((note) => {
          let dateString = this.formatDate(note[this.groupBy]);
          if (!items[dateString]) {
            this.dates.push({
              title: dateString,
              date: new Date(note[this.groupBy]),
            });
            items[dateString] = [];
          }
          items[dateString].push(note);
        });
        for (const date in items) {
          items[date] = items[date].sort(this.sortMethod);
        }
      }
      return items;
    },
    titles() {
      return Object.keys(this.cache);
    },
    orderdDates() {
      const dates = [...this.dates]; //.filter(d => this.cache[d.title].length);
      return this.backwards
        ? dates
            .filter((d) => this.cache && this.cache[d.title]?.length)
            .sort((a, b) => b.date - a.date)
        : dates.sort((a, b) => a.date - b.date);
    },
    //this.dates.some(d => date.isSameDate(d.date, timestamp, 'day'))
    timelineDates() {
      return timelineDates(this.timeline);
    },
    end() {
      return this.orderdDates[this.orderdDates.length - 1].date;
    },
    today() {
      return today();
    },
    selectedWhen() {
      return this.selected
        ? this.selected.when
        : this.edit
        ? this.edit.when
        : this.start;
    },
    maxPosition() {
      const items = this.cache[this.formatDate(this.selectedWhen)];
      const positions = items.map((it) => it[this.positionColumn]);
      return positions.length ? Math.max(...positions) : 0;
    },
  },
};
</script>