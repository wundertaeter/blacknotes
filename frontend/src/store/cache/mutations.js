import { Store } from "../index";

export function save(state) {
    return new Promise(resolve => {
        setTimeout(() => {
            console.log('save state', state);
            localStorage.setItem('cache', JSON.stringify(state));
            resolve(state);
        })
    })
}

export function update(state, { key, items }) {
    state[key] = items;
    delete state[key].new;
    console.log('commit to store', state[key]);
    save(state);
}

// CACHE sollte ein object sein {project_id: {notes: [], title: '', id: ''}}

export function updateOnIndex(state, { key, index, items }) {
    console.log('key', key, 'index', index, 'items', items);
    state[key][index].notes = items;
    delete state[key].new;
    save(state);
}

export function addProjects(state, { key, item }) {
    console.log('Add item to projects' + key, item);
    const cache = state[key];
    if (cache) {
        let added = false;
        const items = JSON.parse(JSON.stringify(cache));
        // console.log('items', items);
        for (const project of items) {
            // console.log('project', project);
            const index = project.notes.findIndex(it => it.id == item.id);
            // console.log('index', index);
            if (project.id && item.project?.id == project.id ||
                project._when && item.when == project._when ||
                project._completed_at && item.completed_at == project._completed_at
            ) { // Dont select when in project subscription !!!
                if (index >= 0) {
                    project.notes[index] = item;
                } else {
                    project.notes.push(item);
                }
                added = true;
            } else if (index >= 0) {
                project.notes.splice(index, 1);
            }
        }
        if (!added) {
            // items['new'] = item;
        }
        state[key] = items;
    }
}

export function removeProjects(state, { key, item }) {
    console.log('Remove item from projects' + key, item);
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
    }
}

export function add(state, { key, item, reverse }) {
    console.log('Add item to ' + key, item);
    const cache = state[key];
    if (cache) {
        let items = JSON.parse(JSON.stringify(cache));
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
    }
}


export function load(state) {
    const cacheString = localStorage.getItem('cache');
    if (cacheString) {
        const cache = JSON.parse(cacheString);
        for (const key in cache) {
            state[key] = cache[key];
        }
    }
}
