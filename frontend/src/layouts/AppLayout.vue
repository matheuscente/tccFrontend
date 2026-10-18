<template>
  <v-navigation-drawer v-model="drawer" :rail="rail && !mobile" :permanent="!mobile" :temporary="mobile" width="264">
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
          :key="item.title"
          :to="{ name: item.route }"
          :prepend-icon="item.icon"
          :title="item.title"
          :exact="item.exact ?? false"
          rounded="lg"
        />
      </template>
    </v-list>
  </v-navigation-drawer>

  <v-app-bar flat border="b" density="comfortable">
    <v-app-bar-nav-icon @click="toggleDrawer" aria-label="Menu" />

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
        <v-btn v-bind="menuProps" variant="text" class="text-none mr-2" :aria-label="'Menu do usuário'">
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
    <v-container fluid class="pa-4 pa-md-6 max-w-page">
      <router-view v-if="ready" v-slot="{ Component }">
        <component :is="Component" :key="route.fullPath" />
      </router-view>
      <div v-else class="d-flex justify-center pa-12">
        <v-progress-circular indeterminate color="primary" />
      </div>
    </v-container>
  </v-main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { useDisplay, useTheme } from "vuetify";
import { useAuthStore } from "@/modules/auth/stores/auth.store";
import { useStructureStore } from "@/stores/structure.store";
import { useTimerStore } from "@/modules/study/stores/timer.store";
import { routeProps } from "@/router/RouteProps";
import { formatDuration } from "@/utils/date";

const route = useRoute();
const auth = useAuthStore();
const structure = useStructureStore();
const timer = useTimerStore();
const theme = useTheme();
const { mobile } = useDisplay();

const drawer = ref(true);
const ready = ref(false);
const rail = ref(false);

const isDark = computed(() => theme.global.current.value.dark);

const toggleTheme = () => {
  const next = isDark.value ? "light" : "dark";
  theme.change(next);
  try {
    localStorage.setItem("theme", next);
  } catch {
    // storage indisponível
  }
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

interface MenuItem { title: string, icon: string, route: string, exact?: boolean }

const menu = computed(() => {
  const groups: { title: string, items: MenuItem[] }[] = [
    {
      title: "Estudos",
      items: [
        { title: "Início", icon: "mdi-view-dashboard-outline", route: routeProps.home.name },
        { title: "Cursos", icon: "mdi-school-outline", route: routeProps.courses.name },
        { title: "Sessões de estudo", icon: "mdi-timer-outline", route: routeProps.study.name },
        { title: "Metas", icon: "mdi-flag-checkered", route: routeProps.goals.name },
        { title: "Estatísticas", icon: "mdi-chart-box-outline", route: routeProps.stats.name },
      ],
    },
    {
      title: "Avaliações",
      items: [
        { title: "Banco de questões", icon: "mdi-help-box-multiple-outline", route: routeProps.questions.name },
        { title: "Atividades", icon: "mdi-clipboard-check-outline", route: routeProps.activities.name },
      ],
    },
    {
      title: "Materiais",
      items: [
        { title: "Bloco de notas", icon: "mdi-notebook-outline", route: routeProps.notes.name },
        { title: "Arquivos", icon: "mdi-cloud-outline", route: routeProps.files.name },
      ],
    },
    {
      title: "Ajuda",
      items: [{ title: "Suporte (SAC)", icon: "mdi-lifebuoy", route: routeProps.tickets.name }],
    },
  ];

  if (auth.isAdmin) {
    groups.push({
      title: "Administração",
      items: [
        { title: "Painel", icon: "mdi-shield-crown-outline", route: routeProps.adminDashboard.name, exact: true },
        { title: "Usuários", icon: "mdi-account-group-outline", route: routeProps.adminUsers.name },
        { title: "Chamados", icon: "mdi-headset", route: routeProps.adminTickets.name },
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
</script>
