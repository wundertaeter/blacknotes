<template>
  <q-page>
    <q-scroll-area class="fill-window" id="scrollArea">
      <div class="q-pa-md container">
        <h4>
          <q-icon :name="icon" />
          {{ title }}
        </h4>
        <div
          v-for="(project, index) in cache"
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
            :project-index="index"
            :update-project="true"
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
import Projects from "src/generics/Projects.js";
export default Projects;
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