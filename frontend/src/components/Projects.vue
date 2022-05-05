<template>
  <q-page>
    <q-scroll-area class="fill-window" id="scrollArea">
      <div class="q-pa-md container">
        <h4>
          <q-icon :name="icon" />
          {{ title }}
        </h4>
        <div
          v-for="project in cache"
          :key="project.id"
          style="margin-top: 50px"
        >
          <div v-if="project.title">
            <span class="project-title"
              ><q-icon :name="project.icon" /> {{ project.title }}
            </span>
            <hr class="project-title-seperator" />
          </div>
          <list
            v-if="project.notes"
            @select="setSelectedItems"
            @edit="setEdit"
            :project="project"
            :position-column="positionColumn"
            :cache-key="id"
            group="people"
            :items="project.notes"
            :allItems="allItems"
            :selected="selectedItems"
            :edited="edit"
            @mounted="listComponentMounted"
            @check="check"
          />
        </div>
      </div>
    </q-scroll-area>
    <q-footer class="fixed-bottom footer">
      <q-toolbar>
        <slot name="toolbar" v-bind:addNote="addNote" />
      </q-toolbar>
    </q-footer>
  </q-page>
</template>

<script>
import { uuidv4 } from "src/common/utils.js";
import Base from "src/generics/Base.js";
export default {
  name: "ProjectsComponent",
  extends: Base,
  data() {
    return {
      whens: [],
      edit: null,
      dates: [],
    };
  },
  props: {
    title: {
      type: String,
      required: true,
    },
    id: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      required: true,
    },
    config: {
      type: Object,
      required: false,
    },
  },
  methods: {
   //updatePositions(projectIndex, items){
   //  console.log('projectIndex', projectIndex)
   //  const cacheItems = [...this.cache];
   //  cacheItems[projectIndex] = {...cacheItems[projectIndex], notes: items};

   //  this.$store.commit("cache/update", {projects: cacheItems});
   //},
    removeItem(note) {
      const project = this.selectedProject;
      const projectIndex = this.cache.indexOf(project);
      const index = project.notes.findIndex((n) => n.id == note.id);

      this.$updateCache(note);
      
      this.$nextTick(() => {
        const project = this.cache[projectIndex];
        let next;
        if (project) {
          next = project.notes[index];
          if (!next) {
            next = project.notes[project.notes.length - 1];
          }
        }
        if (!next) {
          const nextProject = this.getNextProject(projectIndex + 1);
          if (nextProject) {
            next = nextProject.notes[0];
          } else {
            const prevProject = this.getPrevProject(projectIndex - 1);
            if (prevProject) {
              next = prevProject.notes[prevProject.notes.length - 1];
            }
          }
        }
        this.setSelectedItem(next);
      });
    },
    updateSelected(item) {
      if (item.id == this.selectedItem.id) {
        this.setSelectedItem(item);
      }
    },
    getNextProject(project_index) {
      if (this.cache.length == 0) return;
      let nextProject = this.cache[project_index];
      if (!nextProject) {
        return null;
      }
      if (nextProject.notes.length) {
        return nextProject;
      } else {
        return this.getNextProject(project_index + 1);
      }
    },
    getPrevProject(project_index) {
      if (this.cache.length == 0) return;
      let prevProject = this.cache[project_index];
      if (!prevProject) {
        return null;
      }
      if (prevProject.notes.length) {
        return prevProject;
      } else {
        return this.getPrevProject(project_index - 1);
      }
    },
    selectionDown() {
      if (this.selectedItem) {
        const index = this.selectedProject.notes.findIndex(
          (note) => note.id == this.selectedItem.id
        );
        let next = this.selectedProject.notes[index + 1];
        if (next) {
          this.setSelectedItem(next);
        } else {
          const nextProject = this.getNextProject(
            this.cache.indexOf(this.selectedProject) + 1
          );
          if (nextProject) {
            next = nextProject.notes[0];
            this.setSelectedItem(next);
          }
        }
      }
    },
    selectionUp() {
      if (this.selectedItem) {
        const index = this.selectedProject.notes.findIndex(
          (note) => note.id == this.selectedItem.id
        );
        let next = this.selectedProject.notes[index - 1];
        if (next) {
          this.setSelectedItem(next);
        } else {
          const prevProject = this.getPrevProject(
            this.cache.indexOf(this.selectedProject) - 1
          );
          if (prevProject) {
            next = prevProject.notes[prevProject.notes.length - 1];
            this.setSelectedItem(next);
          }
        }
      }
    },
    updateCache() {
      if (this.notes && this.projects) {
        this.$store.commit("cache/update", {
          key: this.id,
          items: [
            {
              notes: this.notes.map((n) => ({
                ...n,
                project: { title: null, id: null },
              })),
            },
            ...this.projects.filter((p) => !!p.notes.length),
          ],
        });
        this.projects = null;
        this.notes = null;
      }
    },
    newNote() {
      return {
        __typename: "active_notes",
        id: uuidv4(),
        title: "",
        content: "",
        done: false,
        deleted: false,
        user_id: this.user.id,
        upcoming_position: null,
        today_position: null,
        someday_position: null,
        anytime_position: null,
        project_id: this.selectedProject?.id,
        [this.positionColumn]: this.maxPosition + 1,
        project: this.selectedProject?.id ? this.selectedProject : null,
        when: null,
      };
    },
  },
  computed: {
    allItems() {
      const allItems = [];
      this.cache.forEach((project) => allItems.push(...project.notes));
      return allItems;
    },
    cache() {
      return this.$store.state.cache[this.id]?.filter(
        (p) => p.notes.length
      );
    },
    selectedProject() {
      const selected = this.selectedItem ? this.selectedItem : this.edit;
      let project;
      if (selected) {
        project = this.cache.find((project) =>
          project.notes.some((note) => note.id == selected.id)
        );
      }
      return project || this.cache[0];
    },
    maxPosition() {
      const positions = this.selectedProject?.notes.map(
        (it) => it[this.positionColumn]
      );
      return positions?.length ? Math.max(...positions) : 0;
    },
  },
};
</script>
<style lang="scss" scoped>
.project-title {
  font-size: 150%;
}
.project-title-seperator {
  margin-top: 10px;
  margin-bottom: 15px;
}
</style>