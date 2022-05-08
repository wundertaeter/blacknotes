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
            v-for="(project, index) in cache"
            :key="project.title"
            :subtitle="project.title"
            xxavatar="https://cdn.quasar.dev/img/avatar2.jpg"
          >
            <list
              @select="setSelectedItems"
              @edit="setEdit"
              :position-column="positionColumn"
              :project-index="index"
              group="people"
              :items="project.notes"
              :update-when="!!project._when"
              :cache-key="id"
              :allItems="allItems"
              :when="project._when"
              date-preview
              drop
              drag
              sort
              :selected="selectedItems"
              :edited="edit"
              @mounted="listComponentMounted"
              @check="check"
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
import {
  toDatabaseString,
  formatDateForward,
  timelineDays,
  timelineMonths,
  date,
} from "src/common/date.js";

import { uuidv4 } from "src/common/utils.js";

import Timeline from "src/generics/Timeline.js";

export default {
  name: "TimelineComponent",
  extends: Timeline,
  mounted() {
    let nextDate;
    let nextMonth;
    let nextDateString;

    // Add 7 Days
    for (let d = 0; d < this.timeline; d++) {
      if (this.backwards) {
        nextDate = date.subtractFromDate(this.start, { day: d });
      } else {
        nextDate = date.addToDate(this.start, { day: d });
      }

      nextDateString = this.formatDate(nextDate);
      if (!this.dates.some((d) => d.title == nextDateString)) {
        this.dates.push({ title: nextDateString, date: nextDate });
      }
    }

    // current month rest days
    nextMonth = date.addToDate(this.end, { day: 1 });
    nextDateString = this.formatDate(nextMonth);
    if (!this.dates.some((d) => d.title == nextDateString)) {
      this.dates.push({ title: nextDateString, date: nextMonth });
    }

    // add next 7 months
    const monethsStart = date.startOfDate(this.end, "month");
    for (let d = 1; d < this.timeline; d++) {
      if (this.backwards) {
        nextMonth = date.subtractFromDate(monethsStart, { month: d });
      } else {
        nextMonth = date.addToDate(monethsStart, { month: d });
      }
      nextDateString = this.formatDate(nextMonth);
      if (!this.dates.some((d) => d.title == nextDateString)) {
        this.dates.push({ title: nextDateString, date: nextMonth });
      }
    }
  },
  methods: {
    sortMethod(a, b) {
      if (a[this.positionColumn] === null) return -1;
      if (b[this.positionColumn] === null) return 1;
      return b[this.positionColumn] - a[this.positionColumn];
    },
    formatDate(timestamp) {
      return formatDateForward(timestamp);
    },
  },
  computed: {
    cache() {
      let cache = this.$store.state.cache[this.id];

      const newItem = cache.new;
      if (newItem) {
        this.$store.commit("cache/update", {
          key: this.id,
          items: [
            ...cache,
            {
              title: this.formatDate(newItem[this.groupBy]),
              notes: [newItem],
              [`_${this.groupBy}`]: toDatabaseString(newItem[this.groupBy]),
            },
          ],
        });
      }

      return cache || [];
    },
    orderdDates() {
      const dates = [...this.dates]; //.filter(d => this.cache[d.title].length);
      return dates.sort((a, b) => a.date - b.date);
    },
    //this.dates.some(d => date.isSameDate(d.date, timestamp, 'day'))
    end() {
      return this.orderdDates[this.orderdDates.length - 1].date;
    },
  },
};
</script>