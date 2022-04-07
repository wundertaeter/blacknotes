export default function () {
  let currentProject = localStorage.getItem("currentProject");
  if(currentProject){
    currentProject = JSON.parse(currentProject);
  }
  return {
    id: null,
    username: null,
    admin: null,
    projects: [],
    //spaces: [],
    currentProject: currentProject,
    loading: false
  }
}
