<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" persistent bordered>
      <div>
        <q-list class="menu-section">
          <q-item
            v-if="user.id"
            clickable
            to="profile"
            active-class="text-orange"
            :active="projectActive('profile')"
          >
            <q-item-section avatar>
              <q-icon name="account_circle" />
            </q-item-section>

            <q-item-section>
              <q-item-label> {{ user.username }} </q-item-label>
            </q-item-section>
          </q-item>
          <q-item
            v-else
            clickable
            to="login"
            active-class="text-orange"
            :active="projectActive('login')"
          >
            <q-item-section avatar>
              <q-icon name="login" />
            </q-item-section>

            <q-item-section>
              <q-item-label> Login </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>

        <q-separator />

        <q-list class="menu-section">
          <q-item
            clickable
            to="today"
            active-class="text-orange"
            :active="projectActive('today')"
          >
            <q-item-section avatar>
              <q-icon name="star" />
            </q-item-section>

            <q-item-section>
              <q-item-label> Today </q-item-label>
            </q-item-section>
          </q-item>

          <q-item
            clickable
            to="upcoming"
            active-class="text-orange"
            :active="projectActive('upcoming')"
          >
            <q-item-section avatar>
              <q-icon name="date_range" />
            </q-item-section>

            <q-item-section>
              <q-item-label> Upcoming </q-item-label>
            </q-item-section>
          </q-item>

          <q-item
            clickable
            to="anytime"
            active-class="text-orange"
            :active="projectActive('anytime')"
          >
            <q-item-section avatar>
              <q-icon name="reorder" />
            </q-item-section>

            <q-item-section>
              <q-item-label> Anytime </q-item-label>
            </q-item-section>
          </q-item>

          <q-item
            clickable
            to="someday"
            active-class="text-orange"
            :active="projectActive('someday')"
          >
            <q-item-section avatar>
              <q-icon name="unarchive" />
            </q-item-section>

            <q-item-section>
              <q-item-label> Someday </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>

        <q-separator />

        <q-list class="menu-section">
          <q-item
            clickable
            to="logbook"
            active-class="text-orange"
            :active="projectActive('logbook')"
          >
            <q-item-section avatar>
              <q-icon name="assignment_turned_in" />
            </q-item-section>

            <q-item-section>
              <q-item-label> Logbook </q-item-label>
            </q-item-section>
          </q-item>
          <q-item
            clickable
            to="trash"
            active-class="text-orange"
            :active="projectActive('trash')"
          >
            <q-item-section avatar>
              <q-icon name="delete" />
            </q-item-section>

            <q-item-section>
              <q-item-label> Trash </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>

        <q-separator />

        <q-list class="menu-section">
          <draggable
            v-model="projects"
            :group="{ name: 'people', put: false }"
            @end="updatePositions"
            item-key="id"
          >
            <template #item="{ element }">
              <q-item
                :class="{
                  item: true,
                  focused: element.id == focusedProject?.id,
                }"
                clickable
                @dblclick="element.edit = true"
                @drop="onDrop"
                @dragover="onDragover(element)"
                @dragleave="onDragleave(element)"
                @click="selectProject(element)"
                @keydown.enter="element.edit = true"
                active-class="text-orange"
                :active="projectActive(element)"
              >
                <q-item-section avatar>
                  <q-icon :name="element.icon" />
                </q-item-section>

                <q-item-section>
                  <q-input
                    v-if="element.edit || !element.title"
                    v-model="element.title"
                    @blur="updateProjectName(element)"
                    @keydown.enter="updateProjectName(element)"
                    borderless
                    dense
                    autofocus
                    placeholder="New Project"
                  />
                  <span v-else>{{ element.title }}</span>
                </q-item-section>
              </q-item>
            </template>
          </draggable>
        </q-list>
      </div>
      <q-footer>
        <q-toolbar class="fixed-bottom footer">
          <q-toolbar-title>
            <q-btn icon="add" label="New List" @click="createProject">
              <!--q-menu>
                <q-list style="min-width: 100px">
                  <q-item clickable v-close-popup @click="createProject">
                    <q-item-section avatar>
                      <q-icon name="radio_button_unchecked" />
                    </q-item-section>

                    <q-item-section> New Project </q-item-section>
                  </q-item>
                  <q-item clickable v-close-popup>
                    <q-item-section avatar>
                      <q-icon name="view_in_ar" />
                    </q-item-section>

                    <q-item-section> New Space </q-item-section>
                  </q-item>
                </q-list>
              </q-menu-->
            </q-btn>
          </q-toolbar-title>
        </q-toolbar>
      </q-footer>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { defineComponent } from "vue";
import CREATE_PROJECT from "src/gql/mutations/CreateProject.gql";
import UPDATE_NOTE_PROJECT from "src/gql/mutations/UpdateNoteProject.gql";
import draggable from "vuedraggable";
const UPDATE_PROJECT_NAME_BY_PK = require("src/gql/mutations/UpdateProjectNameByPk.gql");
const SORT_PROJECTS = require("src/gql/mutations/SortProjects.gql");
import { uuidv4 } from "src/common/utils.js";
export default defineComponent({
  name: "MainLayout",
  components: {
    draggable,
  },
  mounted() {
    if (this.$route.name == "project" && !this.currentProject) {
      this.$router.push("/today");
    }
  },
  data() {
    return {
      leftDrawerOpen: true,
      drag: false,
      projects: [],
      focusedProject: null,
    };
  },
  mounted() {
    this.projects = JSON.parse(JSON.stringify(this.userProjects));
  },
  watch: {
    userProjects: {
      handler(value) {
        this.projects = JSON.parse(JSON.stringify(value));
      },
    },
  },
  methods: {
    onDragover(project) {
      this.focusedProject = project;
    },
    onDragleave(project) {
      this.focusedProject = null;
    },
    onDrop(e) {
      console.log("onDrop", e);
      let note = e.dataTransfer.getData("note");
      if (note) {
        note = JSON.parse(note);
        console.log("drop note: ", note);
        this.$apollo.mutate({
          mutation: UPDATE_NOTE_PROJECT,
          variables: {
            id: note.id,
            project_id: this.focusedProject.id,
          },
        });
      } else {
        let project = e.dataTransfer.getData("project");
        if (project) {
          project = JSON.parse(project);
          console.log("drop project: ", project);
        }
      }

      this.onDragleave();
    },
    projectActive(project) {
      if (this.currentProject && this.$route.name == "project") {
        if (typeof project != "object") return false;
        return this.currentProject.id == project.id;
      } else {
        return project == this.$route.name;
      }
    },
    updatePositions(e) {
      console.log("update position", e);
      for (let i = 0; i < this.projects.length; i++) {
        this.projects[i].position = i;
        delete this.projects[i].edit;
        delete this.projects[i].__typename;
      }
      this.$apollo.mutate({
        mutation: SORT_PROJECTS,
        variables: {
          objects: this.projects,
        },
      });
    },
    selectProject(project) {
      this.$store.commit("user/updateCurrentProject", project);
      this.$router.push("/");
    },
    updateProjectName(project) {
      if (!project.title) return;
      console.log("updateProjectName", project);
      this.$apollo
        .mutate({
          mutation: UPDATE_PROJECT_NAME_BY_PK,
          variables: {
            id: project.id,
            title: project.title,
          },
        })
        .then(() => (project.edit = false));
    },
    toggleLeftDrawer() {
      this.leftDrawerOpen = !this.leftDrawerOpen;
    },
    createProject() {
      const project = {
        id: uuidv4(),
        user_id: this.user.id,
        position: this.maxPosition + 1,
        icon: "radio_button_unchecked",
      };
      this.$store.commit("user/updateProjects", [
        ...this.userProjects,
        project,
      ]);
      this.$apollo.mutate({
        mutation: CREATE_PROJECT,
        variables: project,
      });
    },
  },
  computed: {
    user() {
      return this.$store.state.user;
    },
    userProjects() {
      return this.user.projects;
    },
    currentProject() {
      return this.$store.getters["user/getCurrentProject"];
    },
    maxPosition() {
      const positions = this.projects.map((project) => project.position);
      return positions.length ? Math.max(...positions) : 0;
    },
  },
});
</script>
<style scoped lang="scss">
.menu-section {
  margin-top: 20px;
  margin-bottom: 20px;
}
.item {
  height: 50px;
}
.focused {
  border: 3px solid $orange;
}
</style>