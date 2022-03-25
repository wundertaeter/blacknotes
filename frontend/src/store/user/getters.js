
export function getCurrentProject(state) {
  if (state.currentProject) {
    return state.currentProject;
  }
  return null;
}

