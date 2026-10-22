<template>
  <div>
    <PageHeader
      :title="overview?.user.name ?? 'Acompanhamento do usuário'"
      :subtitle="overview ? `@${overview.user.username} · ${overview.user.email}` : ''"
      :back="{ name: routeProps.adminUsers.name }"
    >
      <template #actions>
        <v-chip v-if="overview" :color="overview.user.role === 'ADMIN' ? 'primary' : undefined" variant="tonal">
          {{ overview.user.role === "ADMIN" ? "Administrador" : "Usuário" }}
        </v-chip>
      </template>
    </PageHeader>

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />

    <template v-if="overview">
      <v-alert type="info" variant="tonal" density="compact" icon="mdi-shield-lock-outline" class="mb-4">
        Por privacidade, arquivos e notas pessoais não são acessíveis ao administrador. Apenas a quantidade é exibida.
      </v-alert>

      <v-row class="mb-2">
        <v-col cols="12" sm="6" lg="3">
          <StatCard label="Tempo total de estudo" :value="formatMinutes(overview.study.totalMinutes)" :caption="`${overview.study.sessions} sessões`" icon="mdi-clock-outline" />
        </v-col>
        <v-col cols="12" sm="6" lg="3">
          <StatCard label="Últimos 30 dias" :value="formatMinutes(overview.study.minutesLast30Days)" :caption="overview.study.lastStudyAt ? `último estudo em ${formatDay(overview.study.lastStudyAt)}` : 'nenhum estudo registrado'" icon="mdi-calendar-month-outline" color="secondary" />
        </v-col>
        <v-col cols="12" sm="6" lg="3">
          <StatCard label="Média nas atividades" :value="formatScore(overview.activities.averageScore)" :caption="`${overview.activities.attempts} tentativas`" icon="mdi-percent-outline" color="warning" />
        </v-col>
        <v-col cols="12" sm="6" lg="3">
          <StatCard label="Armazenamento" :value="formatBytes(overview.storage.bytes)" :caption="`${overview.storage.files} arquivo(s)`" icon="mdi-cloud-outline" color="info" />
        </v-col>
      </v-row>

      <v-card class="mb-4">
        <v-card-title class="text-title-medium">Conteúdo criado</v-card-title>
        <v-card-text>
          <div class="d-flex flex-wrap ga-2">
            <v-chip v-for="item in countItems" :key="item.label" :prepend-icon="item.icon" variant="tonal">
              {{ item.label }}: <strong class="ml-1">{{ item.value }}</strong>
            </v-chip>
          </div>
          <div class="text-body-small text-medium-emphasis mt-3">
            Cadastrado em {{ formatDateTime(overview.user.createdAt) }} · Nascimento: {{ formatDay(overview.user.birthDate) }}
          </div>
        </v-card-text>
      </v-card>

      <v-row class="mb-2">
        <v-col cols="12" lg="8">
          <v-card class="h-100">
            <v-card-title class="text-title-medium">Estudo nos últimos 30 dias</v-card-title>
            <v-card-text>
              <BarChart
                v-if="summary && summary.totalMinutes > 0"
                :labels="summary.perDay.map(day => shortDay(day.date))"
                :values="summary.perDay.map(day => day.minutes)"
                :value-formatter="formatMinutes"
              />
              <EmptyState v-else title="Sem estudos no período" icon="mdi-chart-bar" />
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" lg="4">
          <v-card class="h-100">
            <v-card-title class="text-title-medium">Tempo por curso</v-card-title>
            <v-card-text>
              <DoughnutChart
                v-if="summary && summary.byScope.length"
                :labels="summary.byScope.map(item => item.title)"
                :values="summary.byScope.map(item => item.minutes)"
                :value-formatter="formatMinutes"
              />
              <EmptyState v-else title="Sem dados" icon="mdi-chart-donut" />
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="mb-2">
        <v-col cols="12" lg="6">
          <v-card class="h-100">
            <v-card-title class="text-title-medium">Estrutura de estudos</v-card-title>
            <v-card-text>
              <EmptyState v-if="!courses.length" title="Nenhum curso cadastrado" icon="mdi-school-outline" />
              <v-expansion-panels v-else variant="accordion" multiple>
                <v-expansion-panel v-for="course in courses" :key="course.id">
                  <v-expansion-panel-title>
                    <v-icon icon="mdi-school-outline" class="mr-2" />
                    <span class="font-weight-medium">{{ course.title }}</span>
                    <span class="text-body-small text-medium-emphasis ml-2">({{ modulesOf(course.id).length }} módulos)</span>
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <div v-if="course.description" class="text-body-medium text-medium-emphasis mb-2">{{ course.description }}</div>
                    <div v-if="!modulesOf(course.id).length" class="text-body-medium text-medium-emphasis">Nenhum módulo.</div>
                    <v-list v-else density="compact">
                      <template v-for="module in modulesOf(course.id)" :key="module.id">
                        <v-list-item prepend-icon="mdi-folder-outline" :title="module.title" />
                        <v-list-item
                          v-for="discipline in disciplinesOf(module.id)"
                          :key="discipline.id"
                          prepend-icon="mdi-book-open-variant"
                          :title="discipline.title"
                          class="pl-10"
                        />
                      </template>
                    </v-list>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" lg="6">
          <v-card class="h-100">
            <v-card-title class="text-title-medium">Metas</v-card-title>
            <v-card-text>
              <EmptyState v-if="!goals.length" title="Nenhuma meta cadastrada" icon="mdi-flag-checkered" />
              <div v-for="goal in goals" :key="goal.goalId" class="mb-4">
                <div class="d-flex align-center ga-2 mb-1">
                  <span class="font-weight-medium flex-grow-1">{{ goal.title }}</span>
                  <v-chip size="x-small" :color="goalStatusInfo[goal.status].color" variant="tonal">{{ goalStatusInfo[goal.status].label }}</v-chip>
                </div>
                <v-progress-linear :model-value="goal.percent" :color="goalStatusInfo[goal.status].color" height="8" rounded />
                <div class="text-body-small text-medium-emphasis mt-1">
                  {{ goalTypeLabels[goal.type] }} · {{ formatMinutes(goal.studiedMinutes) }} de {{ formatMinutes(goal.targetMinutes) }}
                  <template v-if="goal.totalDays"> · {{ goal.daysAchieved }}/{{ goal.totalDays }} dias</template>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" lg="6">
          <v-card class="h-100">
            <v-card-title class="text-title-medium">Evolução nas atividades</v-card-title>
            <v-card-text>
              <LineChart
                v-if="performance && performance.timeline.length"
                :labels="performance.timeline.map(item => formatDateTime(item.date).slice(0, 5))"
                :values="performance.timeline.map(item => item.score)"
                :tooltip-titles="performance.timeline.map(item => `${item.activityTitle} — ${formatDateTime(item.date)}`)"
                :min="0"
                :max="100"
                value-suffix="%"
              />
              <EmptyState v-else title="Nenhuma atividade respondida" icon="mdi-chart-line" />
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" lg="6">
          <v-card class="h-100">
            <v-card-title class="text-title-medium">Atividades avaliativas</v-card-title>
            <v-table v-if="activities.length" density="comfortable">
              <thead>
                <tr>
                  <th>Atividade</th>
                  <th class="text-right">Questões</th>
                  <th class="text-right">Tentativas</th>
                  <th class="text-right">Melhor nota</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="activity in activities" :key="activity.id">
                  <td>
                    <div>{{ activity.title }}</div>
                    <div class="text-body-small text-medium-emphasis">{{ scopePath(activity) }}</div>
                  </td>
                  <td class="text-right">{{ activity.questionCount }}</td>
                  <td class="text-right">{{ activity.attemptCount }}</td>
                  <td class="text-right">{{ formatScore(activity.bestScore) }}</td>
                </tr>
              </tbody>
            </v-table>
            <v-card-text v-else>
              <EmptyState title="Nenhuma atividade criada" icon="mdi-clipboard-check-outline" />
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <EmptyState v-else-if="!loading" title="Usuário não encontrado" icon="mdi-account-off-outline" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import PageHeader from "@/components/PageHeader.vue";
import StatCard from "@/components/StatCard.vue";
import EmptyState from "@/components/EmptyState.vue";
import BarChart from "@/components/charts/BarChart.vue";
import LineChart from "@/components/charts/LineChart.vue";
import DoughnutChart from "@/components/charts/DoughnutChart.vue";
import { useApi } from "@/composables/useApi";
import { routeProps } from "@/router/RouteProps";
import { formatBytes, formatDateTime, formatDay, formatMinutes, shortDay } from "@/utils/date";
import { formatScore } from "@/utils/score";
import { courseService } from "@/modules/courses/services/course.service";
import { moduleService } from "@/modules/courses/services/module.service";
import { disciplineService } from "@/modules/courses/services/discipline.service";
import type { CourseDTO } from "@/modules/courses/models/DTO/CourseDto";
import type { ModuleDTO } from "@/modules/courses/models/DTO/ModuleDto";
import type { DisciplineDTO } from "@/modules/courses/models/DTO/DisciplineDto";
import { goalService } from "@/modules/goals/services/goal.service";
import { goalStatusInfo, goalTypeLabels } from "@/modules/goals/models/constants/goal.constants";
import type { GoalProgressDTO } from "@/modules/goals/models/DTO/GoalProgressDto";
import { statsService } from "@/modules/stats/services/stats.service";
import type { PerformanceDTO } from "@/modules/stats/models/DTO/PerformanceDto";
import type { StudySummaryDTO } from "@/modules/stats/models/DTO/StudySummaryDto";
import { activityService } from "@/modules/activities/services/activity.service";
import type { ActivityDTO } from "@/modules/activities/models/DTO/ActivityDto";
import { adminService } from "../services/admin.service";
import type { AdminUserOverviewDTO } from "../models/DTO/AdminUserOverviewDto";

const route = useRoute();
const { run, runOne } = useApi();

const userId = computed(() => String(route.params.id));

const loading = ref(false);
const overview = ref<AdminUserOverviewDTO | null>(null);
const summary = ref<StudySummaryDTO | null>(null);
const performance = ref<PerformanceDTO | null>(null);
const goals = ref<GoalProgressDTO[]>([]);
const activities = ref<ActivityDTO[]>([]);
const courses = ref<CourseDTO[]>([]);
const modules = ref<ModuleDTO[]>([]);
const disciplines = ref<DisciplineDTO[]>([]);

const modulesOf = (courseId: string) => modules.value.filter((module) => module.courseId === courseId);
const disciplinesOf = (moduleId: string) => disciplines.value.filter((discipline) => discipline.moduleId === moduleId);

// usa a estrutura do usuário acompanhado: o store de estrutura guarda apenas a do administrador logado
const scopePath = (scope: { courseId: string | null, moduleId: string | null, disciplineId: string | null }) => {
  const discipline = disciplines.value.find((item) => item.id === scope.disciplineId);
  const module = modules.value.find((item) => item.id === (scope.moduleId ?? discipline?.moduleId));
  const course = courses.value.find((item) => item.id === (scope.courseId ?? module?.courseId));
  return [course?.title, module?.title, discipline?.title].filter(Boolean).join(" › ");
};

const countItems = computed(() => {
  if (!overview.value) return [];
  const counts = overview.value.counts;
  return [
    { label: "Cursos", value: counts.courses, icon: "mdi-school-outline" },
    { label: "Módulos", value: counts.modules, icon: "mdi-folder-outline" },
    { label: "Disciplinas", value: counts.disciplines, icon: "mdi-book-open-variant" },
    { label: "Metas", value: counts.goals, icon: "mdi-flag-checkered" },
    { label: "Questões", value: counts.questions, icon: "mdi-help-box-multiple-outline" },
    { label: "Atividades", value: counts.activities, icon: "mdi-clipboard-check-outline" },
    { label: "Notas", value: counts.notes, icon: "mdi-notebook-outline" },
    { label: "Arquivos", value: counts.files, icon: "mdi-file-lock-outline" },
    { label: "Chamados", value: counts.tickets, icon: "mdi-lifebuoy" },
  ];
});

const load = async () => {
  loading.value = true;
  try {
    overview.value = await runOne(adminService.userOverview(userId.value));
    if (!overview.value) return;

    const id = userId.value;
    const [summaryData, performanceData, goalsData, activitiesData, coursesData, modulesData, disciplinesData] = await Promise.all([
      runOne(statsService.summary({ userId: id })),
      runOne(statsService.performance({ userId: id })),
      run(goalService.progress(id)),
      run(activityService.listByUser(id)),
      run(courseService.listByUser(id)),
      run(moduleService.listByUser(id)),
      run(disciplineService.listByUser(id)),
    ]);

    summary.value = summaryData;
    performance.value = performanceData;
    goals.value = goalsData ?? [];
    activities.value = activitiesData ?? [];
    courses.value = coursesData ?? [];
    modules.value = modulesData ?? [];
    disciplines.value = disciplinesData ?? [];
  } finally {
    loading.value = false;
  }
};

onMounted(load);
</script>
