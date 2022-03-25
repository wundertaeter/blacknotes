<template>
  <q-page>
    <q-scroll-area class="fill-window">
      <div v-if="project" class="q-pa-md container">
        <h4>
          <q-icon v-if="project.default" :name="project.icon" />
          <q-checkbox
            v-else
            v-model="project.done"
            size="lg"
            color="orange"
            checked-icon="radio_button_checked"
            :unchecked-icon="project.icon"
            indeterminate-icon="help"
            @update:modelValue="checkProject(project)"
          />
          {{ project.name ? project.name : "New Project" }}
        </h4>

        <note-list v-model="project.notes" />
      </div>
    </q-scroll-area>
    <q-footer class="fixed-bottom footer">
      <q-toolbar>
        <q-btn icon="add" @click="addNote" />
      </q-toolbar>
    </q-footer>
  </q-page>
</template>

<script>
import { defineComponent } from "vue";
import NoteList from "src/components/NoteList.vue";
const CREATE_NOTE = require("src/gql/mutations/CreateNote.gql");

export default defineComponent({
  name: "PageIndex",
  components: {
    NoteList,
  },
  data() {
    return {
      project: JSON.parse(JSON.stringify(this.modelValue)),
      maxPosition: Math.max(
        ...this.modelValue.notes.map((note) => note.position)
      ),
    };
  },
  props: {
    modelValue: {
      type: Object,
      required: true,
    },
    deadline: {
      type: Object,
      required: false,
      default: null,
    },
  },
  watch: {
    modelValue: {
      handler(value) {
        this.project = JSON.parse(JSON.stringify(value));
      },
      deep: true,
    },
  },
  methods: {
    addNote() {
      this.$apollo
        .mutate({
          mutation: CREATE_NOTE,
          variables: {
            user_id: this.$store.state.user.id,
            position: ++this.maxPosition,
            project_id: this.project.id,
            deadline: this.deadline,
          },
        })
        .then((result) => {
          this.project.notes.push(result.data.note);
        });
    },
  },
});
</script>
