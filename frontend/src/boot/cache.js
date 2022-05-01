import { boot } from "quasar/wrappers";
import { Store } from "src/store";
import { formatDate } from "src/common/date";

const projects = ['Anytime'];
const timline = ['Logbook', 'Upcoming'];


export default boot(
    ({ app }) => {

        const addProject = (key, item, sort) => {
            Store.commit('cache/addProject', { key, item, sort });
        }

        const removeProject = (key, item, sort) => {
            Store.commit('cache/removeProject', { key, item, sort });
        }

        const addProjects = (key, item, sort) => {
            Store.commit('cache/addProjects', { key, item, sort });
        }

        const removeProjects = (key, item, sort) => {
            Store.commit('cache/removeProjects', { key, item, sort });
        }

        const addTimeline = (key, item, sort) => {
            Store.commit('cache/addTimeline', { key, item, sort });
        }

        const removeTimeline = (key, item, sort) => {
            Store.commit('cache/removeTimeline', { key, item, sort });
        }

        const handle = (key, item, sort) => {
            if (item.deleted || item.done) {
                console.log('Remove item from ' + key, item);
                if (projects.includes(key)) {
                    removeProjects(key, item, sort);
                }else if (timline.includes(key)){
                    removeTimeline(key, item, sort);
                } else {
                    removeProject(key, item, sort);
                }
            } else {
                console.log('Add item to ' + key, item);
                if (projects.includes(key)) {
                    addProjects(key, item, sort);
                }else if (timline.includes(key)){
                    addTimeline(key, item, sort);
                } else {
                    addProject(key, item, sort);
                }
            }
        }

        app.config.globalProperties.$updateCache = (item, sort) => {
            console.log('item', item)
            if (!item.__typename) throw 'missing typename for item';
            if (item.deleted) {
                if (item.permanentDeleted){
                    removeProject('Trash', item, sort);
                }else{
                    addProject('Trash', item, sort);
                }
            }

            if (item.done) {
                if(item.deleted){
                    removeTimeline('Logbook', item, sort);
                }else{
                    addTimeline('Logbook', item, sort);
                }
            }

            if(item.prevWhen){
                item.prevWhen = undefined;
                timline.forEach(title => removeTimeline(title, item, sort));
            }

            if (item.when) {
                const dateString = formatDate(item.when);
                if (dateString == "Today") {
                    handle('Today', item, sort);
                } else if (dateString == "Someday") {
                    handle('Someday', item, sort);
                } else {
                    handle('Upcoming', item, sort);
                }
            }

            if (item.project?.title) {
                handle(item.project.title, item, sort);
            }

            if(item.prevProject){
                const title = item.prevProject.title;
                item.prevProject = undefined;
                removeProjects('Anytime', item, sort);
                removeProject(title, item, sort);
            }

           
            handle('Anytime', item, sort);
        }
    }
);

