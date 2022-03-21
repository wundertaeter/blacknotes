<template>
  <q-page class="q-pa-md container">
    <h4 v-if="project">
      <q-icon v-if="project.default" :name="project.icon" />
      <q-checkbox
        v-else
        v-model="checked"
        size="lg"
        color="orange"
        checked-icon="radio_button_checked"
        :unchecked-icon="project.icon"
        indeterminate-icon="help"
      />
      {{ project.name }}
    </h4>
    <transition-group name="notes" tag="div">
      <note
        v-for="(note, index) in notes"
        :key="note.id"
        :class="{ note: true, transition: note.deleted }"
        v-model="notes[index]"
        @update:modelValue="updateNote"
        @delete="deleteNote(note)"
      />
    </transition-group>

    <q-footer class="fixed-bottom footer">
      <q-toolbar>
        <q-toolbar-title><q-btn icon="add" @click="addNote" /></q-toolbar-title>
      </q-toolbar>
    </q-footer>
  </q-page>
</template>

<script>
import { defineComponent } from "vue";
import Note from "src/components/Note.vue";
import CREATE_NOTE from "src/gql/mutations/CreateNote.gql";
import GET_PROJECT from "src/gql/queries/GetProject.gql";
import SUBSCRIBE_PROJECT from "src/gql/subscriptions/SubscribeProject.gql";
import DELETE_NOTE_BY_PK from "src/gql/mutations/DeleteNoteByPk.gql";

export default defineComponent({
  name: "PageIndex",
  components: {
    Note,
  },
  data() {
    return {
      notes: [],
      checked: false,
    };
  },
  watch: {
    project: {
      handler(project) {
        if (project) {
          this.notes = JSON.parse(JSON.stringify(project.notes));
        } else {
          this.$store.commit("user/updateCurrentProject", null);
        }
      },
      deep: true,
    },
  },
  methods: {
    deleteNote(note){
      console.log('delete note', note);
      note.deleted = true;
      this.$apollo.mutate({
        mutation: DELETE_NOTE_BY_PK,
        variables: {
          id: note.id
        },
        update: this.removeToCache
      })
    },
    removeToCache(store, { data: note }) {
      const query = {
        query: GET_PROJECT,
        variables: {
          id: this.project.id,
        },
      };
      const data = JSON.parse(JSON.stringify(store.readQuery(query)));

      data.project.notes = data.project.notes.filter(n => n.id != note.id);
      // Write back to the cache
      store.writeQuery({
        ...query,
        data,
      });
    },
    addToCache(store, { data: { note } }) {
      const query = {
        query: GET_PROJECT,
        variables: {
          id: this.project.id,
        },
      };
      const data = JSON.parse(JSON.stringify(store.readQuery(query)));
      data.project.notes = [...data.project.notes, note];
      // Write back to the cache
      store.writeQuery({
        ...query,
        data,
      });
    },
    addNote() {
      this.$apollo.mutate({
        mutation: CREATE_NOTE,
        variables: {
          user_id: this.$store.state.user.id,
          position: this.notes.length + 1,
          project_id: this.project.id,
        },
        update: this.addToCache,
      });
    },
    updateNote(value) {
      console.log("update note!!", value);
    },
  },
  computed: {
    currentProject() {
      return this.$store.getters["user/getCurrentProject"];
    },
  },
  apollo: {
    project: {
      query: GET_PROJECT,
      variables() {
        return {
          id: this.currentProject.id,
        };
      },
      skip() {
        return !this.currentProject;
      },
      subscribeToMore: {
        document: SUBSCRIBE_PROJECT,
        variables() {
          return {
            id: this.currentProject.id,
          };
        },
        skip() {
          return !this.currentProject;
        },
        updateQuery: (previousResult, { subscriptionData }) => {
          if (subscriptionData.data) {
            return { project: subscriptionData.data.project };
          }
          return previousResult;
        },
      },
    },
  },
});
</script>
<style scoped>
.note {
  margin-bottom: 15px;
}
.transition {
  transition: all 1s;
}

.notes {
  position: relative;
  text-align: center;
}

.notes-enter,
.notes-leave-to {
  opacity: 0;
}

.notes-enter {
  transform: translateY(30%);
}

.notes-leave-to {
  transform: translateX(300%);
}

.notes-leave-active {
  position: absolute;
}

.container {
  margin-left: 50px;
  margin-right: 50px;
}

.head-icon {
  margin-right: 5px;
}
</style>
