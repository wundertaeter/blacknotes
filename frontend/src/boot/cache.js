import { boot } from "quasar/wrappers";
import { Store } from "src/store";
import { formatDate } from "src/common/date";

const projects = ['Anytime'];
const timline = ['Logbook', 'Upcoming'];


export default boot(
    ({ app }) => {

        const addProject = (key, item) => {
            Store.commit('cache/addProject', { key, item });
        }

        const removeProject = (key, item) => {
            Store.commit('cache/removeProject', { key, item });
        }

        const addProjects = (key, item) => {
            Store.commit('cache/addProjects', { key, item });
        }

        const removeProjects = (key, item) => {
            Store.commit('cache/removeProjects', { key, item });
        }

        const addTimeline = (key, item) => {
            Store.commit('cache/addTimeline', { key, item });
        }

        const removeTimeline = (key, item) => {
            Store.commit('cache/removeTimeline', { key, item });
        }

        const handle = (key, item) => {
            if (item.deleted || item.done) {
                console.log('Remove item from ' + key, item);
                if (projects.includes(key)) {
                    removeProjects(key, item);
                }else if (timline.includes(key)){
                    removeTimeline(key, item);
                } else {
                    removeProject(key, item);
                }
            } else {
                console.log('Add item to ' + key, item);
                if (projects.includes(key)) {
                    addProjects(key, item);
                }else if (timline.includes(key)){
                    addTimeline(key, item);
                } else {
                    addProject(key, item);
                }
            }
        }

        app.config.globalProperties.$updateCache = (item) => {
            console.log('item', item)
            if (!item.__typename) throw 'missing typename for item';
            if (item.deleted) {
                if (item.permanentDeleted){
                    removeProject('Trash', item);
                }else{
                    addProject('Trash', item);
                }
            }

            if (item.done) {
                if(item.deleted){
                    removeTimeline('Logbook', item);
                }else{
                    addTimeline('Logbook', item);
                }
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

