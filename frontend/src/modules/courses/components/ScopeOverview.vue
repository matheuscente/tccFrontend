<template>
  <div>
    <v-row class="mb-1">
      <v-col v-for="tile in tiles" :key="tile.tab" cols="6" sm="4" lg="2">
        <v-card variant="tonal" :color="tile.color" class="tile pa-3" @click="emit('openTab', tile.tab)">
          <v-icon :icon="tile.icon" size="22" class="mb-1" />
          <div class="text-headline-small font-weight-bold">{{ loading ? "–" : counts[tile.tab] ?? 0 }}</div>
          <div class="text-label-large">{{ tile.title }}</div>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" lg="7">
        <v-card v-if="children.length || childLabel" class="mb-4">
          <v-card-item>
            <v-card-title class="text-title-large">{{ childLabel }}</v-card-title>
            <v-card-subtitle>Escolha por onde continuar</v-card-subtitle>
            <template #append>
              <v-btn variant="text" color="primary" prepend-icon="mdi-plus" @click="emit('addChild')">{{ addChildLabel }}</v-btn>
            </template>
          </v-card-item>
          <v-list v-if="children.length" lines="two" class="pt-0">
            <v-list-item v-for="child in children" :key="child.id" :to="child.to" :title="child.title" :subtitle="child.subtitle">
              <template #prepend>
                <v-avatar :color="child.color" variant="tonal" rounded="lg"><v-icon :icon="child.icon" /></v-avatar>
              </template>
              <template #append>
                <v-btn
                  size="small"
                  variant="tonal"
                  color="primary"
                  prepend-icon="mdi-book-open-page-variant-outline"
                  :aria-label="`Estudar ${child.title}`"
                  @click.prevent.stop="emit('study', child.scope)"
                >
                  Estudar
                </v-btn>
              </template>
            </v-list-item>
          </v-list>
          <v-card-text v-else class="text-body-medium text-medium-emphasis">{{ emptyChildText }}</v-card-text>
        </v-card>

        <v-card v-else class="mb-4">
          <v-card-item>
            <v-card-title class="text-title-large">Materiais e notas recentes</v-card-title>
          </v-card-item>
          <v-list v-if="recent.length" class="pt-0">
            <v-list-item v-for="item in recent" :key="item.id" :prepend-icon="item.icon" :title="item.title" :subtitle="item.subtitle" @click="emit('openTab', item.tab)" />
          </v-list>
          <v-card-text v-else class="text-body-medium text-medium-emphasis">
            Nada por aqui ainda. Envie um material ou crie uma nota para esta disciplina.
          </v-card-text>
        </v-card>

        <v-card>
          <v-card-item>
            <v-card-title class="text-title-large">Metas</v-card-title>
            <v-card-subtitle>{{ achievedGoals }} de {{ goals.length }} concluída(s)</v-card-subtitle>
            <template #append>
              <v-btn variant="text" size="small" append-icon="mdi-chevron-right" @click="emit('openTab', 'goals')">Ver metas</v-btn>
            </template>
          </v-card-item>
          <v-card-text>
            <v-skeleton-loader v-if="loading" type="list-item-two-line@2" />
            <div v-else-if="!goals.length" class="text-body-medium text-medium-emphasis">
              Nenhuma meta para este conteúdo.
              <a href="#" class="text-primary" @click.prevent="emit('openTab', 'goals')">Criar uma meta</a>
            </div>
            <div v-for="goal in visibleGoals" v-else :key="goal.goalId" class="mb-4">
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
              <div class="text-body-small text-medium-emphasis mt-1">{{ formatMinutes(goal.studiedMinutes) }} de {{ formatMinutes(goal.targetMinutes) }}</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" lg="5">
        <v-row density="compact" class="mb-2">
          <v-col cols="12" sm="6" lg="12">
            <StatCard label="Estudado em 30 dias" :value="formatMinutes(summary?.totalMinutes ?? 0)" icon="mdi-clock-outline" />
          </v-col>
          <v-col cols="12" sm="6" lg="12">
            <StatCard
              label="Média nas atividades"
              :value="formatScore(performance?.averageScore)"
              icon="mdi-clipboard-check-outline"
              color="info"
              :caption="`${performance?.totalAttempts ?? 0} tentativa(s)`"
            />
          </v-col>
        </v-row>
        <v-card>
          <v-card-item>
            <v-card-title class="text-title-large">Últimos 14 dias</v-card-title>
            <v-card-subtitle>Minutos estudados neste conteúdo</v-card-subtitle>
          </v-card-item>
          <v-card-text>
            <v-skeleton-loader v-if="loading" type="image" />
            <BarChart
              v-else
              :labels="last14.map((day) => shortDay(day.date))"
              :values="last14.map((day) => day.minutes)"
              :height="220"
              :value-formatter="formatMinutes"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import StatCard from "@/components/StatCard.vue";
import BarChart from "@/components/charts/BarChart.vue";
import { goalStatusInfo } from "@/modules/goals/models/constants/goal.constants";
import type { GoalProgressDTO } from "@/modules/goals/models/DTO/GoalProgressDto";
import type { StoredFileDTO } from "@/modules/files/models/DTO/StoredFileDto";
import type { NoteDTO } from "@/modules/notes/models/DTO/NoteDto";
import type { StudySummaryDTO } from "@/modules/stats/models/DTO/StudySummaryDto";
import type { PerformanceDTO } from "@/modules/stats/models/DTO/PerformanceDto";
import { fileIcon } from "@/modules/files/utils/fileKind";
import { formatDateTime, formatMinutes, shortDay } from "@/utils/date";
import { formatScore } from "@/utils/score";
import type { Scope } from "../models/interfaces/Scope.interface";
import type { HubTab } from "../models/Types/HubTab";
import type { OverviewChild } from "../models/interfaces/OverviewChild.interface";

const props = defineProps<{
  loading: boolean
  counts: Partial<Record<HubTab, number>>
  children: OverviewChild[]
  childLabel: string
  addChildLabel: string
  emptyChildText: string
  goals: GoalProgressDTO[]
  files: StoredFileDTO[]
  notes: NoteDTO[]
  summary: StudySummaryDTO | null
  performance: PerformanceDTO | null
}>();

const emit = defineEmits<{ openTab: [tab: HubTab], study: [scope: Scope], addChild: [] }>();

const tiles: { tab: HubTab, title: string, icon: string, color: string }[] = [
  { tab: "files", title: "Materiais", icon: "mdi-file-document-multiple-outline", color: "success" },
  { tab: "notes", title: "Notas", icon: "mdi-notebook-outline", color: "warning" },
  { tab: "questions", title: "Questões", icon: "mdi-help-box-multiple-outline", color: "secondary" },
  { tab: "activities", title: "Atividades", icon: "mdi-clipboard-check-outline", color: "info" },
  { tab: "goals", title: "Metas", icon: "mdi-flag-checkered", color: "primary" },
  { tab: "sessions", title: "Sessões", icon: "mdi-timer-outline", color: "error" },
];

const last14 = computed(() => (props.summary?.perDay ?? []).slice(-14));
const achievedGoals = computed(() => props.goals.filter((goal) => goal.status === "ACHIEVED").length);

const visibleGoals = computed(() => {
  const order = { IN_PROGRESS: 0, NOT_STARTED: 1, ACHIEVED: 2, EXPIRED: 3 } as const;
  return [...props.goals].sort((a, b) => order[a.status] - order[b.status]).slice(0, 3);
});

const recent = computed(() => [
  ...props.files.map((file) => ({ id: file.id, title: file.originalName, subtitle: `Material · ${formatDateTime(file.createdAt)}`, icon: fileIcon(file.mimeType), tab: "files" as HubTab, date: file.createdAt })),
  ...props.notes.map((note) => ({ id: note.id, title: note.title || "Sem título", subtitle: `Nota · ${formatDateTime(note.updatedAt)}`, icon: "mdi-notebook-outline", tab: "notes" as HubTab, date: note.updatedAt })),
].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6));
</script>

<style scoped>
.tile {
  cursor: pointer;
}
</style>
