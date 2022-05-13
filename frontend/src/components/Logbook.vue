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
              :date-preview="false"
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
import { formatDateBackwards } from "src/common/date.js";

import Timeline from "src/generics/Timeline.js";

export default {
  name: "TimelineComponent",
  extends: Timeline,
  methods: {
    sortMethod(a, b) {
      if (a[this.groupBy] === null) return 1;
      if (b[this.groupBy] === null) return -1;
      return new Date(a[this.groupBy]) - new Date(b[this.groupBy]);
    },
    formatDate(timestamp) {
      return formatDateBackwards(timestamp);
    },
  },
  computed: {
    cache() {
      return (
        this.$store.state.cache[this.id].filter((p) => p.notes?.length > 0) || []
      );
    },
    orderdDates() {
      return [...this.dates].sort((a, b) => b.date - a.date);
    },
  },
};
</script>