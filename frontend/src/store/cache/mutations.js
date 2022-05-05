import { Store } from "../index";

function save(state) {
    return new Promise(resolve => {
        setTimeout(() => {
            localStorage.setItem('cache', JSON.stringify(state));
            resolve(state);
        })
    })
}

export function update(state, { key, items }) {
    state[key] = items;
    console.log('commit to store', state[key]);
    save(state);
}

// export function updatePositions(state, {key, project, when}){
//     const cache = state[key];
//     cache.notes
// }

export function addProjects(state, { key, item }) {
    console.log('Add item to ' + key, item);
    const cache = state[key];
    if (cache) {
        // let added = false;
        const items = JSON.parse(JSON.stringify(cache));
        console.log('items', items);
        for (const project of items) {
            console.log('project', project);
            const index = project.notes.findIndex(it => it.id == item.id);
            console.log('index', index);
            if (item.project?.id == project.id || item.when == project.when) { // Dont select when in project subscription !!!
                if (index >= 0) {
                    project.notes[index] = item;
                } else {
                    project.notes.push(item);
                }
                // added = true;
            } else if (index >= 0) {
                project.notes.splice(index, 1);
            }
        }
        // if (!added) {
        //     const project = { ...Store.state.user.projects.find(project => item.project.id == project.id) };
        //     project.notes = [item];
        //     items.push(project);
        // }
        state[key] = items;
        save(state);
    }
}

export function removeProjects(state, { key, item }) {
    console.log('Remove item from ' + key, item);
    const cache = state[key];
    if (cache) {
        const items = JSON.parse(JSON.stringify(cache));
        for (const project of items) {
            const index = project.notes.findIndex(it => it.id == item.id);
            if (index >= 0) {
                project.notes.splice(index, 1);
            }
        }
        state[key] = items;
        save(state);
    }
}

export function add(state, { key, item, reverse }) {
    console.log('Add item to ' + key, item);
    const cache = state[key];
    if (cache) {
        const items = JSON.parse(JSON.stringify(cache));
        const index = items.findIndex(it => it.id == item.id);
        // console.log('INDEX', index, item);
        if (index >= 0) {
            items[index] = item;
        } else if (reverse) {
            items = [item, ...items];
        } else {
            items.push(item)
        }
        state[key] = items;
        save(state);
    }
}

export function remove(state, { key, item }) {
    console.log('Remove item from ' + key, item);
    const cache = state[key];
    if (cache) {
        const items = JSON.parse(JSON.stringify(cache));
        const index = items.findIndex(it => it.id == item.id);
        // console.log('REMOVE', type, index);
        if (index >= 0) {
            items.splice(index, 1);
        }
        state[key] = items;
        save(state);
    }
}


export function load(state) {
    // const cacheString = localStorage.getItem('cache');
    // if (cacheString) {
    //     const cache = JSON.parse(cacheString);
    //     for (const key in cache) {
    //         state[key] = cache[key];
    //     }
    // }
}
