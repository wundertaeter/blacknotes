import { boot } from "quasar/wrappers";
import { Store } from "src/store";
import { formatDate } from "src/common/date";

const projects = ['Anytime'];
const timline = ['Logbook', 'Upcoming'];


export default boot(
    ({ app }) => {

        const add = (key, item) => {
            console.log('Add item to ' + key, item);
            Store.commit('cache/add', { key, item });
        }

        const remove = (key, item) => {
            console.log('Remove item from ' + key, item);
            Store.commit('cache/remove', { key, item });
        }

        const addProjects = (key, item) => {
            console.log('Add item to ' + key, item);
            Store.commit('cache/addProjects', { key, item });
        }

        const removeProjects = (key, item) => {
            console.log('Remove item from ' + key, item);
            Store.commit('cache/removeProjects', { key, item });
        }

        const handle = (key, item) => {
            if (projects.includes(key)) {
                if (item.deleted || item.done) {
                    removeProjects(key, item);
                } else {
                    addProjects(key, item);
                }
            } else {
                if (item.deleted || item.done) {
                    remove(key, item);
                } else {
                    add(key, item);
                }
            }

        }

        app.config.globalProperties.$updateCache = (item) => {
            console.log('item', item)
            item = { ...item };
            if (!item.__typename) throw 'missing typename for item';
            if (item.deleted) {
                if (item.permanentDeleted) {
                    remove('Trash', item);
                } else {
                    add('Trash', item);
                }
            }else{
                remove('Trash', item);
            }

            if (item.done) {
                if (item.deleted) {
                    remove('Logbook', item);
                } else {
                    add('Logbook', item);
                }
            }else{
                remove('Logbook', item);
            }

            if (item.when) {
                const dateString = formatDate(item.when);
                if (dateString == "Today") {
                    handle('Today', item);
                } else if (dateString == "Someday") {
                    handle('Someday', item);
                } else {
                    handle('Upcoming', item);
                }
            }

            if (item.project?.title) {
                handle(item.project.title, item);
            }

            handle('Anytime', item);

        }
    }
);

