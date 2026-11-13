import { createRouter, createWebHistory } from "vue-router";
import { routes } from "./routes";
import { useAuthStore } from "@/modules/auth/stores/auth.store";
import { routeProps } from "./RouteProps";

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  const loggedIn = !!auth.getToken() && !auth.isSessionExpired();

  if (to.matched.some((record) => record.meta.requiresAuth) && !loggedIn) {
    return { name: routeProps.login.name, query: to.fullPath !== routeProps.home.path ? { redirect: to.fullPath } : {} };
  }

  if (to.meta.guestOnly && loggedIn) return { name: routeProps.home.name };

  if (to.meta.requiresAdmin && !auth.isAdmin) return { name: routeProps.home.name };
});

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · My Study` : "My Study";
});

export { router };
