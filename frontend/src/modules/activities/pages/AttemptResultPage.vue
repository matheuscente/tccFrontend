<template>
  <div>
    <div v-if="loading" class="d-flex justify-center pa-8">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <EmptyState v-else-if="!attempt" icon="mdi-alert-circle-outline" title="Resultado não encontrado">
      <v-btn :to="{ name: routeProps.activities.name }">Voltar para as atividades</v-btn>
    </EmptyState>

    <template v-else>
      <PageHeader :title="`Resultado: ${attempt.activityTitle}`" :subtitle="`Enviado em ${formatDateTime(attempt.finishedAt)}`" />

      <v-card class="mb-6">
        <v-card-text class="d-flex flex-wrap align-center ga-6">
          <v-progress-circular :model-value="attempt.score" :color="scoreColor(attempt.score)" size="128" width="12">
            <span class="text-headline-small font-weight-bold">{{ formatScore(attempt.score) }}</span>
          </v-progress-circular>
          <div class="flex-grow-1">
            <div class="text-title-large mb-1">{{ message }}</div>
            <div class="text-body-large text-medium-emphasis">
              {{ attempt.correctCount }} de {{ attempt.totalQuestions }} questões corretas · duração {{ formatDuration(attempt.durationSeconds) }}
            </div>
          </div>
          <div class="d-flex flex-wrap ga-2">
            <v-btn color="primary" prepend-icon="mdi-restart" :to="{ name: routeProps.activityAnswer.name, params: { id: attempt.activityId } }">Refazer</v-btn>
            <v-btn variant="tonal" :to="{ name: routeProps.activityDetail.name, params: { id: attempt.activityId } }">Voltar para a atividade</v-btn>
          </div>
        </v-card-text>
      </v-card>

      <h2 class="text-title-large mb-3">Correção</h2>

      <v-card v-for="(answer, index) in attempt.answers ?? []" :key="answer.questionId" class="mb-3">
        <v-card-item>
          <template #prepend>
            <v-icon :icon="answer.isCorrect ? 'mdi-check-circle' : 'mdi-close-circle'" :color="answer.isCorrect ? 'success' : 'error'" size="28" />
          </template>
          <v-card-title class="text-title-medium text-wrap">{{ index + 1 }}. {{ answer.statement }}</v-card-title>
          <v-card-subtitle v-if="!answer.selectedOptionId">Sem resposta</v-card-subtitle>
        </v-card-item>
        <v-card-text>
          <div
            v-for="(option, optionIndex) in answer.options"
            :key="option.id"
            class="review-option mb-2"
            :class="optionClass(answer.correctOptionId, answer.selectedOptionId, option.id)"
          >
            <v-icon :icon="optionIcon(answer.correctOptionId, answer.selectedOptionId, option.id)" size="18" class="mr-2" />
            <strong class="mr-1">{{ String.fromCharCode(65 + optionIndex) }})</strong> {{ option.text }}
            <span v-if="option.id === answer.selectedOptionId" class="text-label-small ml-2">(sua resposta)</span>
          </div>
          <v-alert v-if="answer.explanation" type="info" variant="tonal" density="compact" icon="mdi-lightbulb-outline" class="mt-3 pre-wrap">
            {{ answer.explanation }}
          </v-alert>
        </v-card-text>
      </v-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import PageHeader from "@/components/PageHeader.vue";
import EmptyState from "@/components/EmptyState.vue";
import { useApi } from "@/composables/useApi";
import { routeProps } from "@/router/RouteProps";
import { formatDateTime, formatDuration } from "@/utils/date";
import type { Attempt } from "../models/activity.model";
import { activityService } from "../services/activity.service";
import { formatScore, scoreColor } from "../components/scoreColor";

const route = useRoute();
const { runOne } = useApi();

const attempt = ref<Attempt | null>(null);
const loading = ref(true);

const message = computed(() => {
  const score = attempt.value?.score ?? 0;
  if (score === 100) return "Excelente! Você acertou tudo.";
  if (score >= 70) return "Muito bem! Bom desempenho.";
  if (score >= 50) return "Bom começo. Revise os pontos que errou.";
  return "Continue estudando e tente novamente.";
});

const optionClass = (correct: string | null, selected: string | null, optionId: string) => {
  if (optionId === correct) return "review-option--correct";
  if (optionId === selected) return "review-option--wrong";
  return "";
};

const optionIcon = (correct: string | null, selected: string | null, optionId: string) => {
  if (optionId === correct) return "mdi-check";
  if (optionId === selected) return "mdi-close";
  return "mdi-circle-small";
};

onMounted(async () => {
  try {
    attempt.value = await runOne(activityService.attempt(String(route.params.id)));
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.review-option {
  display: flex;
  align-items: center;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 10px;
  padding: 8px 12px;
}

.review-option--correct {
  border-color: rgb(var(--v-theme-success));
  background: rgba(var(--v-theme-success), 0.1);
}

.review-option--wrong {
  border-color: rgb(var(--v-theme-error));
  background: rgba(var(--v-theme-error), 0.1);
}
</style>
