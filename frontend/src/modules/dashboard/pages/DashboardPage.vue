<template>
  <div>
    <PageHeader :title="`${greeting}, ${firstName}!`" :subtitle="todayLabel" />

    <EmptyState
      v-if="!structure.loading && structure.loadedFor && !structure.courses.length"
      icon="mdi-rocket-launch-outline"
      title="Vamos começar?"
      text="Cadastre seu primeiro curso. Depois você poderá criar módulos, disciplinas, metas, questões e acompanhar seu tempo de estudo."
      class="mb-6"
    >
      <v-btn color="primary" prepend-icon="mdi-plus" :to="{ name: routeProps.courses.name }">Cadastrar curso</v-btn>
    </EmptyState>

    <v-row class="mb-2">
      <v-col cols="12" sm="6" lg="3">
        <StatCard label="Estudado hoje" :value="formatMinutes(todayMinutes)" icon="mdi-clock-outline" />
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <StatCard label="Últimos 7 dias" :value="formatMinutes(weekMinutes)" icon="mdi-calendar-week" color="secondary" :to="{ name: routeProps.stats.name }" />
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <StatCard
          label="Sequência de estudo"
          :value="`${summary?.currentStreak ?? 0} dia(s)`"
          icon="mdi-fire"
          color="warning"
          caption="dias seguidos estudando"
        />
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <StatCard
          label="Média nas atividades"
          :value="performance?.averageScore !== null && performance?.averageScore !== undefined ? `${performance.averageScore}%` : '—'"
          icon="mdi-clipboard-check-outline"
          color="info"
          :caption="`${performance?.totalAttempts ?? 0} tentativa(s)`"
          :to="{ name: routeProps.activities.name }"
        />
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" lg="5">
        <StudyTimerCard @finished="load" />
      </v-col>

      <v-col cols="12" lg="7">
        <v-card class="h-100">
          <v-card-item>
            <v-card-title class="text-title-large">Últimos 14 dias</v-card-title>
            <v-card-subtitle>Minutos estudados por dia</v-card-subtitle>
            <template #append>
              <v-btn variant="text" size="small" append-icon="mdi-chevron-right" :to="{ name: routeProps.stats.name }">Estatísticas</v-btn>
            </template>
          </v-card-item>
          <v-card-text>
            <v-skeleton-loader v-if="loading" type="image" />
            <BarChart
              v-else
              :labels="last14.map((day) => shortDay(day.date))"
              :values="last14.map((day) => day.minutes)"
              :height="240"
              :value-formatter="formatMinutes"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" lg="7">
        <v-card class="h-100">
          <v-card-item>
            <v-card-title class="text-title-large">Metas</v-card-title>
            <v-card-subtitle>{{ achievedGoals }} de {{ goals.length }} concluída(s)</v-card-subtitle>
            <template #append>
              <v-btn variant="text" size="small" append-icon="mdi-chevron-right" :to="{ name: routeProps.goals.name }">Ver todas</v-btn>
            </template>
          </v-card-item>
          <v-card-text>
            <v-skeleton-loader v-if="loading" type="list-item-two-line@3" />
            <div v-else-if="!goals.length" class="text-body-medium text-medium-emphasis py-4 text-center">
              Nenhuma meta cadastrada.
              <router-link :to="{ name: routeProps.goals.name }" class="text-primary">Criar uma meta</router-link>
            </div>
            <div v-else>
              <div v-for="goal in visibleGoals" :key="goal.goalId" class="mb-4">
                <div class="d-flex align-center ga-2 mb-1">
                  <span class="text-title-small flex-grow-1 text-truncate">{{ goal.title }}</span>
                  <v-chip size="x-small" :color="goalStatusInfo[goal.status].color" variant="flat">{{ goalStatusInfo[goal.status].label }}</v-chip>
                </div>
                <v-progress-linear
                  :model-value="goal.percent"
                  :color="goalStatusInfo[goal.status].color === 'grey' ? 'primary' : goalStatusInfo[goal.status].color"
                  height="8"
                  rounded
                />
                <div class="d-flex justify-space-between text-body-small text-medium-emphasis mt-1">
                  <ScopeLabel :scope="goal.scope" />
                  <span>{{ formatMinutes(goal.studiedMinutes) }} / {{ formatMinutes(goal.targetMinutes) }}</span>
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" lg="5">
        <v-card class="h-100">
          <v-card-item>
            <v-card-title class="text-title-large">Atalhos</v-card-title>
          </v-card-item>
          <v-card-text>
            <v-row density="compact">
              <v-col v-for="link in quickLinks" :key="link.title" cols="6">
                <v-card variant="tonal" :color="link.color" :to="{ name: link.route }" class="pa-3 text-center">
                  <v-icon :icon="link.icon" size="28" class="mb-1" />
                  <div class="text-label-large">{{ link.title }}</div>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import PageHeader from "@/components/PageHeader.vue";
import EmptyState from "@/components/EmptyState.vue";
import StatCard from "@/components/StatCard.vue";
import ScopeLabel from "@/components/ScopeLabel.vue";
import BarChart from "@/components/charts/BarChart.vue";
import StudyTimerCard from "@/modules/study/components/StudyTimerCard.vue";
import { useAuthStore } from "@/modules/auth/stores/auth.store";
import { useStructureStore } from "@/stores/structure.store";
import { useApi } from "@/composables/useApi";
import { statsService } from "@/modules/stats/services/stats.service";
import { goalService } from "@/modules/goals/services/goal.service";
import { goalStatusInfo, type GoalProgress } from "@/modules/goals/models/goal.model";
import type { Performance, StudySummary } from "@/modules/stats/models/stats.model";
import { routeProps } from "@/router/RouteProps";
import { formatMinutes, shortDay } from "@/utils/date";

const auth = useAuthStore();
const structure = useStructureStore();
const { runOne, run } = useApi();

const loading = ref(true);
const summary = ref<StudySummary | null>(null);
const performance = ref<Performance | null>(null);
const goals = ref<GoalProgress[]>([]);

const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
});

const firstName = computed(() => {
  const first = (auth.user?.name ?? "").split(" ")[0] ?? "";
  return first.charAt(0) + first.slice(1).toLowerCase();
});

const todayLabel = computed(() => {
  const text = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  return text.charAt(0).toUpperCase() + text.slice(1);
});

const perDay = computed(() => summary.value?.perDay ?? []);
const last14 = computed(() => perDay.value.slice(-14));
const todayMinutes = computed(() => perDay.value[perDay.value.length - 1]?.minutes ?? 0);
const weekMinutes = computed(() => perDay.value.slice(-7).reduce((total, day) => total + day.minutes, 0));

const achievedGoals = computed(() => goals.value.filter((goal) => goal.status === "ACHIEVED").length);

// metas em andamento primeiro
const visibleGoals = computed(() => {
  const order = { IN_PROGRESS: 0, ACHIEVED: 1, NOT_STARTED: 2, EXPIRED: 3 } as const;
  return [...goals.value].sort((a, b) => order[a.status] - order[b.status]).slice(0, 5);
});

const quickLinks = [
  { title: "Cursos", icon: "mdi-school-outline", route: routeProps.courses.name, color: "primary" },
  { title: "Questões", icon: "mdi-help-box-multiple-outline", route: routeProps.questions.name, color: "secondary" },
  { title: "Atividades", icon: "mdi-clipboard-check-outline", route: routeProps.activities.name, color: "info" },
  { title: "Notas", icon: "mdi-notebook-outline", route: routeProps.notes.name, color: "warning" },
  { title: "Arquivos", icon: "mdi-cloud-outline", route: routeProps.files.name, color: "success" },
  { title: "Suporte", icon: "mdi-lifebuoy", route: routeProps.tickets.name, color: "error" },
];

const load = async () => {
  loading.value = true;
  try {
    const [summaryResult, performanceResult, goalsResult] = await Promise.all([
      runOne(statsService.summary()),
      runOne(statsService.performance()),
      run(goalService.progress()),
    ]);
    summary.value = summaryResult;
    performance.value = performanceResult;
    goals.value = goalsResult ?? [];
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await Promise.all([structure.load(auth.userId), load()]);
});
</script>
