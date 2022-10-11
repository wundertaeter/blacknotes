<template>
  <div>
    <q-page>
      <q-scroll-area class="fill-window">
        <div v-if="project" class="q-pa-md container">
          <h4>
            <div class="row">
              <div class="col-10">
                <div class="row">
                  <q-icon
                    v-if="project.default"
                    :name="project.icon"
                    :input-style="{ fontSize: '24px' }"
                  />
                  <q-checkbox
                    v-else
                    v-model="project.done"
                    size="lg"
                    color="orange"
                    checked-icon="radio_button_checked"
                    :unchecked-icon="project.icon"
                    indeterminate-icon="help"
                    @update:modelValue="checkProject"
                  />
                  <span v-if="project.default" class="project-title">
                    {{ project.title }}
                  </span>
                  <q-input
                    v-else
                    class="project-title"
                    style="margin-top: 5px"
                    @update:modelValue="
                      (value) => updateProjectName(project, value)
                    "
                    @blur="commitProjectName(project)"
                    @keydown.enter="commitProjectName(project)"
                    :key="project.id"
                    :autofocus="!isMobile && !project.title"
                    borderless
                    dense
                    v-model="project.title"
                    placeholder="New Project"
                  />
                </div>
              </div>
              <div class="col-2">
                <q-btn
                  icon="more_vert"
                  class="float-right"
                  style="top: 6px"
                  flat
                  v-if="more"
                  @click.stop
                >
                  <q-menu v-model="moreShowing">
                    <q-list style="min-width: 100px">
                      <q-item clickable v-close-popup @click="trashProject">
                        <q-item-section avatar>
                          <q-icon name="delete" />
                        </q-item-section>

                        <q-item-section>
                          <q-item-label> Delete </q-item-label>
                        </q-item-section>
                      </q-item>
                      <q-item
                        clickable
                        v-close-popup
                        @click="
                          project.done = true;
                          checkProject();
                        "
                      >
                        <q-item-section avatar>
                          <q-icon name="done" />
                        </q-item-section>

                        <q-item-section>
                          <q-item-label> Check </q-item-label>
                        </q-item-section>
                      </q-item>
                      <q-separator />
                      <q-item
                        clickable
                        v-close-popup
                        @click.stop="shareDialog = true"
                      >
                        <q-item-section avatar>
                          <q-icon name="share" />
                        </q-item-section>

                        <q-item-section>
                          <q-item-label> Share </q-item-label>
                        </q-item-section>
                      </q-item>
                    </q-list>
                  </q-menu>
                </q-btn>
              </div>
            </div>
          </h4>

          <list
            v-if="cache"
            @select="setSelectedItems"
            @edit="setEdit"
            :cache-key="modelValue.id"
            :position-column="positionColumn"
            :sort="sort"
            :items="cache"
            :allItems="cache"
            :selected="selectedItems"
            :edited="edit"
            @mounted="listComponentMounted"
            @check="check"
          />
        </div>
      </q-scroll-area>

      <q-dialog v-model="shareDialog">
        <q-card style="min-width: 50vw">
          <q-card-section>
            <div class="text-h6">Share</div>
          </q-card-section>

          <q-card-section class="q-pt-none">
            <div>
              <q-list bordered separator v-if="shares.length">
                <q-item
                  xxclickable
                  xxv-ripple
                  v-for="friend in shares"
                  :key="friend.id"
                >
                  <q-item-section>{{ friend.user.username }}</q-item-section>
                  <q-item-section side>
                    <q-toggle
                      flat
                      v-model="friend.isConnected"
                      color="orange"
                    />
                  </q-item-section>
                </q-item>
              </q-list>
              <div v-else>You do not have any friends... Go find some!</div>
            </div>
          </q-card-section>

          <q-card-actions v-if="shares.length" align="right">
            <q-btn
              v-if="shares.length"
              flat
              label="Share"
              @click.stop="shareProject"
              v-close-popup
            />
          </q-card-actions>

          <q-card-actions v-else>
            <div class="row" style="width: 100%">
              <q-btn flat label="Cancle" v-close-popup />
              <q-space />
              <q-btn
                flat
                label="Find Some"
                v-close-popup
                @click.stop="$router.push('profile')"
              />
            </div>
          </q-card-actions>
        </q-card>
      </q-dialog>
    </q-page>
    <q-footer class="fixed-bottom footer">
      <q-toolbar>
        <slot
          name="toolbar"
          v-bind="{ addNote, revert, trash, selectedItems, edit }"
        />
      </q-toolbar>
    </q-footer>
  </div>
</template>

<script>
const CHECK_PROJECT = require("src/gql/mutations/CheckProject.gql");
const TRASH_PROJECT = require("src/gql/mutations/TrashProject.gql");
const SHARE_PROJECT = require("src/gql/mutations/ShareProject.gql");
const UNSHARE_PROJECT = require("src/gql/mutations/UnshareProject.gql");
const UPDATE_PROJECT_NAME_BY_PK = require("src/gql/mutations/UpdateProjectNameByPk.gql");
import { toDatabaseString, today } from "src/common/date.js";
import { uuidv4 } from "src/common/utils.js";
import Base from "src/generics/Base.js";

export default {
  name: "ProjectComponent",
  extends: Base,
  data() {
    console.log("config", this.config);
    return {
      project: JSON.parse(JSON.stringify(this.modelValue)),
      timeout: null,
      moreShowing: false,
      shareDialog: null,
      shares: [],
      projectTitleTimeout: null,
    };
  },
  mounted() {
    this.buildShares();
    console.log("PROPJECT mounted", this.config);
  },
  props: {
    modelValue: {
      type: Object,
      required: true,
    },
    sortBy: {
      type: Object,
      required: false,
      default(props) {
        return {
          column: props.positionColumn,
          date: false,
        };
      },
    },
    more: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  watch: {
    modelValue: {
      handler(value) {
        this.project = JSON.parse(JSON.stringify(value));
      },
      deep: true,
    },
    "user.friends": {
      handler() {
        this.buildShares();
      },
      deep: true,
    },
    "project.friends": {
      handler() {
        this.buildShares();
      },
      deep: true,
    },
  },
  computed: {
    maxPosition() {
      const positions = this.cache.map((note) => note[this.positionColumn]);
      console.log("positions", this.cache, positions, this.positionColumn);
      return positions.length ? Math.max(...positions) : 0;
    },
    cache() {
      return this.$store.state.cache[this.modelValue.id] || [];
    },
    isMobile() {
      return this.$q.platform.is.mobile;
    },
  },
  methods: {
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
      }).then(() => (project.edit = false));
    },
    buildShares() {
      if (this.user?.friends && this.project?.friends) {
        this.shares = this.user.friends.map((friend) => ({
          ...friend,
          isConnected: this.project.friends.some(
            (f) => f.user.id === friend.user.id
          ),
        }));
      }
    },
    newNote() {
      return {
        __typename: "notes_note",
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
        [this.positionColumn]: this.maxPosition + 1,
        project_id: this.project.default ? null : this.project.id,
        project: this.project.default ? null : this.project,
        when: this.when ? toDatabaseString(this.when) : null,
      };
    },
    shareProject() {
      const addFriends = [];
      const removeFriendIds = [];
      this.shares.forEach((friend) =>
        friend.isConnected
          ? addFriends.push({
              project_id: this.project.id,
              user_id: friend.user.id,
            })
          : removeFriendIds.push(friend.user.id)
      );
      if (addFriends.length) {
        this.$mutateQueue({
          mutation: SHARE_PROJECT,
          variables: { objects: addFriends },
        });
      }
      if (removeFriendIds.length) {
        this.$mutateQueue({
          mutation: UNSHARE_PROJECT,
          variables: {
            project_id: this.project.id,
            friend_ids: removeFriendIds,
          },
        });
      }
    },
    removeItem(item, commit) {
      let next;
      const index = this.cache.findIndex(
        (it) => it.id == item.id && it.__typename == item.__typename
      );

      this.$updateCache(item, commit);

      this.$nextTick(() => {
        // console.log(this.cache);
        next = this.cache[index];
        if (!next) {
          const length = this.cache.length;
          next = this.cache[length - 1];
        }
        this.setSelectedItem(next);
      });
    },
    selectionDown() {
      const index = this.cache.findIndex(
        (it) =>
          it.id == this.selectedItem.id &&
          it.__typename == this.selectedItem.__typename
      );
      const next = this.cache[index + 1];
      if (next) this.setSelectedItem(next);
    },
    selectionUp() {
      const index = this.cache.findIndex(
        (it) =>
          it.id == this.selectedItem.id &&
          it.__typename == this.selectedItem.__typename
      );
      const next = this.cache[index - 1];
      if (next) this.setSelectedItem(next);
    },
    sortMethod(a, b) {
      if (a[this.sortBy.column] === null) return 1;
      if (b[this.sortBy.column] === null) return -1;
      if (this.sortBy.date) {
        return this.sortBy.desc
          ? new Date(b[this.sortBy.column]) - new Date(a[this.sortBy.column])
          : new Date(a[this.sortBy.column]) - new Date(b[this.sortBy.column]);
      } else {
        return this.sortBy.desc
          ? b[this.sortBy.column] - a[this.sortBy.column]
          : a[this.sortBy.column] - b[this.sortBy.column];
      }
    },
    trashProject() {
      const project = {
        ...this.project,
        deleted_at: new Date(),
        deleted: true,
      };
      this.$mutateQueue({
        mutation: TRASH_PROJECT,
        variables: project,
      }).then(() => this.nextProject());
      this.$updateCache(project);
    },
    nextProject() {
      const projects = [
        ...this.user.projects.filter((p) => !p.done && !p.deleted),
      ];
      const index = projects.findIndex((p) => p.id == this.project.id);
      projects.splice(index, 1);
      let next = projects[index];
      if (!next) {
        next = projects[projects.length - 1] || null;
      }
      this.$store.commit("user/updateProjects", projects);
      console.log("next project", projects, next);
      if (next) {
        this.$router.push({ name: "project", params: { id: next.id } });
      } else {
        this.project = null;
        this.$router.push({ name: "today" });
      }
    },
    checkProject() {
      this.$loading(true);
      if (this.timeout) clearTimeout(this.timeout);
      this.timeout = setTimeout(() => {
        console.log("project.done", this.project.done);

        this.project.completed_at = this.project.done ? new Date() : null;
        this.$mutateQueue({
          mutation: CHECK_PROJECT,
          variables: this.project,
        });

        this.$updateCache(this.project);

        if (this.project.done) {
          this.nextProject();
        } else {
          this.$router.push({
            name: "project",
            params: { id: this.project.id },
          });
        }
      }, 500);
    },
    updateCache() {
      if (!this.project.default || (this.notes && this.projects)) {
        console.log("update cache", this.notes, this.projects);
        this.$store.commit("cache/update", {
          key: this.modelValue.id,
          items: [...(this.notes || []), ...(this.projects || [])].sort(
            this.sortMethod
          ),
        });
        this.projects = null;
        this.notes = null;
      }
    },
  },
};
</script>
<style>
.project-title {
  font-size: 24px;
  width: 90%;
}
@media screen and (max-width: 1023px) {
  .project-title {
    width: 50%;
  }
}
</style>
