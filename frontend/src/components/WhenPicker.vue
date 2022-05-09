<template>
  <q-btn>
    <q-menu v-model="showMenu">
      <q-date
        color="orange"
        mask="YYYY-MM-DD"
        @navigation="onNavigation"
        @click.stop
        v-model="value"
        :options="dateOptions"
        minimal
        @update:modelValue="updateModelValue"
      >
        <q-btn
          :flat="!repeat"
          :outlines="!!repeat"
          style="width: 100%"
          v-if="!addRepeat"
          @click.stop
          align="left"
        >
          <span v-if="repeat"> <q-icon name="repeat" /> {{ repeat }} </span>
          <span v-else> <q-icon name="add" /> Repeat </span>

          <q-menu v-model="showRepeatMenu" fit>
            <q-list>
              <q-item
                v-for="option in repeatOptions"
                :key="option.title"
                clickable
                @click.stop="changeRepeat(option)"
              >
                Every {{ option.title }}
              </q-item>
            </q-list>
          </q-menu>

          <q-space />
          <span v-if="repeat">
            <q-icon name="close" @click.stop="removeRepeat" />
          </span>
        </q-btn>
      </q-date>
    </q-menu>
    <slot name="default" />
  </q-btn>
</template>

<script>
import { isToday, isFuture } from "src/common/date.js";
import { date, repeat } from "src/common/date.js";

export default {
  data(props) {
    return {
      showMenu: false,
      value: props.modelValue,
      repeat: null,
      frequencyValue: null,
      repeatOptions: [
        { title: "Day", value: { day: 1 } },
        { title: "Week", value: { week: 1 } },
        { title: "Month", value: { month: 1 } },
        { title: "Year", value: { year: 1 } },
      ],
      addRepeat: false,
      showRepeatMenu: false,
    };
  },
  mounted() {
    this.handleFrequency();
  },
  watch: {
    modelValue: {
      handler(value) {
        this.value = value;
        this.updateRepeat();
      },
    },
    frequency: {
      handler() {
        this.handleFrequency();
      },
    },
  },
  props: ["modelValue", "frequency"],
  methods: {
    onNavigation(view) {
      if (this.frequencyValue) {
        const endDate = date.endOfDate(date.buildDate(view), "month");
        if (Date.parse(endDate) > Date.parse(this.modelValue)) {
          this.updateRepeat(endDate);
        }
      }
    },
    handleFrequency() {
      if (this.frequency) {
        let [every, unit] = this.frequency.split(":");
        if (every == "week") {
          every = "day";
          unit = unit * 7;
        }

        this.repeat = every;
        this.frequencyValue = { [every]: unit };

        this.updateRepeat();
      }else{
        this.frequencyValue = null;
      }
    },
    updateRepeat(endDate) {
      const startDate = new Date(this.modelValue);
      if (!endDate) {
        endDate = date.endOfDate(startDate, "month");
      }
      this.value = repeat(startDate, endDate, this.frequencyValue);
    },
    dateOptions(timestamp) {
      return isToday(timestamp) || isFuture(timestamp);
    },
    updateModelValue() {
      console.log("update model value ", this.value);
      this.$emit("update:modelValue", this.value);
    },
    removeRepeat() {
      console.log("changeRepeat", this.value);
      this.repeat = null;
      this.value = Array.isArray(this.value) ? this.value[0] : this.value;
      this.updateFrequency(null);
    },
    updateFrequency(value) {
      if (value) {
        Object.keys(value).forEach((key) => {
          this.$emit("update:frequency", `${key}:${value[key]}`);
        });
      } else {
        this.$emit("update:frequency", null);
      }
    },
    changeRepeat(option) {
      console.log("changeRepeat", this.value, option.value);
      const value = option.value;
      this.repeat = option.title;
      this.showRepeatMenu = false;

      if (value.week) {
        delete value.week;
        value.day = 7;
      }

      this.frequencyValue = value;
      this.updateRepeat();

      this.updateFrequency(option.value);
      // this.updateModelValue();
    },
  },
};
</script>