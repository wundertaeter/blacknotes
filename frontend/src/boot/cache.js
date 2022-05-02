import { boot } from "quasar/wrappers";
import { Store } from "src/store";
import { formatDate } from "src/common/date";

const projects = ['anytime'];
const timline = ['logbook', 'upcoming'];


export default boot(
    ({ app }) => {

        const add = (key, item) => {
            Store.commit('cache/add', { key, item });
        }

        const remove = (key, item) => {
            Store.commit('cache/remove', { key, item });
        }

        const addProjects = (key, item) => {
            Store.commit('cache/addProjects', { key, item });
        }

        const removeProjects = (key, item) => {
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
                    remove('trash', item);
                } else {
                    add('trash', item);
                }
            }else{
                remove('trash', item);
            }

            if (item.done) {
                if (item.deleted) {
                    remove('logbook', item);
                } else {
                    add('logbook', item);
                }
            }else{
                remove('logbook', item);
            }

            if (item.when) {
                const dateString = formatDate(item.when);
                if (dateString == "Today") {
                    handle('today', item);
                } else if (dateString == "Someday") {
                    handle('someday', item);
                } else {
                    handle('upcoming', item);
                }
            }

            if (item.project?.id) {
                handle(item.project.id, item);
            }

            handle('anytime', item);

        }
    }
);

