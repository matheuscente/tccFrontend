<template>
  <div>
    <PageHeader title="Atividades avaliativas" subtitle="Monte provas e exercícios de revisão com as questões do seu banco">
      <template #actions>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">Nova atividade</v-btn>
      </template>
    </PageHeader>

    <div v-if="loading" class="d-flex justify-center pa-8">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <EmptyState
      v-else-if="activities.length === 0"
      icon="mdi-clipboard-check-outline"
      title="Nenhuma atividade criada"
      text="Crie uma atividade para avaliar um curso, módulo ou disciplina."
    >
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">Criar atividade</v-btn>
    </EmptyState>

    <v-row v-else>
      <v-col v-for="activity in activities" :key="activity.id" cols="12" sm="6" lg="4">
        <v-card class="h-100 d-flex flex-column">
          <v-card-item>
            <v-card-title class="text-title-medium text-wrap">{{ activity.title }}</v-card-title>
            <v-card-subtitle class="mt-1"><ScopeLabel :scope="activity" /></v-card-subtitle>
          </v-card-item>
          <v-card-text class="flex-grow-1">
            <p v-if="activity.description" class="text-body-medium text-medium-emphasis mb-3 description">{{ activity.description }}</p>
            <div class="d-flex flex-wrap ga-2">
              <v-chip size="small" variant="tonal" prepend-icon="mdi-help-circle-outline">{{ activity.questionCount }} questões</v-chip>
              <v-chip size="small" variant="tonal" prepend-icon="mdi-history">{{ activity.attemptCount }} tentativas</v-chip>
              <v-chip v-if="activity.bestScore !== null" size="small" variant="tonal" :color="scoreColor(activity.bestScore)" prepend-icon="mdi-trophy-outline">
                Melhor: {{ formatScore(activity.bestScore) }}
              </v-chip>
              <v-chip v-if="activity.lastScore !== null" size="small" variant="tonal" :color="scoreColor(activity.lastScore)">
                Última: {{ formatScore(activity.lastScore) }}
              </v-chip>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-btn
              color="primary"
              variant="flat"
              prepend-icon="mdi-play"
              :disabled="activity.questionCount === 0"
              :to="{ name: routeProps.activityAnswer.name, params: { id: activity.id } }"
            >
              Responder
            </v-btn>
            <v-btn variant="text" :to="{ name: routeProps.activityDetail.name, params: { id: activity.id } }">Gerenciar</v-btn>
            <v-spacer />
            <v-btn icon="mdi-delete-outline" variant="text" color="error" aria-label="Excluir atividade" @click="remove(activity)" />
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="dialog" max-width="760" scrollable persistent>
      <v-card>
        <v-card-title class="text-title-large pt-5 px-6">Nova atividade</v-card-title>
        <v-card-text class="px-6">
          <v-form ref="form" @submit.prevent="create">
            <v-text-field
              v-model="title"
              label="Título"
              :rules="[required('Título'), minLength(3, 'Título'), maxLength(150, 'Título')]"
              class="mb-2"
            />
            <v-textarea
              v-model="description"
              label="Descrição (opcional)"
              rows="2"
              auto-grow
              :rules="[maxLength(1000, 'Descrição')]"
              class="mb-2"
            />
            <ScopeSelect
              v-model="scope"
              required
              label="O que esta atividade avalia?"
              hint="Somente questões deste escopo (e dos módulos/disciplinas dentro dele) podem ser usadas."
              class="mb-4"
            />

            <div class="text-label-large mb-2">Questões</div>
            <QuestionPicker
              v-model="selected"
              :questions="available"
              :loading="loadingQuestions"
              :empty-text="hasScope ? 'Nenhuma questão neste escopo. Você pode criar a atividade e adicionar questões depois.' : 'Escolha o curso, módulo ou disciplina para ver as questões disponíveis.'"
            />

            <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mt-4 pre-line">{{ error }}</v-alert>
          </v-form>
        </v-card-text>
        <v-card-actions class="px-6 pb-4">
          <v-spacer />
          <v-btn variant="text" @click="dialog = false">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" :loading="saving" @click="create">Criar atividade</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import type { VForm } from "vuetify/components";
import PageHeader from "@/components/PageHeader.vue";
import EmptyState from "@/components/EmptyState.vue";
import ScopeSelect from "@/components/ScopeSelect.vue";
import ScopeLabel from "@/components/ScopeLabel.vue";
import { useApi } from "@/composables/useApi";
import { useAuthStore } from "@/modules/auth/stores/auth.store";
import { useConfirmStore } from "@/stores/confirm.store";
import { useNotifyStore } from "@/stores/notify.store";
import { isError } from "@/services/api/isError.typeGuard";
import { firstErrorMessage } from "@/utils/apiErrors";
import { maxLength, minLength, required } from "@/utils/rules";
import { routeProps } from "@/router/RouteProps";
import type { Scope } from "@/modules/courses/models/structure.model";
import type { Question } from "@/modules/questions/models/question.model";
import { questionService } from "@/modules/questions/services/question.service";
import type { Activity } from "../models/activity.model";
import { activityService } from "../services/activity.service";
import QuestionPicker from "../components/QuestionPicker.vue";
import { formatScore, scoreColor } from "../components/scoreColor";

const auth = useAuthStore();
const confirm = useConfirmStore();
const notify = useNotifyStore();
const router = useRouter();
const { run } = useApi();

const activities = ref<Activity[]>([]);
const loading = ref(false);

const dialog = ref(false);
const form = ref<VForm | null>(null);
const title = ref("");
const description = ref("");
const scope = ref<Scope>({});
const selected = ref<string[]>([]);
const available = ref<Question[]>([]);
const loadingQuestions = ref(false);
const saving = ref(false);
const error = ref<string>();

const hasScope = computed(() => !!(scope.value.courseId || scope.value.moduleId || scope.value.disciplineId));

const load = async () => {
  if (!auth.userId) return;
  loading.value = true;
  try {
    activities.value = (await run(activityService.listByUser(auth.userId))) ?? [];
  } finally {
    loading.value = false;
  }
};

watch(scope, async () => {
  selected.value = [];
  available.value = [];
  if (!hasScope.value) return;
  loadingQuestions.value = true;
  try {
    available.value = (await run(questionService.listByUser(auth.userId, scope.value))) ?? [];
  } finally {
    loadingQuestions.value = false;
  }
}, { deep: true });

const openCreate = () => {
  title.value = "";
  description.value = "";
  scope.value = {};
  selected.value = [];
  available.value = [];
  error.value = undefined;
  dialog.value = true;
};

const create = async () => {
  if (!form.value) return;
  error.value = undefined;
  const { valid } = await form.value.validate();
  if (!valid) return;

  saving.value = true;
  try {
    // mantém a ordem em que as questões aparecem na lista
    const questionIds = available.value.filter((question) => selected.value.includes(question.id)).map((question) => question.id);
    const response = await activityService.create({
      title: title.value.trim(),
      description: description.value.trim() || null,
      questionIds,
      ...scope.value,
    });
    if (isError(response)) {
      error.value = firstErrorMessage(response);
      return;
    }
    notify.success("Atividade criada.");
    dialog.value = false;
    const created = response.data[0];
    if (created && created.questionCount === 0) {
      router.push({ name: routeProps.activityDetail.name, params: { id: created.id } });
      return;
    }
    await load();
  } finally {
    saving.value = false;
  }
};

const remove = async (activity: Activity) => {
  const ok = await confirm.ask({
    title: "Excluir atividade",
    message: `Excluir "${activity.title}"? O histórico de tentativas também deixará de aparecer.`,
    confirmText: "Excluir",
  });
  if (!ok) return;
  if (await run(activityService.remove(activity.id), "Atividade excluída.")) await load();
};

onMounted(load);
</script>

<style scoped>
.description {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
