import { formatDateForward, formatDateBackwards, timelineDates } from "src/common/date";
import { timeline } from "src/components/Timeline.vue";
function uniqueById(array) {
    if(!Array.isArray(array)) return array;
    var resArr = [];
    array.forEach((item) => {
        var i = resArr.findIndex(it => it.id == item.id);
        if (i <= -1) {
            resArr.push(item);
        }
    });
    return resArr;
}

function save(state) {
    return new Promise(resolve => {
        setTimeout(() => {
            localStorage.setItem('cache', JSON.stringify(state));
            resolve(state);
        })
    })
}

export function update(state, { key, notes, projects, sort, ...attrs }) {
    const rawItems = attrs.items ? attrs.items : [...projects, ...notes];

    state[key] = uniqueById(sort ? rawItems.sort(sort) : rawItems);
    console.log('commit to store', state[key]);
    save(state);
}

export function addProjects(state, { key, item, sort }) {
    const cache = state[key];
    if(cache){
        const items = JSON.parse(JSON.stringify(cache));
        for (const project of items) {
            if(item.project?.id == project.id){
                const index = project.notes.findIndex(it => it.id == item.id);
                if(index >= 0){
                    project.notes[index] = item;
                }else{
                    project.notes.push(item);
                }
                if(sort) project.notes = project.notes.sort(sort);
                state[key] = items;
                return save(state);
            }
        }
    }
}

export function removeProjects(state, { key, item, sort }) {
    const cache = state[key];
    if(cache){
        const items = JSON.parse(JSON.stringify(cache));
        for (const project of items) {
            const index = project.notes.findIndex(note => note.id == item.id);
            if (index >= 0) {
                project.notes.splice(index, 1);
                if(sort) project.notes = project.notes.sort(sort);
                state[key] = items;
                return save(state);
            }
        }
    }
}

export function addTimeline(state, { key, item, sort }) {
    const cache = state[key];
    if(cache){
        const items = JSON.parse(JSON.stringify(cache));
        for (const date in items) {
            if(key == 'Upcoming'){
                if(formatDateForward(item.when, timelineDates(timeline)) == date){
                    const index = items[date].findIndex(it => it.id == item.id);
                    if(index >= 0){
                        items[date][index] = item;
                    }else{
                        items[date].push(item);
                    }
                    if(sort) items[date] = items[date].sort(sort);
                    state[key] = items;
                    return save(state);
                }
            }else if(key == 'Logbook'){
                if(formatDateBackwards(item.when) == date){
                    if(index >= 0){
                        items[date][index] = item;
                    }else{
                        items[date].push(item);
                    }
                    if(sort) items[date] = items[date].sort(sort);
                    state[key] = items;
                    return save(state);
                }
            }
        }
    }
}

export function removeTimeline(state, { key, item, sort }) {
    const cache = state[key];
    if(cache){
        const items = JSON.parse(JSON.stringify(cache));
        for (const date in items) {
            const index = items[date].findIndex(note => note.id == item.id);
            if (index >= 0) {
                items[date].splice(index, 1);
                if(sort) items[date] = items[date].sort(sort);
                state[key] = items;
                return save(state);
            }
        }
    }
}

export function addProject(state, { key, item, sort }) {
    const cache = state[key];
    if (cache) {
        const items = [...cache];
        const index = items.findIndex(it => it.id == item.id);
        console.log('INDEX', index, item);
        if (index >= 0) {
            items[index] = item;
        } else {
            items.push(item)
        }
        state[key] = sort ? items.sort(sort) : items;
        save(state);
    }
}

export function removeProject(state, { key, item, sort }) {
    const cache = state[key];
    if (cache) {
        const items = [...cache];
        items.splice(items.findIndex(it => it.id == item.id), 1);
        state[key] = sort ? items.sort(sort) : items;
        save(state);
    }
}


export function load(state) {
    //return new Promise(resolve => {
    //    setTimeout(() => {
    // const cacheString = localStorage.getItem('cache');
    // if (cacheString) {
    //     const cache = JSON.parse(cacheString);
    //     Object.keys(cache).forEach(key => state[key] = cache[key]);
    // }
    //        resolve(state);
    //    })
    //})
}
