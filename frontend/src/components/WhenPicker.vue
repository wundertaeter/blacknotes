<template>
  <q-btn @click="isMobile ? (showMenu = true) : null">
    <q-menu v-if="!isMobile" v-model="showMenu" @hide="updateModelValue">
      <q-date
        color="orange"
        mask="YYYY-MM-DD"
        @click.stop
        :modelValue="isSomeday ? null : when"
        @update:modelValue="(value) => (when = value)"
        :options="dateOptions"
        minimal
      >
        <q-btn
          :flat="!item.repeat"
          @click="addSomeday"
          style="width: 100%; text-align: center"
        >
          <div class="row" :class="{ active: isSomeday }" style="width: 100%">
            <q-icon name="unarchive" />
            <q-space />
            <span>Someday</span>
            <q-space />
            <q-icon name="close" v-if="isSomeday" @click.stop="removeSomeday" />
          </div>
        </q-btn>

        <q-btn
          style="width: 100%; text-align: center"
          v-if="!addRepeat"
          @click.stop="showRepeatMenu = !showRepeatMenu"
        >
          <div class="row active" style="width: 100%" v-if="item.repeat">
            <q-icon name="repeat" />
            <q-space />
            <span>{{ item.repeat }}</span>
            <q-space />
            <q-icon name="close" @click.stop="removeRepeat" />
          </div>
          <div class="row" style="width: 100%" v-else>
            <q-icon name="add" />
            <q-space />
            <span>Repeat</span>
            <q-space />
          </div>
        </q-btn>
        <div
          v-if="showRepeatMenu"
          class="row"
          style="padding-left: 10px; padding-right: 10px"
        >
          <div class="col-6">
            <q-select
              borderless
              color="orange"
              v-model="unit"
              :options="unitOptions"
              label="Every"
              @update:modelValue="changeRepeat"
            />
          </div>
          <div class="col-6">
            <q-select
              borderless
              color="orange"
              v-model="value"
              :options="valueOptions"
              label="Count"
              @update:modelValue="changeRepeat"
            />
          </div>
        </div>
      </q-date>
    </q-menu>
    <slot name="default" />
    <q-dialog
      v-if="isMobile"
      v-model="showMenu"
      maximized
      @hide="updateModelValue"
    >
      <q-card>
        <div style="display: flex; justify-content: flex-end">
          <q-btn dense flat icon="close" v-close-popup>
            <q-tooltip>Close</q-tooltip>
          </q-btn>
        </div>
        <q-date
          class="mobile-datepicker"
          color="orange"
          mask="YYYY-MM-DD"
          @click.stop
          :modelValue="isSomeday ? null : when"
          @update:modelValue="(value) => (when = value)"
          :options="dateOptions"
          minimal
        >
          <q-btn
            :flat="!item.repeat"
            @click="addSomeday"
            style="width: 100%; text-align: center"
          >
            <div class="row" :class="{ active: isSomeday }" style="width: 100%">
              <q-icon name="unarchive" />
              <q-space />
              <span>Someday</span>
              <q-space />
              <q-icon
                name="close"
                v-if="isSomeday"
                @click.stop="removeSomeday"
              />
            </div>
          </q-btn>
        </q-date>
        <div class="mobile-actions">
          <q-btn
            style="width: 100%; text-align: center"
            v-if="!addRepeat"
            @click.stop="showRepeatMenu = !showRepeatMenu"
          >
            <div class="row active" style="width: 100%" v-if="item.repeat">
              <q-icon name="repeat" />
              <q-space />
              <span>{{ item.repeat }}</span>
              <q-space />
              <q-icon name="close" @click.stop="removeRepeat" />
            </div>
            <div class="row" style="width: 100%" v-else>
              <q-icon name="add" />
              <q-space />
              <span>Repeat</span>
              <q-space />
            </div>
          </q-btn>
          <div
            v-if="showRepeatMenu"
            class="row"
            style="padding-left: 10px; padding-right: 10px"
          >
            <div class="col-6">
              <q-select
                borderless
                color="orange"
                v-model="unit"
                :options="unitOptions"
                label="Every"
                @update:modelValue="changeRepeat"
              />
            </div>
            <div class="col-6">
              <q-select
                borderless
                color="orange"
                v-model="value"
                :options="valueOptions"
                label="Count"
                @update:modelValue="changeRepeat"
              />
            </div>
          </div>
        </div>
      </q-card>
    </q-dialog>
  </q-btn>
</template>

<script>
import { isToday, isFuture, formatDate } from "src/common/date.js";

export default {
  data(props) {
    const repeat = props.modelValue.repeat?.split(":");
    const [unit, value] = repeat ? repeat : [null, null];
    return {
      showMenu: false,
      item: { ...props.modelValue },
      valueOptions: [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
      unitOptions: ["day", "week", "month", "year"],
      addRepeat: false,
      showRepeatMenu: false,
      unit: unit,
      value: value,
      when: props.modelValue.when,
    };
  },
  unmounted() {
    console.log(
      "DatePicker unmounted",
      JSON.stringify(this.modelValue) !== JSON.stringify(this.item)
    );
    if (JSON.stringify(this.modelValue) !== JSON.stringify(this.item)) {
      this.updateModelValue();
    }
  },
  computed: {
    isMobile() {
      return this.$q.platform.is.mobile;
    },
    isSomeday() {
      return formatDate(this.when) === "Someday";
    },
  },
  props: {
    modelValue: {
      type: Object,
      required: true,
    },
  },
  methods: {
    multiply(string, number) {
      return number > 1 ? string + s : string;
    },
    dateOptions(timestamp) {
      return isToday(timestamp) || isFuture(timestamp);
    },
    updateModelValue() {
      const item = { ...this.item, when: this.when };
      console.log("update model value ", item);
      this.$emit("update:modelValue", item);
    },
    removeRepeat() {
      console.log("changeRepeat", this.item);
      this.showRepeatMenu = false;
      this.item.repeat = null;
      // this.updateModelValue();
    },
    changeRepeat(option) {
      console.log("changeRepeat", option, this.unit, this.value);
      if (this.unit && this.value) {
        this.item.repeat = `${this.unit}:${this.value}`;
        // this.updateModelValue();
      }
    },
    addSomeday() {
      this.when = new Date(0);
      // this.updateModelValue();
    },
    removeSomeday() {
      this.when = null;
      // this.updateModelValue();
    },
  },
};
</script>
<style scoped lang="scss">
.mobile-datepicker {
  width: 100%;
  height: 80%;
  padding: 10px;
}
.mobile-actions {
  width: 100%;
  padding-left: 26px;
  padding-right: 26px;
}
.active {
  color: $orange;
}
</style>