<template>
  <q-card style="cursor: grab" :class="{'focused': focused}">
    <q-checkbox
      v-model="done"
      @update:modelValue="checkNote"
      style="position: absolute; top: 24px; z-index: 999"
      color="orange"
    />
    <q-card-section class="text-white editor">
      <q-input
        :readonly="readonly || !edit"
        borderless
        :autofocus="autofocus"
        v-model="title"
        @update:modelValue="updateModelValue"
        placeholder="New To-Do"
      />
      <q-input
        v-if="edit"
        v-model="content"
        borderless
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

    <q-card-actions class="actions-card" v-if="edit">
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
    edit: {
      type: Boolean,
      required: false,
      default: false,
    },
    focused: {
      type: Boolean,
      required: false,
      default: false,
    }
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

      if (this.deleted !== value.deleted) {
        this.deleted = value.deleted;
      }
    },
  },
  data() {
    return {
      date: null,
      done: this.modelValue.done,
      deleted: this.modelValue.deleted,
      showMenu: false,
      btnHover: false,
      content: this.modelValue.content,
      title: this.modelValue.title,
      checkNoteTimeout: null,
    };
  },
  methods: {
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
.focused{
  border: 3px solid $orange;
}
</style>