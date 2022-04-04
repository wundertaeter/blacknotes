
export function initUser(state, data) {
    state.id = data.id;
    state.username = data.username;
    state.admin = data.admin;
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
}

export function updateCurrentProject(state, currentProject) {
    currentProject = JSON.stringify(currentProject);
    console.log('string', currentProject);
    localStorage.setItem('currentProject', currentProject);
    state.currentProject = JSON.parse(currentProject);
}



