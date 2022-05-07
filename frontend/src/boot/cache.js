import { boot } from "quasar/wrappers";
import { formatDate } from "src/common/date";

const projects = ['anytime', 'logbook', 'upcoming'];


export default boot(
    ({ app, router, store }) => {

        const add = (key, item) => {
            store.commit('cache/add', { key, item, reverse: key === 'logbook', save: false });
        }

        const remove = (key, item) => {
            store.commit('cache/remove', { key, item, save: false });
        }

        const addProjects = (key, item) => {
            store.commit('cache/addProjects', { key, item, save: false });
        }

        const removeProjects = (key, item) => {
            store.commit('cache/removeProjects', { key, item, save: false });
        }

        const handle = (key, item) => {
            console.log('handle', key);
            if (key === 'current') {
                handle(router.currentRoute.value.name, item);
            } else if (key === 'project') {
                if (item.project?.id) {
                    handle(item.project.id, item);
                }
                if(item.prevProjectId){
                    remove(item.prevProjectId, item);
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
                        removeProjects('logbook', item);
                    } else {
                        addProjects('logbook', item);
                    }
                } else {
                    removeProjects('logbook', item);
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

        app.config.globalProperties.$updateCache = (item, skipCurrent) => {
            if(!skipCurrent) handle('current', item);
            return new Promise((resolve) => {
                setTimeout(() => {
                    const current = router.currentRoute.value.name;

                    console.log('item', item)

                    if(current !== 'trash') handle('trash', item);

                    if(current !== 'logbook') handle('logbook', item);

                    if (item.when) {
                        const dateString = formatDate(item.when);
                        if (dateString == "Today") {
                            if(current !== 'today') handle('today', item);
                        } else if (dateString == "Someday") {
                            if(current !== 'someday') handle('someday', item);
                        } else {
                            if(current !== 'upcoming') handle('upcoming', item);
                        }
                    }

                    if(current !== 'project') handle('project', item);

                    if(current !== 'anytime') handle('anytime', item);

                    resolve()

                    store.commit('cache/save');
                })
            })

        }
    }
);

