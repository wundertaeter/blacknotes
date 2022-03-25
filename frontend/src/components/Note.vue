<template>
  <q-card
    style="cursor: grab"
    :class="{ focused: focused }"
    @dblclick="edit = true"
  >
    <q-checkbox
      v-model="done"
      @update:modelValue="$emit('check', modelValue)"
      style="position: absolute; top: 24px; z-index: 999"
      color="orange"
    />
    <q-card-section class="text-white editor">
      <q-input
        :readonly="readonly || !edit"
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
          @click="date = null"
          v-if="date"
          ><q-icon name="today" />{{ date
          }}<q-icon name="close" v-if="btnHover" style="margin-left: 10px"
        /></q-btn>

        <q-btn
          flat
          :disable="readonly"
          icon="calendar_month"
          class="float-right"
        >
          <q-menu v-model="showMenu">
            <q-date
              v-model="date"
              minimal
              mask="dddd, MMM D, YYYY"
              @update:modelValue="showMenu = false"
            />
          </q-menu>
        </q-btn>
      </div>
    </q-card-actions>
  </q-card>
</template>

<script>
const CHECK_NOTE = require("src/gql/mutations/CheckNote.gql");
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
      date: null,
      done: this.modelValue.done,
      showMenu: false,
      btnHover: false,
      content: this.modelValue.content,
      title: this.modelValue.title,
      checkNoteTimeout: null,
      contentFocused: false,
    };
  },
  methods: {
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
</style>