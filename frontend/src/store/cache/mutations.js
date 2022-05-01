
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
    const cache = state[key];
    if (cache) {
        const items = JSON.parse(JSON.stringify(cache));
        for (const project of items.projects) {
            if (item.project && item.project.id == project.id) {
                const index = project.notes.findIndex(it => it.id == item.id);
                if (index >= 0) {
                    project.notes[index] = item;
                } else {
                    project.notes.push(item);
                }
                state[key] = items;
                
            }else if(item.prevProject && item.prevProject.id == project.id){
                const index = project.notes.findIndex(it => it.id == item.id);
                if (index >= 0) {
                    project.notes.splice(index, 1);
                    state[key] = items;
                }
            }
        }
        save(state);
    }
}

export function removeProjects(state, { key, item }) {
    const cache = state[key];
    if (cache) {
        const items = JSON.parse(JSON.stringify(cache));
        for (const project of items.projects) {
            const index = project.notes.findIndex(it => it.id == item.id);
            if (index >= 0) {
                project.notes.splice(index, 1);
                state[key] = items;
            }
        }
        save(state);
    }
}

export function add(state, { key, item }) {
    console.log('ADD TO CACHE', key, item);
    const cache = state[key];
    if (cache) {
        const items = JSON.parse(JSON.stringify(cache));
        const type = item.__typename.includes('_note') ? 'notes' : 'projects';
        const index = items[type].findIndex(it => it.id == item.id);
        console.log('INDEX', index, item);
        if (index >= 0) {
            items[type][index] = item;
        } else {
            items[type].push(item)
        }
        state[key] = items;
        save(state);
    }
}

export function remove(state, { key, item }) {
    console.log('REMOVE TO CACHE', key, item);
    const cache = state[key];
    if (cache) {
        const items = JSON.parse(JSON.stringify(cache));
        const type = item.__typename.includes('_note') ? 'notes' : 'projects';
        const index = items[type].findIndex(it => it.id == item.id);
        console.log('REMOVE', type, index);
        if (index >= 0) {
            items[type].splice(index, 1);
        }
        state[key] = items;
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
