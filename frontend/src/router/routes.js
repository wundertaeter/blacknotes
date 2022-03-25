const routes = [
  {
    path: "/",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      { path: "", name: "project", component: () => import("pages/Project.vue") },
      { path: "trash", name: "trash", component: () => import("pages/Trash.vue") },
      { path: "today", name: "today", component: () => import("pages/Today.vue") },
      { path: "someday", name: "someday", component: () => import("pages/Someday.vue") },
      { path: "anytime", name: "anytime", component: () => import("pages/Anytime.vue") },
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
