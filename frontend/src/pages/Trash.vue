<template>
  <q-page>
    <q-scroll-area class="fill-window">
      <div class="q-pa-md container">
        <h4>
          <q-icon name="delete" />
          Trash
        </h4>

        <note
          v-for="(note, index) in notesCopy"
          :key="note.id"
          class="note"
          v-model="notesCopy[index]"
          readonly
          @undone="uncheckNote(note)"
        />
      </div>
    </q-scroll-area>
<q-footer class="fixed-bottom footer">
      <q-toolbar>
        <div class="row justify-center" style="width: 100%">
          <div class="col-12 text-center self-center">
            <q-btn
              icon="delete"
              flat
   
            />
          </div>
        </div>
      </q-toolbar>
    </q-footer>
  </q-page>
</template>

<script>
import { defineComponent } from "vue";
import Note from "src/components/Note.vue";
const GET_TRASH_NOTES = require("src/gql/queries/GetTrashNotes.gql");
const SUBSCRIBE_TRASH_NOTES = require("src/gql/subscriptions/SubscribeTrashNotes.gql");

export default defineComponent({
  name: "PageIndex",
  components: {
    Note,
  },
  data() {
    return {
      notesCopy: null,
    };
  },
  watch: {
    notes: {
      handler(notes) {
        this.notesCopy = JSON.parse(JSON.stringify(notes));
      },
      deep: true,
    },
  },
  methods: {},
  computed: {
    user() {
      return this.$store.state.user;
    },
  },
  apollo: {
    notes: {
      query: GET_TRASH_NOTES,
      variables() {
        return {
          user_id: this.user.id,
        };
      },
      skip() {
        return !this.user.id;
      },
      subscribeToMore: {
        document: SUBSCRIBE_TRASH_NOTES,
        variables() {
          return {
            user_id: this.user.id,
          };
        },
        skip() {
          return !this.user.id;
        },
        updateQuery: (previousResult, { subscriptionData }) => {
          if (subscriptionData.data) {
            return { notes: subscriptionData.data.notes };
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
