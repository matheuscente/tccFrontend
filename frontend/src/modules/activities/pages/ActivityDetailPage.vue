<template>
  <div>
    <div v-if="loading" class="d-flex justify-center pa-8">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <EmptyState v-else-if="!activity" icon="mdi-alert-circle-outline" title="Atividade não encontrada">
      <v-btn :to="{ name: routeProps.activities.name }">Voltar</v-btn>
    </EmptyState>

    <template v-else>
      <PageHeader :title="activity.title" :back="{ name: routeProps.activities.name }">
        <template #actions>
          <v-btn
            color="primary"
            prepend-icon="mdi-play"
            :disabled="activity.questions.length === 0"
            :to="{ name: routeProps.activityAnswer.name, params: { id: activity.id } }"
          >
            Responder
          </v-btn>
        </template>
      </PageHeader>

      <v-row>
        <v-col cols="12" md="5">
          <v-card class="mb-4">
            <v-card-title class="text-title-medium pt-4 px-4">Dados da atividade</v-card-title>
            <v-card-text>
              <div class="mb-3"><ScopeLabel :scope="activity" /></div>
              <v-form ref="infoForm" @submit.prevent="saveInfo">
                <v-text-field
                  v-model="title"
                  label="Título"
                  :rules="[required('Título'), minLength(3, 'Título'), maxLength(150, 'Título')]"
                  class="mb-2"
                />
                <v-textarea v-model="description" label="Descrição" rows="3" auto-grow :rules="[maxLength(1000, 'Descrição')]" />
                <div class="d-flex justify-end">
                  <v-btn color="primary" variant="tonal" :loading="savingInfo" :disabled="!infoChanged" type="submit">Salvar dados</v-btn>
                </div>
              </v-form>
            </v-card-text>
          </v-card>

          <v-card>
            <v-card-title class="text-title-medium pt-4 px-4">Desempenho</v-card-title>
            <v-card-text>
              <div class="d-flex flex-wrap ga-2 mb-3">
                <v-chip variant="tonal">{{ attempts.length }} tentativa(s)</v-chip>
                <v-chip variant="tonal" :color="scoreColor(activity.bestScore)">Melhor: {{ formatScore(activity.bestScore) }}</v-chip>
                <v-chip variant="tonal" :color="scoreColor(activity.lastScore)">Última: {{ formatScore(activity.lastScore) }}</v-chip>
              </div>
              <LineChart
                v-if="attempts.length > 1"
                :labels="chartLabels"
                :values="chartValues"
                :tooltip-titles="chartTitles"
                :min="0"
                :max="100"
                value-suffix="%"
                :height="200"
              />
              <div v-else class="text-body-small text-medium-emphasis">O gráfico aparece a partir da segunda tentativa.</div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="7">
          <v-card class="mb-4">
            <v-card-item>
              <v-card-title class="text-title-medium">Questões ({{ selectedQuestions.length }})</v-card-title>
              <template #append>
                <v-btn variant="tonal" prepend-icon="mdi-plus" size="small" @click="openAdd">Adicionar</v-btn>
              </template>
            </v-card-item>
            <v-card-text>
              <v-alert v-if="selectedQuestions.length === 0" type="info" variant="tonal" density="compact">
                A atividade ainda não tem questões. Adicione questões do banco para poder respondê-la.
              </v-alert>
              <v-list v-else density="compact" class="pa-0">
                <v-list-item v-for="(question, index) in selectedQuestions" :key="question.id" class="px-0">
                  <template #prepend>
                    <v-avatar size="28" color="primary" variant="tonal" class="mr-2">
                      <span class="text-label-medium">{{ index + 1 }}</span>
                    </v-avatar>
                  </template>
                  <v-list-item-title class="text-wrap text-body-medium">{{ question.statement }}</v-list-item-title>
                  <v-list-item-subtitle><ScopeLabel :scope="question" /></v-list-item-subtitle>
                  <template #append>
                    <v-btn icon="mdi-arrow-up" variant="text" size="small" :disabled="index === 0" :aria-label="`Mover questão ${index + 1} para cima`" @click="move(index, -1)" />
                    <v-btn icon="mdi-arrow-down" variant="text" size="small" :disabled="index === selectedQuestions.length - 1" :aria-label="`Mover questão ${index + 1} para baixo`" @click="move(index, 1)" />
                    <v-btn icon="mdi-close" variant="text" size="small" color="error" :aria-label="`Remover questão ${index + 1} da atividade`" @click="removeQuestion(index)" />
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>
            <v-card-actions v-if="questionsChanged" class="px-4 pb-4">
              <v-alert type="warning" variant="tonal" density="compact" class="flex-grow-1 mr-2">Alterações não salvas</v-alert>
              <v-btn variant="text" @click="resetQuestions">Descartar</v-btn>
              <v-btn color="primary" variant="flat" :loading="savingQuestions" @click="saveQuestions">Salvar questões</v-btn>
            </v-card-actions>
          </v-card>

          <v-card>
            <v-card-title class="text-title-medium pt-4 px-4">Histórico de tentativas</v-card-title>
            <v-card-text>
              <div v-if="attempts.length === 0" class="text-body-medium text-medium-emphasis">Nenhuma tentativa ainda.</div>
              <v-table v-else density="comfortable">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Nota</th>
                    <th>Acertos</th>
                    <th>Duração</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="attempt in attempts" :key="attempt.id">
                    <td>{{ formatDateTime(attempt.finishedAt) }}</td>
                    <td><v-chip size="small" variant="tonal" :color="scoreColor(attempt.score)">{{ formatScore(attempt.score) }}</v-chip></td>
                    <td>{{ attempt.correctCount }}/{{ attempt.totalQuestions }}</td>
                    <td>{{ formatDuration(attempt.durationSeconds) }}</td>
                    <td class="text-right">
                      <v-btn
                        variant="text"
                        size="small"
                        :aria-label="`Ver resultado de ${formatDateTime(attempt.finishedAt)}`"
                        :to="{ name: routeProps.attemptResult.name, params: { id: attempt.id } }"
                      >
                        Ver
                      </v-btn>
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-dialog v-model="addDialog" max-width="720" scrollable>
        <v-card>
          <v-card-title class="text-title-large pt-5 px-6">Adicionar questões</v-card-title>
          <v-card-text class="px-6">
            <QuestionPicker
              v-model="toAdd"
              :questions="notIncluded"
              :loading="loadingBank"
              empty-text="Não há outras questões neste escopo. Cadastre novas no banco de questões."
            />
          </v-card-text>
          <v-card-actions class="px-6 pb-4">
            <v-btn variant="text" :to="{ name: routeProps.questions.name }">Ir ao banco de questões</v-btn>
            <v-spacer />
            <v-btn variant="text" @click="addDialog = false">Cancelar</v-btn>
            <v-btn color="primary" variant="flat" :disabled="toAdd.length === 0" @click="confirmAdd">Adicionar {{ toAdd.length || "" }}</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import type { VForm } from "vuetify/components";
import PageHeader from "@/components/PageHeader.vue";
import EmptyState from "@/components/EmptyState.vue";
import ScopeLabel from "@/components/ScopeLabel.vue";
import LineChart from "@/components/charts/LineChart.vue";
import { useApi } from "@/composables/useApi";
import { useLeaveGuard } from "@/composables/useLeaveGuard";
import { useAuthStore } from "@/modules/auth/stores/auth.store";
import { routeProps } from "@/router/RouteProps";
import { formatDateTime, formatDuration } from "@/utils/date";
import { maxLength, minLength, required } from "@/utils/rules";
import { formatScore, scoreColor } from "@/utils/score";
import type { QuestionDTO } from "@/modules/questions/models/DTO/QuestionDto";
import { questionService } from "@/modules/questions/services/question.service";
import type { ActivityDetailDTO } from "../models/DTO/ActivityDto";
import type { AttemptDTO } from "../models/DTO/AttemptDto";
import { activityService } from "../services/activity.service";
import QuestionPicker from "../components/QuestionPicker.vue";

const route = useRoute();
const auth = useAuthStore();
const { run, runOne } = useApi();

const id = computed(() => String(route.params.id));

const activity = ref<ActivityDetailDTO | null>(null);
const attempts = ref<AttemptDTO[]>([]);
const loading = ref(true);

const infoForm = ref<VForm | null>(null);
const title = ref("");
const description = ref("");
const savingInfo = ref(false);

const selectedQuestions = ref<QuestionDTO[]>([]);
const savingQuestions = ref(false);

const addDialog = ref(false);
const bank = ref<QuestionDTO[]>([]);
const loadingBank = ref(false);
const toAdd = ref<string[]>([]);

const infoChanged = computed(() => !!activity.value && (title.value !== activity.value.title || description.value !== (activity.value.description ?? "")));
const questionsChanged = computed(() => {
  const original = activity.value?.questions.map((question) => question.id) ?? [];
  const current = selectedQuestions.value.map((question) => question.id);
  return original.length !== current.length || original.some((qid, index) => qid !== current[index]);
});

useLeaveGuard(
  () => questionsChanged.value || infoChanged.value,
  "Há alterações não salvas nesta atividade. Deseja sair mesmo assim?",
);

const notIncluded = computed(() => bank.value.filter((question) => !selectedQuestions.value.some((item) => item.id === question.id)));

// a API devolve as tentativas da mais recente para a mais antiga
const chronological = computed(() => [...attempts.value].reverse());
const chartLabels = computed(() => chronological.value.map((_, index) => `#${index + 1}`));
const chartValues = computed(() => chronological.value.map((attempt) => attempt.score));
const chartTitles = computed(() => chronological.value.map((attempt) => formatDateTime(attempt.finishedAt)));

const applyActivity = (data: ActivityDetailDTO) => {
  activity.value = data;
  title.value = data.title;
  description.value = data.description ?? "";
  selectedQuestions.value = [...data.questions];
};

const load = async () => {
  loading.value = true;
  try {
    const [detail, history] = await Promise.all([
      runOne(activityService.findById(id.value)),
      run(activityService.attempts(id.value)),
    ]);
    if (detail) applyActivity(detail);
    attempts.value = history ?? [];
  } finally {
    loading.value = false;
  }
};

const saveInfo = async () => {
  if (!infoForm.value || !activity.value) return;
  const { valid } = await infoForm.value.validate();
  if (!valid) return;
  savingInfo.value = true;
  try {
    const updated = await runOne(
      activityService.update(activity.value.id, { title: title.value.trim(), description: description.value.trim() || null }),
      "Dados salvos.",
    );
    if (updated) {
      const keepQuestions = selectedQuestions.value;
      applyActivity(updated);
      selectedQuestions.value = keepQuestions;
    }
  } finally {
    savingInfo.value = false;
  }
};

const move = (index: number, direction: number) => {
  const list = [...selectedQuestions.value];
  const target = index + direction;
  const [item] = list.splice(index, 1);
  if (!item) return;
  list.splice(target, 0, item);
  selectedQuestions.value = list;
};

const removeQuestion = (index: number) => {
  selectedQuestions.value = selectedQuestions.value.filter((_, position) => position !== index);
};

const resetQuestions = () => {
  selectedQuestions.value = [...(activity.value?.questions ?? [])];
};

const saveQuestions = async () => {
  if (!activity.value) return;
  savingQuestions.value = true;
  try {
    const updated = await runOne(
      activityService.setQuestions(activity.value.id, selectedQuestions.value.map((question) => question.id)),
      "Questões salvas.",
    );
    if (updated) applyActivity(updated);
  } finally {
    savingQuestions.value = false;
  }
};

const openAdd = async () => {
  if (!activity.value) return;
  toAdd.value = [];
  addDialog.value = true;
  loadingBank.value = true;
  try {
    const { courseId, moduleId, disciplineId } = activity.value;
    const scope = disciplineId ? { disciplineId } : moduleId ? { moduleId } : courseId ? { courseId } : {};
    bank.value = (await run(questionService.listByUser(auth.userId, scope))) ?? [];
  } finally {
    loadingBank.value = false;
  }
};

const confirmAdd = () => {
  const added = notIncluded.value.filter((question) => toAdd.value.includes(question.id));
  selectedQuestions.value = [...selectedQuestions.value, ...added];
  addDialog.value = false;
};

onMounted(load);
</script>
