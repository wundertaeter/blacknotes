import { boot } from "quasar/wrappers";
import { formatDate } from "src/common/date";

const projects = ['anytime'];
const timline = ['logbook', 'upcoming'];


export default boot(
    ({ app, router, store }) => {

        const add = (key, item) => {
            store.commit('cache/add', { key, item, reverse: key === 'logbook' });
        }

        const remove = (key, item) => {
            store.commit('cache/remove', { key, item });
        }

        const addProjects = (key, item) => {
            store.commit('cache/addProjects', { key, item });
        }

        const removeProjects = (key, item) => {
            store.commit('cache/removeProjects', { key, item });
        }

        const handle = (key, item) => {
            const current = router.currentRoute.value.name;
            if (key === 'current') {
                handle(current, item);
            } else if (key === 'project') {
                if (item.project?.id) {
                    handle(item.project.id, item);
                }
            } else if (key === 'trash') {
                if (item.deleted) {
                    if (item.permanentDeleted) {
                        remove('trash', item);
                    } else {
                        add('trash', item);
                    }
                } else {
                    remove('trash', item);
                }
            } else if (key === 'logbook') {
                if (item.done) {
                    if (item.deleted) {
                        remove('logbook', item);
                    } else {
                        add('logbook', item);
                    }
                } else {
                    remove('logbook', item);
                }
            } else if (projects.includes(key)) {
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
            handle('current', item);
            return new Promise((resolve) => {
                setTimeout(() => {
                    console.log('item', item)

                    handle('trash', item);

                    handle('logbook', item);

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

                    handle('project', item);

                    handle('anytime', item);

                    resolve()
                })
            })

        }
    }
);

