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

    <q-drawer
      v-model="leftDrawerOpen"
      persistent
      bordered
      :width="this.small ? $q.screen.width : 300"
      behavior="desktop"
    >
      <div>
        <q-list class="menu-section">
          <q-item
            v-if="user.id"
            clickable
            @click="navigateTo('profile')"
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
            @click="navigateTo('login')"
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
            @click="navigateTo('today')"
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
            @click="navigateTo('upcoming')"
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
            @click="navigateTo('anytime')"
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
            @click="navigateTo('someday')"
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
            @click="navigateTo('logbook')"
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
            @click="navigateTo('trash')"
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
                @dragover="(e) => onDragover(e, element)"
                @dragleave="(e) => onDragleave(e, element)"
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
                    @keydown.enter="commitProjectName(element)"
                    @update:modelValue="
                      (value) => updateProjectName(element, value)
                    "
                    @blur="commitProjectName(element)"
                    borderless
                    dense
                    autofocus
                    placeholder="New Project"
                  />
                  <span v-else>{{ element.title }}</span>
                </q-item-section>

                <q-item-section side v-if="element.user_id !== user.id">
                  <q-icon name="share" />
                </q-item-section>
              </q-item>
            </template>
          </draggable>
        </q-list>
      </div>
      <q-footer>
        <q-toolbar class="fixed-bottom footer">
          <q-toolbar-title v-if="user.id">
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
  // mounted() {
  //   console.log('Layout.vue mounted');
  //   if (this.$route.name == "project" && !this.currentProject) {
  //     this.$router.push("today");
  //   }
  // },
  data() {
    return {
      leftDrawerOpen: this.small,
      drag: false,
      projects: [],
      focusedProject: null,
    };
  },
  mounted() {
    console.log("Layout.vue mounted");
    this.projects = JSON.parse(JSON.stringify(this.userProjects));
    this.$q.loading.hide();
  },
  watch: {
    userProjects: {
      handler(value) {
        this.projects = JSON.parse(JSON.stringify(value));
      },
    },
  },
  methods: {
    onDragover(e, project) {
      if (e.dataTransfer.types[1] == "notes") {
        this.focusedProject = project;
      }
    },
    onDragleave(e) {
      this.focusedProject = null;
    },
    onDrop(e) {
      e.stopPropagation();
      console.log("onDrop", e);
      const notes = e.dataTransfer.getData("notes");
      if (notes) {
        JSON.parse(notes).forEach((note) => {
          // console.log("drop note: ", note);
          this.$store.commit("cache/remove", {
            key: note.project.id,
            item: note,
          });
          this.$store.commit("cache/removeProjects", {
            key: "anytime",
            item: note,
          });
          note.project_id = this.focusedProject.id;
          note.project = this.focusedProject;
          this.$store.commit("cache/add", { key: note.project.id, item: note });
          this.$store.commit("cache/addProjects", {
            key: "anytime",
            item: note,
          });
          this.$mutateQueue({
            mutation: UPDATE_NOTE_PROJECT,
            variables: note,
          });
        });
        this.$store.commit("cache/save");
      }
      this.onDragleave(e);
      e.dataTransfer.clearData();
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
          update_columns: ["position"],
        },
      });
    },
    selectProject(project) {
      console.log("selectProject", project);
      this.navigateTo("project", { id: project.id });
    },
    navigateTo(name, params) {
      this.$router.push({ name, params });
      if (this.small) {
        this.$nextTick(() => {
          this.leftDrawerOpen = false;
        })
      }
    },
    updateProjectName(project, value) {
      project.title = value;
      console.log("updateProjectName", project, value);
      this.$store.commit("user/updateProject", project);
    },
    commitProjectName(project) {
      this.$mutateQueue({
        mutation: UPDATE_PROJECT_NAME_BY_PK,
        variables: {
          id: project.id,
          title: project.title,
        },
      }).then(() => project.edit = false);
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
    isMobile() {
      return this.$q.platform.is.mobile;
    },
    small() {
      return this.$q.screen.width <= 1023;
    },
    user() {
      return this.$store.state.user;
    },
    userProjects() {
      return this.user.projects.filter(project => !project.done && !project.deleted);
    },
    currentProject() {
      return this.$route.name
        ? this.userProjects.find(
            (project) => project.id == this.$route.params.id
          )
        : null;
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
