<template>
  <q-card flat :class="{ selected: selected, item: true }">
    <q-checkbox
      v-if="item.icon"
      v-model="item.done"
      size="lg"
      color="orange"
      checked-icon="radio_button_checked"
      :unchecked-icon="item.icon"
      indeterminate-icon="help"
      class="icon-checkbox"
      @update:modelValue="$emit('check', item)"
    />
    <q-checkbox
      v-else
      v-model="item.done"
      @update:modelValue="$emit('check', item)"
      :class="edited ? 'checkbox-edit' : 'checkbox'"
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
          {{ item.title || "New To-Do" }}
          <br />
          <span v-if="renderProjectTitle" class="project-title">
            {{ item.project.title }}
          </span>
        </div>
        <div class="col-6 text-right self-center ellipsis">
          <span class="when" v-if="item.when && datePreview">
            <q-icon name="today" />
            {{ formatDate(item.when, "D. MMM") }}
          </span>
          <span v-else-if="item.user_id !== user.id">
            <q-icon name="share" />
          </span>
        </div>
      </div>
      <div v-else>
        <q-input
          :readonly="readonly"
          borderless
          ref="title"
          :autofocus="autofocus"
          v-model="item.title"
          @update:modelValue="updateModelValueLazy"
          placeholder="New To-Do"
        />
        <q-input
          v-model="item.content"
          borderless
          @focus="onContentFocus"
          @blur="onContentBlur"
          ref="content"
          class="content-area"
          type="textarea"
          placeholder="Notes"
          @update:modelValue="updateModelValueLazy"
        />
      </div>
      <!--editor
        :readonly="readonly"
        v-model="content"
        @update:modelValue="updateModelValue"
      /-->
    </q-card-section>

    <q-card-actions class="actions-card" v-if="edit && selected">
      <div class="editor-actions">
        <when-picker
          :disable="readonly"
          :outline="btnHover"
          :flat="!btnHover"
          @mouseleave="btnHover = false"
          @mouseover="btnHover = true"
          v-if="item.when"
          v-model="item"
          icon="today"
          @update:modelValue="updateModelValue"
          :label="formatDate(item.when, 'ddd D. MMM')"
        >
          <q-icon
            name="close"
            @click="removewhen"
            v-if="btnHover"
            style="margin-left: 10px"
          />
        </when-picker>

        <when-picker
          v-if="!item.when"
          flat
          :disable="readonly"
          v-model="item"
          @update:modelValue="updateModelValue"
          icon="calendar_month"
          class="float-right"
        />
      </div>
    </q-card-actions>
  </q-card>
</template>

<script>
const UPDATE_NOTE = require("src/gql/mutations/UpdateNote.gql");
import WhenPicker from "src/components/WhenPicker.vue";
import { formatDate, today, someday } from "src/common/date.js";

export default {
  components: {
    WhenPicker,
  },
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
    selected: {
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
      this.item = { ...value };
    },
    selected: {
      handler(value) {
        if (!value) {
          this.blurTitle();
          this.edit = false;
        }
      },
    },
    edited: {
      handler(value) {
        // console.log('edited item handler', value)
        if (value) {
          if (this.item.__typename.includes("_note")) {
            this.edit = true;
            if(!this.isMobile) this.focusTitle();
          } else {
            this.$router.push({
              name: "project",
              params: { id: this.item.id },
            });
          }
        }else{
          this.edit = false;
        }
      },
    },
    edit: {
      handler(value) {
        this.$emit("edit", value ? this.item : null);
      },
    },
  },
  data(props) {
    return {
      edit: false,
      item: { ...props.modelValue },
      btnHover: false,
      checkNoteTimeout: null,
      contentFocused: false,
      updateId: null,
    };
  },
  computed: {
    user() {
      return this.$store.state.user;
    },
    today() {
      return today();
    },
    someday() {
      return someday();
    },
    renderProjectTitle() {
      return this.$route.name != "project" && this.item.project;
    },
    isMobile(){
      return this.$q.platform.is.mobile;
    }
  },
  methods: {
    update(note) {
      this.$mutateQueue({
        mutation: UPDATE_NOTE,
        variables: note,
      });
      this.$emit("update:modelValue", note);
      this.$updateCache(note);
    },
    formatDate(timestamp, format) {
      return formatDate(timestamp, format);
    },
    removewhen() {
      this.item.when = null;
      this.updateModelValue();
    },
    onContentFocus() {
      this.contentFocused = true;
    },
    onContentBlur() {
      this.contentFocused = false;
    },
    onKeydown(e) {
      if (!this.contentFocused && this.selected && e.keyCode == 13) {
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
          const firstLineLen = this.item.content.split("\n")[0].length;
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
            title.setSelectionRange(
              this.item.title.length,
              this.item.title.length
            );
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
      this.update(this.item);
    },
    updateModelValueLazy() {
      this.$loading(true);
      if (this.updateId) clearTimeout(this.updateId);
      this.updateId = setTimeout(() => this.update(this.item), 500);
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
.selected {
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
  line-height: 80%;
}
.list-view {
  height: 20px;
}
.icon-checkbox {
  position: absolute;
  left: -5px;
  z-index: 999;
}
.checkbox {
  position: absolute;
  top: 6px;
  z-index: 999;
}
.checkbox-edit {
  position: absolute;
  top: 24px;
  z-index: 999;
}
</style>