import { route } from "quasar/wrappers";
import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory,
} from "vue-router";
import routes from "./routes";
import { Store } from 'src/store';
import axios from 'axios';

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default route(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === "history"
      ? createWebHistory
      : createWebHashHistory;

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(
      process.env.MODE === "ssr" ? void 0 : process.env.VUE_ROUTER_BASE
    ),
  });

  Router.beforeEach(async (to, from, next) => {
    let user = Store.state.user;
    console.log('user!!', user);
    if (!user.id && user.access) {
      const resp = await axios.get(process.env.DJANGO_URL + "/user/me/", {
        headers: {
          "content-type": "application/json",
          "Authorization": `Bearer ${user.access}`
        },
      })
      console.log('RESP', resp);
      Store.commit("user/initUser", resp.data);
    }
    if (!user.id && !to.matched.some(record => record.meta.public)) {
      next('/login');
    } else {
      next();
    }
  });

  return Router;
});
