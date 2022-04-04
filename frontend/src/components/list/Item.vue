<template>
  <q-card
    style="cursor: grab"
    :class="{ focused: focused }"
    @dblclick="
      edit = true;
      focusTitle();
    "
  >
     <q-checkbox
        v-if="modelValue.icon"
        v-model="done"
        size="lg"
        color="orange"
        checked-icon="radio_button_checked"
        :unchecked-icon="modelValue.icon"
        indeterminate-icon="help"
        style="position: absolute; top: 19px; left: -5px; z-index: 999"
        @update:modelValue="$emit('check', modelValue)"
      />   
    <q-checkbox
      v-else
      v-model="done"
      @update:modelValue="$emit('check', modelValue)"
      style="position: absolute; top: 24px; z-index: 999"
      color="orange"
    />
    <q-card-section class="text-white editor">
      <div class="row justify-center" style="height: 55px" v-if="!edit">
        <div class="col-6 text-left self-center ellipsis">
          {{ title ? title : "New To-Do" }}
        </div>
        <div class="col-6 text-right self-center ellipsis">
          <span class="deadline" v-if="deadline && datePreview">
            <q-icon name="today" />
            {{ formatDate(deadline, "D. MMM") }}
          </span>
        </div>
      </div>
      <q-input
        v-if="edit"
        :readonly="readonly"
        borderless
        ref="title"
        :autofocus="autofocus"
        v-model="title"
        @update:modelValue="updateModelValue"
        placeholder="New To-Do"
      />
      <q-input
        v-if="edit && focused"
        v-model="content"
        borderless
        @focus="onContentFocus"
        @blur="onContentBlur"
        ref="content"
        class="content-area"
        type="textarea"
        placeholder="Notes"
        @update:modelValue="updateModelValue"
      />
      <!--editor
        :readonly="readonly"
        v-model="content"
        @update:modelValue="updateModelValue"
      /-->
    </q-card-section>

    <q-card-actions class="actions-card" v-if="edit && focused">
      <div class="editor-actions">
        <q-btn
          :disable="readonly"
          :outline="btnHover"
          :flat="!btnHover"
          @mouseleave="btnHover = false"
          @mouseover="btnHover = true"
          @click="removeDeadline"
          v-if="deadline"
        >
          <q-icon name="today" />
          {{ formatDate(deadline, "ddd D. MMM") }}
          <q-icon name="close" v-if="btnHover" style="margin-left: 10px" />
        </q-btn>

        <q-btn
          flat
          :disable="readonly"
          icon="calendar_month"
          class="float-right"
        >
          <q-menu v-model="showMenu">
            <q-date
              v-model="deadline"
              :options="dateOptions"
              minimal
              @update:modelValue="updateDeadline"
            />
          </q-menu>
        </q-btn>
      </div>
    </q-card-actions>
  </q-card>
</template>

<script>
const CHECK_NOTE = require("src/gql/mutations/CheckNote.gql");
import {
  formatDate,
  today,
  someday,
  isToday,
  isFuture,
} from "src/common/date.js";

export default {
  components: {},
  props: {
    modelValue: {
      type: Object,
    },
    readonly: {
      type: Boolean,
      required: false,
      default: false,
    },
    actions: {
      type: Boolean,
      required: false,
      default: true,
    },
    autofocus: {
      type: Boolean,
      required: false,
      default: false,
    },
    focused: {
      type: Boolean,
      required: false,
      default: false,
    },
    datePreview: {
      type: Boolean,
      required: false,
      default: true
    }
  },
  mounted() {
    document.addEventListener("keydown", this.onKeydown);
  },
  unmounted() {
    document.removeEventListener("keydown", this.onKeydown);
  },
  watch: {
    modelValue(value) {
      console.log('watcher from note', value.deadline);
      if (this.content !== value.content) {
        this.content = value.content;
      }

      if (this.title !== value.title) {
        this.title = value.title;
      }

      if (this.done !== value.done) {
        this.done = value.done;
      }

      if (this.deadline !== value.deadline) {
        this.deadline = value.deadline;
      }
    },
    focused: {
      handler(value) {
        if (!value) {
          this.blurTitle();
          this.edit = false;
        }
      },
    },
    edit: {
      handler(value) {
        this.$emit("edit", value ? this.modelValue : null);
      },
    },
  },
  data() {
    return {
      edit: false,
      deadline: this.modelValue.deadline,
      done: this.modelValue.done,
      showMenu: false,
      btnHover: false,
      content: this.modelValue.content,
      title: this.modelValue.title,
      checkNoteTimeout: null,
      contentFocused: false,
    };
  },
  computed: {
    today() {
      return today();
    },
    someday() {
      return someday();
    },
  },
  methods: {
    dateOptions(timestamp) {
      return isToday(timestamp) || isFuture(timestamp);
    },
    formatDate(timestamp, format) {
      return formatDate(timestamp, format);
    },
    removeDeadline() {
      this.deadline = null;
      this.updateModelValue();
    },
    updateDeadline() {
      this.showMenu = false;
      this.updateModelValue();
    },
    onContentFocus() {
      this.contentFocused = true;
    },
    onContentBlur() {
      this.contentFocused = false;
    },
    onKeydown(e) {
      if (!this.contentFocused && this.focused && e.keyCode == 13) {
        if (this.edit) {
          this.blurTitle();
          this.edit = false;
        } else {
          this.edit = true;
          this.focusTitle();
        }
      } else if (this.edit) {
        const textarea =
          this.$refs.content.$el.getElementsByTagName("textarea")[0];
        if (e.keyCode == 40) {
          e.preventDefault();
          const firstLineLen = this.content.split("\n")[0].length;
          this.$refs.content.focus();
          textarea.setSelectionRange(firstLineLen, firstLineLen);
        } else if (e.keyCode == 38) {
          const linerNum = textarea.value
            .substr(0, textarea.selectionStart)
            .split("\n").length;
          if (linerNum == 1) {
            e.preventDefault();
            this.$refs.title.focus();
            const title = this.$refs.title.$el.getElementsByTagName("input")[0];
            title.setSelectionRange(this.title.length, this.title.length);
          }
        }
      }
    },
    focusTitle() {
      this.$nextTick(() => {
        if (this.$refs.title) this.$refs.title.focus();
      });
    },
    blurTitle() {
      this.$nextTick(() => {
        if (this.$refs.title) this.$refs.title.blur();
      });
    },
    closeNote(e) {
      console.log("closeNote", this.edit);
      if (!this.edit) {
        e.stopPropagation();
        this.edit = true;
      }
    },
    checkNote() {
      const note = { ...this.modelValue, done: this.done };
      this.$emit("update/modelValue", note);
      if (this.checkNoteTimeout) {
        clearTimeout(this.checkNoteTimeout);
      }
      this.checkNoteTimeout = setTimeout(() => {
        this.$apollo.mutate({
          mutation: CHECK_NOTE,
          variables: {
            id: note.id,
            done: note.done,
          },
        });
      }, 1000);
    },
    updateModelValue() {
      const note = {
        ...this.modelValue,
        deadline: this.deadline,
        title: this.title,
        content: this.content,
      };
      this.$emit("update:modelValue", note);
    },
  },
};
</script>

<style lang="scss">
.ProseMirror:focus {
  outline: none;
}
.editor {
  margin-left: 23px;
  margin-right: 23px;
}
.editor-actions {
  width: 100%;
}
.actions-card {
  border-top: 1px solid black;
}
.focused {
  border: 3px solid $orange;
}
.deadline {
  min-width: 100px;
}
</style>