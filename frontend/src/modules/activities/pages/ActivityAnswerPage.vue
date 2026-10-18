<template>
  <div>
    <div v-if="loading" class="d-flex justify-center pa-8">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <EmptyState v-else-if="!activity" icon="mdi-alert-circle-outline" title="Não foi possível abrir a atividade">
      <v-btn :to="{ name: routeProps.activities.name }">Voltar para as atividades</v-btn>
    </EmptyState>

    <template v-else>
      <PageHeader :title="activity.title" :subtitle="activity.description ?? undefined" :back="{ name: routeProps.activityDetail.name, params: { id: activity.id } }" />

      <v-row>
        <v-col cols="12" md="8">
          <v-card>
            <v-card-text class="pb-0">
              <div class="d-flex justify-space-between text-body-small text-medium-emphasis mb-1">
                <span>Questão {{ current + 1 }} de {{ total }}</span>
                <span>{{ answeredCount }} respondida(s)</span>
              </div>
              <v-progress-linear :model-value="((current + 1) / total) * 100" color="primary" rounded height="6" />
            </v-card-text>

            <v-window v-model="current">
              <v-window-item v-for="(question, index) in activity.questions" :key="question.id" :value="index">
                <v-card-text>
                  <div class="text-title-medium pre-wrap mb-4">{{ question.statement }}</div>
                  <v-radio-group v-model="answers[question.id]" hide-details>
                    <v-radio
                      v-for="(option, optionIndex) in question.options"
                      :key="option.id"
                      :value="option.id"
                      color="primary"
                      class="option mb-2"
                      :class="{ 'option--selected': answers[question.id] === option.id }"
                    >
                      <template #label>
                        <span class="text-body-large"><strong>{{ String.fromCharCode(65 + optionIndex) }})</strong> {{ option.text }}</span>
                      </template>
                    </v-radio>
                  </v-radio-group>
                </v-card-text>
              </v-window-item>
            </v-window>

            <v-card-actions class="px-4 pb-4">
              <v-btn variant="text" prepend-icon="mdi-chevron-left" :disabled="current === 0" @click="current--">Anterior</v-btn>
              <v-btn v-if="currentAnswered" variant="text" size="small" @click="clearCurrent">Limpar resposta</v-btn>
              <v-spacer />
              <v-btn v-if="current < total - 1" color="primary" variant="tonal" append-icon="mdi-chevron-right" @click="current++">Próxima</v-btn>
              <v-btn v-else color="primary" variant="flat" prepend-icon="mdi-send" :loading="submitting" @click="submit">Finalizar</v-btn>
            </v-card-actions>
          </v-card>
        </v-col>

        <v-col cols="12" md="4">
          <v-card>
            <v-card-title class="text-title-medium pt-4 px-4">Mapa de questões</v-card-title>
            <v-card-text>
              <div class="d-flex flex-wrap ga-2 mb-4">
                <v-btn
                  v-for="(question, index) in activity.questions"
                  :key="question.id"
                  size="small"
                  min-width="40"
                  :variant="index === current ? 'flat' : 'tonal'"
                  :color="answers[question.id] ? 'success' : index === current ? 'primary' : undefined"
                  @click="current = index"
                >
                  {{ index + 1 }}
                </v-btn>
              </div>
              <div class="text-body-small text-medium-emphasis mb-1">
                <v-icon icon="mdi-timer-outline" size="16" /> Tempo: {{ formatDuration(elapsed) }}
              </div>
              <v-btn block color="primary" variant="flat" class="mt-3" :loading="submitting" @click="submit">Enviar respostas</v-btn>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import PageHeader from "@/components/PageHeader.vue";
import EmptyState from "@/components/EmptyState.vue";
import { useApi } from "@/composables/useApi";
import { useConfirmStore } from "@/stores/confirm.store";
import { routeProps } from "@/router/RouteProps";
import { formatDuration } from "@/utils/date";
import type { ActivityForAnswering } from "../models/activity.model";
import { activityService } from "../services/activity.service";

const route = useRoute();
const router = useRouter();
const confirm = useConfirmStore();
const { runOne } = useApi();

const activity = ref<ActivityForAnswering | null>(null);
const loading = ref(true);
const submitting = ref(false);
const current = ref(0);
const answers = reactive<Record<string, string | null>>({});
const startedAt = ref(new Date());
const now = ref(Date.now());
let ticker: ReturnType<typeof setInterval> | undefined;

const total = computed(() => activity.value?.questions.length ?? 0);
const answeredCount = computed(() => Object.values(answers).filter(Boolean).length);
const currentAnswered = computed(() => {
  const question = activity.value?.questions[current.value];
  return !!question && !!answers[question.id];
});
const elapsed = computed(() => Math.floor((now.value - startedAt.value.getTime()) / 1000));

const clearCurrent = () => {
  const question = activity.value?.questions[current.value];
  if (question) answers[question.id] = null;
};

const submit = async () => {
  if (!activity.value || submitting.value) return;

  const missing = total.value - answeredCount.value;
  const ok = await confirm.ask({
    title: "Enviar respostas",
    message: missing > 0
      ? `Você deixou ${missing} questão(ões) sem resposta. Elas serão consideradas erradas. Deseja enviar mesmo assim?`
      : "Deseja enviar suas respostas para correção?",
    confirmText: "Enviar",
    color: "primary",
  });
  if (!ok) return;

  submitting.value = true;
  try {
    const attempt = await runOne(activityService.submit(activity.value.id, {
      startedAt: startedAt.value.toISOString(),
      answers: activity.value.questions.map((question) => ({ questionId: question.id, optionId: answers[question.id] ?? null })),
    }), "Respostas enviadas!");
    if (attempt) router.replace({ name: routeProps.attemptResult.name, params: { id: attempt.id } });
  } finally {
    submitting.value = false;
  }
};

onMounted(async () => {
  try {
    activity.value = await runOne(activityService.forAnswering(String(route.params.id)));
    activity.value?.questions.forEach((question) => { answers[question.id] = null; });
    startedAt.value = new Date();
    ticker = setInterval(() => { now.value = Date.now(); }, 1000);
  } finally {
    loading.value = false;
  }
});

onBeforeUnmount(() => clearInterval(ticker));
</script>

<style scoped>
.option {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 10px;
  padding: 6px 8px;
}

.option--selected {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.08);
}
</style>
