const routes = [
  {
    path: "/",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      { path: "", name: "project", component: () => import("pages/Project.vue") },
      { path: "trash", name: "trash", component: () => import("pages/Trash.vue") },
      { path: "logbook", name: "logbook", component: () => import("pages/Logbook.vue") },
      { path: "login", component: () => import("pages/Login.vue") }
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: "/:catchAll(.*)*",
    component: () => import("pages/Error404.vue"),
  },
];

export default routes;
