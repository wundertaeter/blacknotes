
export function getCurrentProject(state) {
  console.log('get current project', state.currentProject);
  console.log('get current project', state.currentProject);
  if (state.currentProject) {
    return state.currentProject;
  } else if (state.defaultProjects) {
    return state.defaultProjects.find((p) => p.name == "Today");
  }
  return null;
}

