<template>
  <div>
    <PageHeader title="Banco de questões" subtitle="Cadastre questões e use-as para montar suas atividades avaliativas">
      <template #actions>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">Nova questão</v-btn>
      </template>
    </PageHeader>

    <v-card class="mb-4">
      <v-card-text>
        <v-row density="compact">
          <v-col cols="12" md="9">
            <ScopeSelect v-model="filterScope" />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="search"
              label="Buscar no enunciado"
              prepend-inner-icon="mdi-magnify"
              clearable
              hide-details
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <div v-if="loading" class="d-flex justify-center pa-8">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <EmptyState
      v-else-if="questions.length === 0"
      icon="mdi-help-box-multiple-outline"
      :title="hasFilter ? 'Nenhuma questão encontrada' : 'Nenhuma questão cadastrada'"
      :text="hasFilter ? 'Tente outro filtro.' : 'Crie questões vinculadas aos seus cursos, módulos ou disciplinas.'"
    >
      <v-btn v-if="!hasFilter" color="primary" prepend-icon="mdi-plus" @click="openCreate">Criar primeira questão</v-btn>
    </EmptyState>

    <template v-else>
      <div class="text-body-small text-medium-emphasis mb-2">{{ questions.length }} questão(ões)</div>
      <v-expansion-panels variant="accordion" multiple>
        <v-expansion-panel v-for="question in questions" :key="question.id">
          <v-expansion-panel-title>
            <div class="d-flex flex-column ga-1 flex-grow-1 mr-2" style="min-width: 0">
              <div class="text-body-large text-truncate">{{ question.statement }}</div>
              <div class="d-flex flex-wrap align-center ga-2">
                <v-chip size="x-small" variant="tonal" :color="question.type === 'TRUE_FALSE' ? 'secondary' : 'primary'">
                  {{ questionTypeLabels[question.type] }}
                </v-chip>
                <ScopeLabel :scope="question" />
              </div>
            </div>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <p class="text-body-medium pre-wrap mb-3">{{ question.statement }}</p>
            <v-list density="compact" class="mb-2 pa-0" bg-color="transparent">
              <v-list-item
                v-for="(option, index) in question.options"
                :key="option.id"
                :class="{ 'correct-option': option.isCorrect }"
                rounded="lg"
              >
                <template #prepend>
                  <v-icon
                    :icon="option.isCorrect ? 'mdi-check-circle' : 'mdi-circle-outline'"
                    :color="option.isCorrect ? 'success' : 'medium-emphasis'"
                    size="20"
                  />
                </template>
                <v-list-item-title class="text-wrap">
                  <strong>{{ String.fromCharCode(65 + index) }})</strong> {{ option.text }}
                </v-list-item-title>
              </v-list-item>
            </v-list>
            <v-alert v-if="question.explanation" type="info" variant="tonal" density="compact" icon="mdi-lightbulb-outline" class="mb-3 pre-wrap">
              {{ question.explanation }}
            </v-alert>
            <div class="d-flex justify-end ga-2">
              <v-btn variant="text" prepend-icon="mdi-pencil-outline" @click="openEdit(question)">Editar</v-btn>
              <v-btn variant="text" color="error" prepend-icon="mdi-delete-outline" @click="remove(question)">Excluir</v-btn>
            </div>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </template>

    <QuestionFormDialog v-model="dialog" :question="editing" :default-scope="filterScope" @saved="load" />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import PageHeader from "@/components/PageHeader.vue";
import EmptyState from "@/components/EmptyState.vue";
import ScopeSelect from "@/components/ScopeSelect.vue";
import ScopeLabel from "@/components/ScopeLabel.vue";
import { useApi } from "@/composables/useApi";
import { useAuthStore } from "@/modules/auth/stores/auth.store";
import { useConfirmStore } from "@/stores/confirm.store";
import type { Scope } from "@/modules/courses/models/interfaces/Scope.interface";
import { useLatest } from "@/composables/useLatest";
import { questionTypeLabels } from "../models/constants/question.constants";
import type { QuestionDTO } from "../models/DTO/QuestionDto";
import { questionService } from "../services/question.service";
import QuestionFormDialog from "../components/QuestionFormDialog.vue";

const auth = useAuthStore();
const confirm = useConfirmStore();
const { run } = useApi();
const latest = useLatest();

const questions = ref<QuestionDTO[]>([]);
const loading = ref(false);
const filterScope = ref<Scope>({});
const search = ref<string | null>("");
const dialog = ref(false);
const editing = ref<QuestionDTO | null>(null);

const hasFilter = computed(() => !!(search.value || filterScope.value.courseId || filterScope.value.moduleId || filterScope.value.disciplineId));

const load = async () => {
  if (!auth.userId) return;
  const request = latest.next();
  loading.value = true;
  try {
    const data = await run(questionService.listByUser(auth.userId, { ...filterScope.value, search: search.value?.trim() || undefined }));
    if (latest.isLatest(request)) questions.value = data ?? [];
  } finally {
    if (latest.isLatest(request)) loading.value = false;
  }
};

let timeout: ReturnType<typeof setTimeout> | undefined;
watch(search, () => {
  clearTimeout(timeout);
  timeout = setTimeout(load, 400);
});
watch(filterScope, load, { deep: true });

const openCreate = () => {
  editing.value = null;
  dialog.value = true;
};

const openEdit = (question: QuestionDTO) => {
  editing.value = question;
  dialog.value = true;
};

const remove = async (question: QuestionDTO) => {
  const ok = await confirm.ask({
    title: "Excluir questão",
    message: "A questão será removida do banco e das atividades em que aparece. Deseja continuar?",
    confirmText: "Excluir",
  });
  if (!ok) return;
  const result = await run(questionService.remove(question.id), "Questão excluída.");
  if (result) await load();
};

onMounted(load);

onBeforeUnmount(() => clearTimeout(timeout));
</script>

<style scoped>
.correct-option {
  background: rgba(var(--v-theme-success), 0.1);
}
</style>
