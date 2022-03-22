<template>
  <q-page>
    <q-scroll-area class="fill-window">
      <div v-if="projectCopy" class="q-pa-md container">
        <h4>
          <q-icon v-if="projectCopy.default" :name="projectCopy.icon" />
          <q-checkbox
            v-else
            v-model="projectCopy.done"
            size="lg"
            color="orange"
            checked-icon="radio_button_checked"
            :unchecked-icon="projectCopy.icon"
            indeterminate-icon="help"
            @update:modelValue="checkProject(projectCopy)"
          />
          {{ projectCopy.name ? projectCopy.name : 'New Project' }}
        </h4>

        <draggable
          v-model="projectCopy.notes"
          @end="updatePositions"
          item-key="id"
        >
          <template #item="{ element }">
             <note
              class="note"
              v-model="projectCopy.notes[projectCopy.notes.indexOf(element)]"
              @update:modelValue="updateNote"
              @done="checkNote(note)"
            />
          </template>
        </draggable>
         
      </div>
    </q-scroll-area>
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
import draggable from "vuedraggable";
const CREATE_NOTE = require("src/gql/mutations/CreateNote.gql");
const GET_PROJECT = require("src/gql/queries/GetProject.gql");
const SUBSCRIBE_PROJECT = require("src/gql/subscriptions/SubscribeProject.gql");
const DELETE_NOTE_BY_PK = require("src/gql/mutations/DeleteNoteByPk.gql");
const PROJECT_TO_TRASH = require("src/gql/mutations/ProjectToTrash.gql");
const CHECK_PROJECT = require("src/gql/mutations/CheckProject.gql");
const UPDATE_NOTE = require("src/gql/mutations/UpdateNote.gql");
const SORT_NOTES = require("src/gql/mutations/SortNotes.gql");


export default defineComponent({
  name: "PageIndex",
  components: {
    Note,
    draggable,
  },
  data() {
    return {
      projectCopy: null,
      updateId: null
    };
  },
  watch: {
    project: {
      handler(project) {
        console.log('watcher', project);
        if (project) {
          this.projectCopy = JSON.parse(JSON.stringify(project));
        } else {
          this.$store.commit("user/updateCurrentProject", null);
        }
      },
      deep: true,
    },
  },
  methods: {
    updatePositions() {
      const objs = [];
      for (let i = 0; i < this.projectCopy.notes.length; i++) {
        this.projectCopy.notes[i].position = i;
        objs.push(this.projectCopy.notes[i]);
        delete objs[i].__typename;
      }
      this.$apollo.mutate({
        mutation: SORT_NOTES,
        variables: {
          objects: objs,
        }
      });
    },
    //updateCache(store, { data: { note } }) {
    //  const query = {
    //    query: GET_PROJECT,
    //    variables: {
    //      id: this.currentProject.id,
    //    },
    //  };
    //  const data = JSON.parse(JSON.stringify(store.readQuery(query)));
    //  data.project.notes = this.projectCopy.notes;
    //  // Write back to the cache
    //  store.writeQuery({
    //    ...query,
    //    data,
    //  });
    //},
    checkProject(project){
      setTimeout(() => {
        if(!project.done) return;
        this.$apollo.mutate({
          mutation: CHECK_PROJECT,
          variables: {
            id: project.id
          }
        })
        this.$store.commit('user/updateCurrentProject', null);
      }, 1000)
    },
    //removeToCache(store, { data: note }) {
    //  const query = {
    //    query: GET_PROJECT,
    //    variables: {
    //      id: this.project.id,
    //    },
    //  };
    //  const data = JSON.parse(JSON.stringify(store.readQuery(query)));
//
    //  data.project.notes = data.project.notes.filter((n) => n.id != note.id);
    //  // Write back to the cache
    //  store.writeQuery({
    //    ...query,
    //    data,
    //  });
    //},
    //addToCache(store, { data: { note } }) {
    //  const query = {
    //    query: GET_PROJECT,
    //    variables: {
    //      id: this.project.id,
    //    },
    //  };
    //  const data = JSON.parse(JSON.stringify(store.readQuery(query)));
    //  data.project.notes = [...data.project.notes, note];
    //  // Write back to the cache
    //  store.writeQuery({
    //    ...query,
    //    data,
    //  });
    //},
    addNote() {
      this.$apollo.mutate({
        mutation: CREATE_NOTE,
        variables: {
          user_id: this.$store.state.user.id,
          position: this.project.notes.length + 1,
          project_id: this.project.id,
        },
        //update: this.addToCache,
      });
    },
    updateNote(note) {
      console.log("update note!! with throttle 1000", note);
      if(this.updateId) clearTimeout(this.updateId);
      this.updateId = setTimeout(() => {
        this.$apollo.mutate({
          mutation: UPDATE_NOTE,
          variables: {
            id: note.id,
            title: note.title ?? "",
            content: note.content ?? "",
            deadline: note.deadline
          }
        })
      }, 1000)
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

.notes {
  position: relative;
  text-align: center;
}

.container {
  margin-left: 50px;
  margin-right: 50px;
}

.head-icon {
  margin-right: 5px;
}

.fill-window {
  height: calc(100vh - 105px);
  width: 100%;
}
</style>
