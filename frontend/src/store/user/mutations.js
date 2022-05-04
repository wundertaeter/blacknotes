
export function initUser(state, data) {
    state.id = data.id;
    state.username = data.username;
    state.admin = data.admin;
    state.active = data.active;
}

export function updateProjects(state, projects) {
    state.projects = projects.map((p) => {
        return { ...p, edit: !p.title };
    });
}

export function updateUser(state, data) {
    if (data.user) {
        state.id = data.user.id;
        state.username = data.user.username;
        state.admin = data.user.admin;
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


