<template>
  <div>
    <PageHeader title="Estatísticas" subtitle="Acompanhe seu tempo de estudo e o rendimento nas atividades" />

    <v-card class="mb-6">
      <v-card-text>
        <div class="d-flex flex-wrap align-center ga-2 mb-4">
          <span class="text-label-large mr-2">Período:</span>
          <v-chip-group v-model="preset" mandatory selected-class="text-primary" @update:model-value="applyPreset">
            <v-chip :value="7" variant="outlined" filter>7 dias</v-chip>
            <v-chip :value="30" variant="outlined" filter>30 dias</v-chip>
            <v-chip :value="90" variant="outlined" filter>90 dias</v-chip>
            <v-chip value="custom" variant="outlined" filter>Personalizado</v-chip>
          </v-chip-group>
        </div>

        <v-row v-if="preset === 'custom'" density="compact" class="mb-2">
          <v-col cols="12" sm="6" md="3">
            <v-text-field v-model="customStart" type="date" label="Data inicial" :max="customEnd || todayInput()" hide-details="auto" />
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-text-field
              v-model="customEnd"
              type="date"
              label="Data final"
              :min="customStart"
              :max="todayInput()"
              :error-messages="customRangeError"
              hide-details="auto"
            />
          </v-col>
          <v-col cols="12" md="3" class="d-flex align-center">
            <v-btn color="primary" variant="tonal" :disabled="!customRangeValid" @click="load">Aplicar</v-btn>
          </v-col>
        </v-row>

        <ScopeSelect v-model="scope" label="Filtrar por curso, módulo ou disciplina (opcional)" />
      </v-card-text>
    </v-card>

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />

    <template v-if="summary">
      <v-row class="mb-2">
        <v-col cols="12" sm="6" lg="">
          <StatCard label="Tempo total" :value="formatMinutes(summary.totalMinutes)" icon="mdi-clock-outline" />
        </v-col>
        <v-col cols="12" sm="6" lg="">
          <StatCard label="Média por dia" :value="formatMinutes(summary.averageMinutesPerDay)" icon="mdi-chart-line" color="secondary" />
        </v-col>
        <v-col cols="12" sm="6" lg="">
          <StatCard label="Dias estudados" :value="`${summary.studiedDays} / ${summary.perDay.length}`" icon="mdi-calendar-check-outline" color="info" />
        </v-col>
        <v-col cols="12" sm="6" lg="">
          <StatCard label="Sequência atual" :value="`${summary.currentStreak} ${summary.currentStreak === 1 ? 'dia' : 'dias'}`" icon="mdi-fire" color="warning" />
        </v-col>
        <v-col cols="12" sm="6" lg="">
          <StatCard label="Sessões" :value="summary.sessionsCount" icon="mdi-timer-outline" color="success" />
        </v-col>
      </v-row>

      <v-row class="mb-2">
        <v-col cols="12" lg="8">
          <v-card class="h-100">
            <v-card-title class="text-title-medium">Minutos estudados por dia</v-card-title>
            <v-card-text>
              <BarChart
                v-if="summary.totalMinutes > 0"
                :labels="summary.perDay.map(day => shortDay(day.date))"
                :values="summary.perDay.map(day => day.minutes)"
                :value-formatter="formatMinutes"
              />
              <EmptyState v-else title="Nenhum estudo no período" text="Use o cronômetro ou registre uma sessão manual." icon="mdi-chart-bar" />
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" lg="4">
          <v-card class="h-100">
            <v-card-title class="text-title-medium">Distribuição por {{ scopeGroupLabel }}</v-card-title>
            <v-card-text>
              <DoughnutChart
                v-if="summary.byScope.length"
                :labels="summary.byScope.map(item => item.title)"
                :values="summary.byScope.map(item => item.minutes)"
                :value-formatter="formatMinutes"
              />
              <EmptyState v-else title="Sem dados" icon="mdi-chart-donut" />
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <h2 class="text-title-large font-weight-bold mt-6 mb-4">Rendimento nas atividades</h2>

    <template v-if="performance">
      <EmptyState
        v-if="performance.totalAttempts === 0"
        title="Nenhuma atividade respondida"
        text="Responda atividades avaliativas para acompanhar seu rendimento."
        icon="mdi-clipboard-check-outline"
      >
        <v-btn color="primary" variant="tonal" :to="libraryRoute('activities')">Ver atividades</v-btn>
      </EmptyState>

      <template v-else>
        <v-row class="mb-2">
          <v-col cols="12" sm="4">
            <StatCard label="Tentativas" :value="performance.totalAttempts" icon="mdi-counter" />
          </v-col>
          <v-col cols="12" sm="4">
            <StatCard label="Nota média" :value="formatScore(performance.averageScore)" icon="mdi-percent-outline" color="secondary" />
          </v-col>
          <v-col cols="12" sm="4">
            <StatCard label="Melhor nota" :value="formatScore(performance.bestScore)" icon="mdi-trophy-outline" color="warning" />
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12" lg="7">
            <v-card class="h-100">
              <v-card-title class="text-title-medium">Evolução das notas</v-card-title>
              <v-card-text>
                <LineChart
                  :labels="performance.timeline.map(item => formatDateTime(item.date).slice(0, 5))"
                  :values="performance.timeline.map(item => item.score)"
                  :tooltip-titles="performance.timeline.map(item => `${item.activityTitle} — ${formatDateTime(item.date)}`)"
                  :min="0"
                  :max="100"
                  value-suffix="%"
                />
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" lg="5">
            <v-card class="h-100">
              <v-card-title class="text-title-medium">Por atividade</v-card-title>
              <v-table density="comfortable">
                <thead>
                  <tr>
                    <th>Atividade</th>
                    <th class="text-right">Tentativas</th>
                    <th class="text-right">Média</th>
                    <th class="text-right">Melhor</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in performance.byActivity" :key="item.activityId">
                    <td>
                      <router-link :to="{ name: routeProps.activityDetail.name, params: { id: item.activityId } }" class="text-primary">
                        {{ item.title }}
                      </router-link>
                    </td>
                    <td class="text-right">{{ item.attempts }}</td>
                    <td class="text-right">{{ formatScore(item.averageScore) }}</td>
                    <td class="text-right">{{ formatScore(item.bestScore) }}</td>
                  </tr>
                </tbody>
              </v-table>
            </v-card>
          </v-col>
        </v-row>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { libraryRoute } from "@/modules/library/models/constants/library.constants";
import { computed, onMounted, ref, watch } from "vue";
import PageHeader from "@/components/PageHeader.vue";
import StatCard from "@/components/StatCard.vue";
import EmptyState from "@/components/EmptyState.vue";
import ScopeSelect from "@/components/ScopeSelect.vue";
import BarChart from "@/components/charts/BarChart.vue";
import LineChart from "@/components/charts/LineChart.vue";
import DoughnutChart from "@/components/charts/DoughnutChart.vue";
import { useApi } from "@/composables/useApi";
import { routeProps } from "@/router/RouteProps";
import { useLatest } from "@/composables/useLatest";
import { formatDateTime, formatMinutes, inputToApiDate, shortDay, toInputDate, todayInput } from "@/utils/date";
import { formatScore } from "@/utils/score";
import type { Scope } from "@/modules/courses/models/interfaces/Scope.interface";
import { statsService } from "../services/stats.service";
import type { PerformanceDTO } from "../models/DTO/PerformanceDto";
import type { StatsQueryDTO } from "../models/DTO/StatsQueryDto";
import type { StudySummaryDTO } from "../models/DTO/StudySummaryDto";

const { runOne } = useApi();
const latest = useLatest();

const preset = ref<number | "custom">(30);
const customStart = ref("");
const customEnd = ref(todayInput());
const scope = ref<Scope>({});
const loading = ref(false);
const summary = ref<StudySummaryDTO | null>(null);
const performance = ref<PerformanceDTO | null>(null);

const customRangeError = computed(() =>
  customStart.value && customEnd.value && customStart.value > customEnd.value ? "A data inicial não pode ser posterior à final." : "");
const customRangeValid = computed(() => !!customStart.value && !!customEnd.value && !customRangeError.value);

const scopeGroupLabel = computed(() => {
  if (scope.value.disciplineId || scope.value.moduleId) return "disciplina";
  if (scope.value.courseId) return "módulo";
  return "curso";
});

const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - (days - 1));
  return inputToApiDate(toInputDate(date));
};

const buildQuery = (): StatsQueryDTO => {
  const query: StatsQueryDTO = {};
  if (preset.value === "custom") {
    if (customStart.value) query.startDate = inputToApiDate(customStart.value);
    if (customEnd.value) query.endDate = inputToApiDate(customEnd.value);
  } else {
    query.startDate = daysAgo(preset.value);
  }
  if (scope.value.courseId) query.courseId = scope.value.courseId;
  if (scope.value.moduleId) query.moduleId = scope.value.moduleId;
  if (scope.value.disciplineId) query.disciplineId = scope.value.disciplineId;
  return query;
};

const load = async () => {
  if (preset.value === "custom" && !customRangeValid.value) return;
  const request = latest.next();
  loading.value = true;
  try {
    const query = buildQuery();
    const [summaryData, performanceData] = await Promise.all([
      runOne(statsService.summary(query)),
      runOne(statsService.performance(query)),
    ]);
    if (!latest.isLatest(request)) return;
    summary.value = summaryData;
    performance.value = performanceData;
  } finally {
    if (latest.isLatest(request)) loading.value = false;
  }
};

const applyPreset = () => {
  if (preset.value !== "custom") load();
};

watch(scope, load, { deep: true });

onMounted(load);
</script>
