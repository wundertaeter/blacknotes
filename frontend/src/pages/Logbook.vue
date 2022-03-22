<template>
  <q-page>
    <q-scroll-area class="fill-window">
      <div class="q-pa-md container">
        <h4>
          <q-icon name="star" />
          Logbook
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
        <q-toolbar-title></q-toolbar-title>
      </q-toolbar>
    </q-footer>
  </q-page>
</template>

<script>
import { defineComponent } from "vue";
import Note from "src/components/Note.vue";
const CHECK_NOTE = require("src/gql/mutations/CheckNote.gql");
const GET_LOGBOOK_NOTES = require("src/gql/queries/GetLogbookNotes.gql");
const SUBSCRIBE_LOGBOOK_NOTES = require("src/gql/subscriptions/SubscribeLogbookNotes.gql");

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
  methods: {
    uncheckNote(note) {
      console.log("delete note", note);
      note.deleted = true;
      this.$apollo.mutate({
        mutation: CHECK_NOTE,
        variables: {
          id: note.id,
          done: false,
        },
        //update: this.removeToCache,
      });
    },
  },
  computed: {
    user() {
      return this.$store.state.user;
    },
  },
  apollo: {
    notes: {
      query: GET_LOGBOOK_NOTES,
      variables() {
        return {
          user_id: this.user.id,
        };
      },
      skip() {
        return !this.user.id;
      },
      subscribeToMore: {
        document: SUBSCRIBE_LOGBOOK_NOTES,
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
