<template>
  <v-navigation-drawer v-if="!focus" v-model="drawer" :rail="rail && !mobile" :permanent="!mobile" :temporary="mobile" width="264">
    <div class="d-flex align-center px-4 py-4 ga-3">
      <v-avatar color="primary" size="36" rounded="lg">
        <v-icon icon="mdi-book-education-outline" color="on-primary" />
      </v-avatar>
      <div v-if="!rail || mobile" class="text-title-medium font-weight-bold">My Study</div>
    </div>

    <v-divider />

    <v-list nav density="comfortable" color="primary">
      <template v-for="group in menu" :key="group.title">
        <v-list-subheader v-if="!rail || mobile">{{ group.title }}</v-list-subheader>
        <v-list-item
          v-for="item in group.items"
          :key="item.key"
          :to="item.to"
          :prepend-icon="item.icon"
          :title="item.title"
          :exact="item.exact ?? false"
          :class="{ 'ml-3': item.nested && (!rail || mobile) }"
          rounded="lg"
        />
      </template>
    </v-list>
  </v-navigation-drawer>

  <v-app-bar v-if="!focus" flat border="b" density="comfortable">
    <v-progress-linear :active="navigating" indeterminate color="primary" absolute location="bottom" height="2" />
    <v-app-bar-nav-icon aria-label="Alternar menu lateral" @click="toggleDrawer" />

    <v-app-bar-title class="text-title-medium">{{ route.meta.title }}</v-app-bar-title>

    <v-chip
      v-if="timer.active"
      class="mr-2"
      color="success"
      variant="flat"
      prepend-icon="mdi-timer-outline"
      :to="{ name: routeProps.study.name }"
    >
      {{ formatDuration(timer.elapsedSeconds) }}
    </v-chip>

    <v-btn :icon="isDark ? 'mdi-weather-sunny' : 'mdi-weather-night'" variant="text" :aria-label="isDark ? 'Tema claro' : 'Tema escuro'" @click="toggleTheme" />

    <v-menu location="bottom end">
      <template #activator="{ props: menuProps }">
        <v-btn v-bind="menuProps" variant="text" class="text-none mr-2" aria-label="Menu do usuário">
          <v-avatar color="primary" variant="tonal" size="32" class="mr-sm-2">
            <span class="text-label-large">{{ initials }}</span>
          </v-avatar>
          <span class="d-none d-sm-inline">{{ firstName }}</span>
        </v-btn>
      </template>
      <v-list min-width="220">
        <v-list-item :title="auth.user?.name" :subtitle="auth.user?.email" />
        <v-divider />
        <v-list-item prepend-icon="mdi-account-circle-outline" title="Meu perfil" :to="{ name: routeProps.profile.name }" />
        <v-list-item prepend-icon="mdi-lifebuoy" title="Suporte" :to="{ name: routeProps.tickets.name }" />
        <v-list-item prepend-icon="mdi-logout" title="Sair" base-color="error" @click="auth.logout()" />
      </v-list>
    </v-menu>
  </v-app-bar>

  <v-main>
    <v-container fluid :class="focus ? 'pa-0' : 'pa-4 pa-md-6 max-w-page'">
      <router-view v-if="ready" v-slot="{ Component }">
        <component :is="Component" :key="route.path" />
      </router-view>
      <div v-else class="d-flex justify-center pa-12">
        <v-progress-circular indeterminate color="primary" />
      </div>
    </v-container>
  </v-main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute, useRouter, type RouteLocationRaw } from "vue-router";
import { useDisplay, useTheme } from "vuetify";
import { useAuthStore } from "@/modules/auth/stores/auth.store";
import { useStructureStore } from "@/stores/structure.store";
import { useTimerStore } from "@/modules/study/stores/timer.store";
import { routeProps } from "@/router/RouteProps";
import { formatDuration } from "@/utils/date";
import { writeStorage } from "@/utils/storage";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const structure = useStructureStore();
const timer = useTimerStore();
const theme = useTheme();
const { mobile } = useDisplay();

const drawer = ref(true);
const ready = ref(false);
const rail = ref(false);
const navigating = ref(false);

// indicador de carregamento enquanto a próxima tela é baixada
let navigationTimer: ReturnType<typeof setTimeout> | undefined;
const stopBefore = router.beforeEach(() => {
  clearTimeout(navigationTimer);
  navigationTimer = setTimeout(() => { navigating.value = true; }, 120);
});
const stopAfter = router.afterEach(() => {
  clearTimeout(navigationTimer);
  navigating.value = false;
});
const stopError = router.onError(() => {
  clearTimeout(navigationTimer);
  navigating.value = false;
});

const isDark = computed(() => theme.global.current.value.dark);
const focus = computed(() => !!route.meta.focus);

const toggleTheme = () => {
  const next = isDark.value ? "light" : "dark";
  theme.change(next);
  writeStorage("theme", next);
};

const toggleDrawer = () => {
  if (mobile.value) drawer.value = !drawer.value;
  else rail.value = !rail.value;
};

const firstName = computed(() => {
  const name = auth.user?.name ?? "";
  const first = name.split(" ")[0] ?? "";
  return first.charAt(0) + first.slice(1).toLowerCase();
});

const initials = computed(() => {
  const parts = (auth.user?.name ?? "?").split(" ").filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "")).toUpperCase();
});

interface MenuItem { key: string, title: string, icon: string, to: RouteLocationRaw, exact?: boolean, nested?: boolean }

const item = (title: string, icon: string, name: string, extra: Partial<MenuItem> = {}): MenuItem => ({ key: name, title, icon, to: { name }, ...extra });

const menu = computed(() => {
  const groups: { title: string, items: MenuItem[] }[] = [
    {
      title: "Estudos",
      items: [
        item("Início", "mdi-view-dashboard-outline", routeProps.home.name),
        item("Meus cursos", "mdi-school-outline", routeProps.courses.name, { exact: true }),
        ...structure.courses.map((course) => ({
          key: course.id,
          title: course.title,
          icon: "mdi-book-education-outline",
          to: { name: routeProps.courseDetail.name, params: { id: course.id } },
          nested: true,
        })),
        item("Biblioteca", "mdi-bookshelf", routeProps.library.name),
      ],
    },
    {
      title: "Acompanhamento",
      items: [
        item("Sessões de estudo", "mdi-timer-outline", routeProps.study.name),
        item("Metas", "mdi-flag-checkered", routeProps.goals.name),
        item("Estatísticas", "mdi-chart-box-outline", routeProps.stats.name),
      ],
    },
    {
      title: "Ajuda",
      items: [item("Suporte (SAC)", "mdi-lifebuoy", routeProps.tickets.name)],
    },
  ];

  if (auth.isAdmin) {
    groups.push({
      title: "Administração",
      items: [
        item("Painel", "mdi-shield-crown-outline", routeProps.adminDashboard.name, { exact: true }),
        item("Usuários", "mdi-account-group-outline", routeProps.adminUsers.name),
        item("Chamados", "mdi-headset", routeProps.adminTickets.name),
      ],
    });
  }

  return groups;
});

onMounted(async () => {
  drawer.value = !mobile.value;
  if (!auth.user) await auth.loadUser();
  if (auth.userId) await Promise.all([structure.load(auth.userId), timer.load()]);
  ready.value = true;
});

onBeforeUnmount(() => {
  stopBefore();
  stopAfter();
  stopError();
  clearTimeout(navigationTimer);
  timer.reset();
  structure.clear();
});
</script>
