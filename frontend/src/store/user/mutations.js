
export function initUser(state, data) {
    state.id = data.id;
    state.username = data.username;
    state.admin = data.admin;
    state.active = data.active;
    state.friends = data.friends;
    state.profile = data.profile;
}

export function updateProjects(state, projects) {
    state.projects = projects.map((p) => {
        return { ...p, edit: !p.title };
    });
}

export function updateProject(state, project) {
    const index = state.projects.findIndex(p => p.id == project.id);
    state.projects[index] = project;
}

export function updateUser(state, data) {
    console.log('updateUser', data)
    if (data.user) {
        state.id = data.user.id;
        state.username = data.user.username;
        state.admin = data.user.admin;
        state.profile = data.user.profile;
    }
    if(data.friends){
        state.friends = data.friends;
    }
    if (data.projects) {
        updateProjects(state, data.projects);
    }
    // if (data.spaces) {
    //     state.spaces = data.spaces;
    // }
}


export function updateLoading(state, loading) {
    state.loading = loading;
}

export function updateAccessToken(state, access) {
    state.access = access;
}
