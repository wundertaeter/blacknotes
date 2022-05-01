<template>
  <q-card flat :class="{ focused: focused, item: true }">
    <q-checkbox
      v-if="modelValue.icon"
      v-model="done"
      size="lg"
      color="orange"
      checked-icon="radio_button_checked"
      :unchecked-icon="modelValue.icon"
      indeterminate-icon="help"
      class="icon-checkbox"
      @update:modelValue="$emit('check', modelValue)"
    />
    <q-checkbox
      v-else
      v-model="done"
      @update:modelValue="$emit('check', modelValue)"
      class="checkbox"
      color="orange"
    />
    <q-card-section class="text-white editor">
      <div class="row justify-center list-view" v-if="!edit">
        <div
          :class="{
            'col-6 text-left self-center ellipsis': true,
            'display-project': renderProjectTitle,
          }"
        >
          {{ title ? title : "New To-Do" }}
          <br />
          <span v-if="renderProjectTitle" class="project-title">
            {{ modelValue.project.title }}
          </span>
        </div>
        <div class="col-6 text-right self-center ellipsis">
          <span class="when" v-if="when && datePreview">
            <q-icon name="today" />
            {{ formatDate(when, "D. MMM") }}
          </span>
        </div>
      </div>
      <div v-else>
        <q-input
          :readonly="readonly"
          borderless
          ref="title"
          :autofocus="autofocus"
          v-model="title"
          @update:modelValue="updateModelValue"
          placeholder="New To-Do"
        />
        <q-input
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
      </div>
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
          @click="removewhen"
          v-if="when"
        >
          <q-icon name="today" />
          {{ formatDate(when, "ddd D. MMM") }}
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
              v-model="when"
              :options="dateOptions"
              minimal
              @update:modelValue="updatewhen"
            />
          </q-menu>
        </q-btn>
      </div>
    </q-card-actions>
  </q-card>
</template>

<script>
const UPDATE_NOTE = require("src/gql/mutations/UpdateNote.gql");
import { toDatabaseString } from "src/common/date.js";
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
    edited: {
      type: Boolean,
      required: false,
      default: false,
    },
    datePreview: {
      type: Boolean,
      required: false,
      default: true,
    },
  },
  mounted() {
    document.addEventListener("keydown", this.onKeydown);
  },
  unmounted() {
    document.removeEventListener("keydown", this.onKeydown);
  },
  watch: {
    modelValue(value) {
      if (this.content !== value.content) {
        this.content = value.content;
      }

      if (this.title !== value.title) {
        this.title = value.title;
      }

      if (this.done !== value.done) {
        this.done = value.done;
      }

      if (this.when !== value.when) {
        this.when = value.when;
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
    edited: {
      handler(value) {
        if(value){
          this.edit = true;
          if (this.modelValue.__typename.includes("_note")) {
            this.edit = true;
            this.focusTitle();
          } else {
            this.$store.commit("user/updateCurrentProject", this.modelValue);
            this.$router.push("/");
          }
        }
      },
    },
    edit: {
      handler(value){
        this.$emit("edit", value ? this.modelValue : null);
      }
    }
  },
  data() {
    return {
      edit: false,
      when: this.modelValue.when,
      done: this.modelValue.done,
      showMenu: false,
      btnHover: false,
      content: this.modelValue.content,
      title: this.modelValue.title,
      checkNoteTimeout: null,
      contentFocused: false,
      updateId: null,
    };
  },
  computed: {
    today() {
      return today();
    },
    someday() {
      return someday();
    },
    renderProjectTitle() {
      return this.$route.name != "project" && this.modelValue.project;
    },
  },
  methods: {
    updateNote(note) {
      this.$loading(true);
      if (this.updateId) clearTimeout(this.updateId);
      this.updateId = setTimeout(() => {
        this.$mutateQueue({
          mutation: UPDATE_NOTE,
          variables: {
            id: note.id,
            title: note.title ?? "",
            content: note.content ?? "",
            when: note.when ? toDatabaseString(note.when) : null,
          },
        });
      }, 500);
    },
    dateOptions(timestamp) {
      return isToday(timestamp) || isFuture(timestamp);
    },
    formatDate(timestamp, format) {
      return formatDate(timestamp, format);
    },
    removewhen() {
      this.when = null;
      this.updateModelValue();
    },
    updatewhen() {
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
    updateModelValue() {
      const note = {
        ...this.modelValue,
        when: this.when,
        title: this.title,
        content: this.content,
      };
      this.$emit("update:modelValue", note);
      this.updateNote(note);
      this.$updateCache(note);
    },
  },
};
</script>

<style scoped lang="scss">
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
.when {
  min-width: 100px;
}
.item {
  border-radius: 5px;
  cursor: grab;
  /*background-color: transparent;*/
}
.project-title {
  color: $grey;
  font-size: 70%;
}
.display-project {
  margin-top: 7.5px;
  line-height: 80%;
}
.list-view {
  height: 55px;
}
.icon-checkbox {
  position: absolute;
  top: 19px;
  left: -5px;
  z-index: 999;
}
.checkbox {
  position: absolute;
  top: 24px;
  z-index: 999;
}
</style>