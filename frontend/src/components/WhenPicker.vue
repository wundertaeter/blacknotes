<template>
  <q-btn @click="isMobile ? (showMenu = true) : null">
    <q-menu v-if="!isMobile" v-model="showMenu">
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
          <span v-if="item.repeat">
            <q-icon name="repeat" /> {{ item.repeat }}
          </span>
          <span v-else> <q-icon name="add" /> Repeat </span>

          <q-menu v-model="showRepeatMenu" fit>
            <div class="row" style="padding-left: 10px; padding-right: 10px">
              <div class="col-6">
                <q-select
                  borderless
                  color="orange"
                  v-model="unit"
                  :options="unitOptions"
                  label="Unit"
                  @update:modelValue="changeRepeat"
                />
              </div>
              <div class="col-6">
                <q-select
                  borderless
                  color="orange"
                  v-model="value"
                  :options="valueOptions"
                  label="Value"
                  @update:modelValue="changeRepeat"
                />
              </div>
            </div>
          </q-menu>
          <q-space />
          <span v-if="item.repeat">
            <q-icon name="close" @click.stop="removeRepeat" />
          </span>
        </q-btn>
      </q-date>
    </q-menu>
    <slot name="default" />
    <q-dialog v-if="isMobile" v-model="showMenu">
      <q-card>
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
            <span v-if="item.repeat">
              <q-icon name="repeat" /> {{ item.repeat }}
            </span>
            <span v-else> <q-icon name="add" /> Repeat </span>

            <q-menu v-model="showRepeatMenu" fit>
              <div class="row" style="padding-left: 10px; padding-right: 10px">
                <div class="col-6">
                  <q-select
                    borderless
                    color="orange"
                    v-model="unit"
                    :options="unitOptions"
                    label="Unit"
                    @update:modelValue="changeRepeat"
                  />
                </div>
                <div class="col-6">
                  <q-select
                    borderless
                    color="orange"
                    v-model="value"
                    :options="valueOptions"
                    label="Value"
                    @update:modelValue="changeRepeat"
                  />
                </div>
              </div>
            </q-menu>

            <q-space />
            <span v-if="item.repeat">
              <q-icon name="close" @click.stop="removeRepeat" />
            </span>
          </q-btn>
        </q-date>
      </q-card>
    </q-dialog>
  </q-btn>
</template>

<script>
import { isToday, isFuture } from "src/common/date.js";

export default {
  data(props) {
    const repeat = props.modelValue.repeat?.split(":");
    const [unit, value] = repeat ? repeat : [null, null];
    return {
      showMenu: false,
      item: { ...props.modelValue },
      valueOptions: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      unitOptions: ['day', 'week', 'month', 'year'],
      addRepeat: false,
      showRepeatMenu: false,
      unit: unit,
      value: value,
    };
  },
  watch: {
    modelValue: {
      handler(value) {
        this.item = { ...value };
      },
    },
  },
  computed: {
    isMobile() {
      return this.$q.platform.is.mobile;
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
      console.log("update model value ", this.item);
      this.$emit("update:modelValue", this.item);
    },
    removeRepeat() {
      console.log("changeRepeat", this.item);
      this.item.repeat = null;
      this.updateModelValue();
    },
    changeRepeat(option) {
      console.log("changeRepeat", option, this.unit, this.value);
      if (this.unit && this.value) {
      }
      this.item.repeat = `${this.unit}:${this.value}`;

      this.updateModelValue();
    },
  },
};
</script>