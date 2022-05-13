import { toDatabaseString } from "src/common/date.js";

import Projects from "src/generics/Projects.js";

export default {
  name: "TimelineComponent",
  extends: Projects,
  data() {
    return {
      whens: [],
      dates: [],
      timeline: 7,
    };
  },
  props: {
    start: {
      type: Object,
      required: true,
    },
    groupBy: {
      type: String,
      required: true,
    },
  },
  methods: {
    updateCache() {
      if (this.projects && this.notes) {
        const items = {};
        this.dates.forEach((date) => {
          items[date.title] = [];
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
          }
          items[dateString].push(note);
        });
        
        // for (const date in items) {
        //   items[date] = items[date].sort(this.sortMethod);
        // }

        const cacheItems = [];
        for (const date of this.orderdDates) {
          cacheItems.push({
            title: date.title,
            notes: items[date.title],
            [`_${this.groupBy}`]: toDatabaseString(date.date),
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
  },
};
