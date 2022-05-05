import { Store } from "../index";

function save(state) {
    return new Promise(resolve => {
        setTimeout(() => {
            localStorage.setItem('cache', JSON.stringify(state));
            resolve(state);
        })
    })
}

export function update(state, { key, notes, projects }) {
    state[key] = { notes: notes || [], projects: projects || [] };
    console.log('commit to store', state[key]);
    save(state);
}

export function addProjects(state, { key, item }) {
    console.log('Add item to ' + key, item);
    const cache = state[key];
    if (cache) {
        let added = false;
        const items = JSON.parse(JSON.stringify(cache));
        for (const project of items.projects) {
            const index = project.notes.findIndex(it => it.id == item.id);
            if (item.project?.id == project.id) {
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
            const project = { ...Store.state.user.projects.find(project => item.project.id == project.id) };
            project.notes = [item];
            items.projects.push(project);
        }
        state[key] = items;
        save(state);
    }
}

export function removeProjects(state, { key, item }) {
    console.log('Remove item from ' + key, item);
    const cache = state[key];
    if (cache) {
        const items = JSON.parse(JSON.stringify(cache));
        for (const project of items.projects) {
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
        const type = item.__typename.includes('_note') ? 'notes' : 'projects';
        const index = items[type].findIndex(it => it.id == item.id);
        // console.log('INDEX', index, item);
        if (index >= 0) {
            items[type][index] = item;
        } else if (reverse) {
            items[type] = [item, ...items[type]];
        } else {
            items[type].push(item)
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
        const type = item.__typename.includes('_note') ? 'notes' : 'projects';
        const index = items[type].findIndex(it => it.id == item.id);
        // console.log('REMOVE', type, index);
        if (index >= 0) {
            items[type].splice(index, 1);
        }
        state[key] = items;
        save(state);
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
