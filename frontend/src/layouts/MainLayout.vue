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
            group="people"
            @end="updatePositions"
            item-key="id"
          >
            <template #item="{ element }">
              <q-item
                class="item"
                clickable
                @dblclick="element.edit = true"
                @click="selectProject(element)"
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
            <q-btn icon="add" label="New List">
              <q-menu>
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
              </q-menu>
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
import draggable from "vuedraggable";
const UPDATE_PROJECT_NAME_BY_PK = require("src/gql/mutations/UpdateProjectNameByPk.gql");
const SORT_PROJECTS = require("src/gql/mutations/SortProjects.gql");
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
    };
  },
  mounted(){
    this.projects = JSON.parse(JSON.stringify(this.userProjects));;
  },
  watch: {
    userProjects: {
      handler(value) {
        this.projects = JSON.parse(JSON.stringify(value));
      },
    },
  },
  methods: {
    projectActive(project) {
      if (this.currentProject && this.$route.name == "project") {
        if (typeof project != "object") return false;
        return this.currentProject.id == project.id;
      } else {
        return project == this.$route.name;
      }
    },
    updatePositions(data) {
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
      project.edit = false;
      if (!project.title) return;
      console.log("updateProjectName", project);
      this.$apollo.mutate({
        mutation: UPDATE_PROJECT_NAME_BY_PK,
        variables: {
          id: project.id,
          title: project.title,
        },
      });
    },
    toggleLeftDrawer() {
      this.leftDrawerOpen = !this.leftDrawerOpen;
    },
    maxPosition() {
      return this.projects.length > 0
        ? this.projects[this.projects.length - 1].position
        : 0;
    },
    createProject() {
      const maxPosition = this.maxPosition();
      this.$apollo.mutate({
        mutation: CREATE_PROJECT,
        variables: {
          user_id: this.user.id,
          position: maxPosition + 1,
        },
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
  },
});
</script>
<style scoped>
.menu-section {
  margin-top: 20px;
  margin-bottom: 20px;
}
.item {
  height: 50px;
}
</style>