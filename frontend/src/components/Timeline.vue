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
            v-for="project in cache"
            :key="project.id"
            :subtitle="project.id"
            xxavatar="https://cdn.quasar.dev/img/avatar2.jpg"
          >
            <list
              @select="setSelectedItems"
              @edit="setEdit"
              :position-column="positionColumn"
              group="people"
              :items="project.notes"
              :allItems="allItems"
              :when="updateWhen ? project.when : undefined"
              :date-preview="false"
              :drop="drop"
              :drag="drag"
              :sort="sort"
              :sortMethod="sortMethod"
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

import Projects from "src/components/Projects.vue";

export default {
  name: "TimelineComponent",
  extends: Projects,
  data() {
    return {
      whens: [],
      dates: [],
      timeline: 7,
      dateMap: {},
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
    updateWhen: {
      type: Boolean,
      required: false,
      default: false,
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
        const items = {};
        const dateMap = {};
        this.dates.forEach((date) => {
          items[date.title] = [];
          dateMap[date.title] = date.date;
        });

        let date;

        this.notes.forEach((note) => {
          let dateString = this.formatDate(note[this.groupBy]);
          if (!items[dateString]) {
            date = new Date(note[this.groupBy]);
            this.dates.push({
              title: dateString,
              date,
            });
            items[dateString] = [];
            dateMap[dateString] = date;
          }
          items[dateString].push(note);
        });
        this.projects.forEach((note) => {
          let dateString = this.formatDate(note[this.groupBy]);
          if (!items[dateString]) {
            date = new Date(note[this.groupBy]);
            this.dates.push({
              title: dateString,
              date,
            });
            items[dateString] = [];
            dateMap[dateString] = date;
          }
          items[dateString].push(note);
        });
        for (const date in items) {
          items[date] = items[date].sort(this.sortMethod);
        }

        const cacheItems = [];
        for (const dateString in items) {
          cacheItems.push({
            id: dateString,
            notes: items[dateString],
            when: toDatabaseString(dateMap[dateString]),
          });
        }

        this.$store.commit("cache/update", {
          key: this.id,
          items: cacheItems,
        });
        this.notes = null;
        this.projects = null;
      }
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
        when: toDatabaseString(this.selectedProject.when),
      };
    },
  },
  computed: {
    cache() {
      return this.$store.state.cache[this.id] || [];
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
  },
};
</script>