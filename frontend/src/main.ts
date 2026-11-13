import { createApp } from "vue";
import { createPinia } from "pinia";
import "./style.css";
import App from "./App.vue";
import { vuetify } from "./plugins/vuetify";
import { router } from "./router";
import { useAuthStore } from "./modules/auth/stores/auth.store";
import { configureInterceptors } from "./services/api/api";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(vuetify);

const auth = useAuthStore(pinia);
configureInterceptors(auth);

auth.restoreSession().finally(() => {
  app.use(router);
  app.mount("#app");
});