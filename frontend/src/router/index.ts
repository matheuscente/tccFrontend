import { createRouter, createWebHistory } from "vue-router";
import { routes } from "./routes";
import { useAuthStore } from "@/modules/auth/stores/auth.store";
import { routeProps } from "./RouteProps";

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.afterEach((to) => {
    document.title = to.meta.title ?? "My Study"
})


router.beforeEach((to) => {
  const auth = useAuthStore();
  const loggedIn = !!auth.getToken() && !auth.isSessionExpired();

  if (to.meta.requiresAuth && !loggedIn) return { name: routeProps.login.name };
  if (to.name === routeProps.login.name && loggedIn) return { name: "home" };
});

export { router }

