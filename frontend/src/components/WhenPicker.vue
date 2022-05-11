<template>
  <q-btn>
    <q-menu v-model="showMenu">
      <q-date
        color="orange"
        mask="YYYY-MM-DD"
        @click.stop
        v-model="item.when"
        :options="dateOptions"
        minimal
        @update:modelValue="updateModelValue"
      >
        <q-btn
          :flat="!item.repeat"
          :outlines="!!item.repeat"
          style="width: 100%"
          v-if="!addRepeat"
          @click.stop
          align="left"
        >
          <span v-if="item.repeat"> <q-icon name="repeat" /> {{ item.repeat }} </span>
          <span v-else> <q-icon name="add" /> Repeat </span>

          <q-menu v-model="showRepeatMenu" fit>
            <q-list>
              <q-item
                v-for="option in repeatOptions"
                :key="option.unit"
                clickable
                @click.stop="changeRepeat(option)"
              >
                {{ displayOption(option) }}
              </q-item>
            </q-list>
          </q-menu>

          <q-space />
          <span v-if="item.repeat">
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
      item: {...props.modelValue},
      repeatOptions: [
        { unit: 'day', count: 1  },
        { unit: 'week', count: 1  },
        { unit: 'month', count: 1  },
        { unit: 'year', count: 1  },
      ],
      addRepeat: false,
      showRepeatMenu: false,
    };
  },
  watch: {
    modelValue: {
      handler(value) {
        this.item = {...value};
      },
    },
  },
  props: {
    modelValue: {
      type: Object,
      required: true
    }
  },
  methods: {
    multiply(string, number){
      return number > 1 ? string + s : string;
    },
    displayOption(option){
      return `${option.count} ${this.multiply(option.unit, option.count)}`;
    },
    dateOptions(timestamp) {
      return isToday(timestamp) || isFuture(timestamp);
    },
    updateModelValue() {
      console.log("update model value ", this.item);
      this.$emit("update:modelValue", this.item);
    },
    removeRepeat() {
      console.log("changeRepeat", this.item);
      this.item.repeat = null;
      this.updateModelValue();
    },
    changeRepeat(option) {
      console.log("changeRepeat", this.value, option.value);
      this.item.repeat = `${option.unit}:${option.count}`;
      this.showRepeatMenu = false;

      this.updateModelValue();
    },
  },
};
</script>