
export function getCurrentProject(state) {
  if (state.currentProject) {
    return state.currentProject;
  } else if (state.defaultProjects) {
    return state.defaultProjects.find((p) => p.name == "Today");
  }
  return null;
}

