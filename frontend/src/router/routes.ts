import type { RouteRecordRaw } from "vue-router";
import { routeProps } from "./RouteProps";

const routes: RouteRecordRaw[] = [
  {
    path: routeProps.index.path,
    redirect: routeProps.index.redirect,
  },

  {
    path: routeProps.login.path,
    component: () => import("@/modules/auth/pages/LoginPage.vue"),
    name: routeProps.login.name,
    meta: {
        title: routeProps.login.title
    }
  },

  {
    path: routeProps.register.path,
    component: () => import("@/modules/user/pages/RegisterPage.vue"),
    name: routeProps.register.name, 
    meta: {
      title: routeProps.register.title
    }
  }

  /* {
    path: routeProps.notFound.path,
    name: routeProps.notFound.name,
    meta: {
        title: routeProps.notFound.title
    }
  } */
];

export {
    routes
}
