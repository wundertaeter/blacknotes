
export function initUser(state, data) {
    state.id = data.id;
    state.username = data.username;
    state.admin = data.admin;
    state.active = data.active;
}

export function updateUser(state, data) {
    if (data.user) {
        state.id = data.user.id;
        state.username = data.user.username;
        state.admin = data.user.admin;
    }
    // if (data.projects) {
    //     state.projects = data.projects;
    // }
    // if (data.spaces) {
    //     state.spaces = data.spaces;
    // }
}

export function updateProjects(state, projects) {
    state.projects = projects;
    const id = localStorage.getItem("currentProjectId");
    state.currentProject = projects.find(p => p.id == id);
}

export function updateCurrentProject(state, currentProject) {
    localStorage.setItem('currentProjectId', currentProject.id);
    state.currentProject = state.projects.find(p => p.id == currentProject.id);
}

export function updateLoading(state, loading) {
    state.loading = loading;
}


