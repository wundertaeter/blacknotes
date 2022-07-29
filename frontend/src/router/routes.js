const routes = [
  {
    path: "/",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      { path: "", name: "index", component: () => import("pages/Today.vue") },
      { path: ":id", props: true, name: "project", component: () => import("pages/Project.vue") },
      { path: "trash", name: "trash", component: () => import("pages/Trash.vue") },
      { path: "today", name: "today", component: () => import("pages/Today.vue") },
      { path: "upcoming", name: "upcoming", component: () => import("pages/Upcoming.vue") },
      { path: "someday", name: "someday", component: () => import("pages/Someday.vue") },
      { path: "anytime", name: "anytime", component: () => import("pages/Anytime.vue") },
      { path: "logbook", name: "logbook", component: () => import("pages/Logbook.vue") },
      { path: "login", name: "login", meta: { public: true }, component: () => import("pages/Login.vue") },
      { path: "register", name: "register", meta: { public: true }, component: () => import("pages/Register.vue") },
      { path: "profile", name: "profile", component: () => import("pages/Profile.vue") },
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
