<template>
  <div>
    <PageHeader title="Metas de estudo" subtitle="Defina objetivos de tempo e acompanhe o seu progresso">
      <template #actions>
        <v-btn color="primary" prepend-icon="mdi-plus" :disabled="!structure.courses.length" @click="openCreate">Nova meta</v-btn>
      </template>
    </PageHeader>

    <v-alert v-if="!structure.loading && !structure.courses.length" type="info" variant="tonal" class="mb-6">
      As metas são vinculadas a um curso, módulo ou disciplina.
      <router-link :to="{ name: routeProps.courses.name }" class="font-weight-medium">Cadastre um curso</router-link> para começar.
    </v-alert>

    <v-chip-group v-model="statusFilter" mandatory selected-class="text-primary" class="mb-4">
      <v-chip v-for="option in filterOptions" :key="option.value" :value="option.value" variant="tonal" filter>
        {{ option.label }} ({{ countByStatus(option.value) }})
      </v-chip>
    </v-chip-group>

    <v-row v-if="loading">
      <v-col v-for="n in 3" :key="n" cols="12" md="6" lg="4"><v-skeleton-loader type="card" /></v-col>
    </v-row>

    <EmptyState
      v-else-if="!items.length"
      icon="mdi-flag-checkered"
      title="Nenhuma meta cadastrada"
      text="Crie metas diárias, recorrentes ou de tempo total para manter o ritmo dos estudos."
    >
      <v-btn v-if="structure.courses.length" color="primary" prepend-icon="mdi-plus" @click="openCreate">Criar meta</v-btn>
    </EmptyState>

    <div v-else-if="!filtered.length" class="text-body-medium text-medium-emphasis">Nenhuma meta com este status.</div>

    <v-row v-else>
      <v-col v-for="item in filtered" :key="item.goal.id" cols="12" md="6" lg="4">
        <v-card class="h-100 d-flex flex-column">
          <v-card-item>
            <v-card-title class="text-title-medium text-wrap">{{ item.goal.title }}</v-card-title>
            <v-card-subtitle>{{ goalTypeLabels[item.goal.type] }}</v-card-subtitle>
            <template #append>
              <v-menu location="bottom end">
                <template #activator="{ props: menuProps }">
                  <v-btn v-bind="menuProps" icon="mdi-dots-vertical" variant="text" size="small" aria-label="Ações" />
                </template>
                <v-list density="compact">
                  <v-list-item prepend-icon="mdi-pencil-outline" title="Editar" @click="openEdit(item.goal)" />
                  <v-list-item prepend-icon="mdi-delete-outline" title="Excluir" base-color="error" @click="remove(item.goal)" />
                </v-list>
              </v-menu>
            </template>
          </v-card-item>

          <v-card-text class="flex-grow-1">
            <ScopeLabel :scope="item.goal" class="mb-3 d-block" />

            <div class="d-flex justify-space-between align-end mb-1">
              <span class="text-body-medium">
                <strong>{{ formatMinutes(item.progress?.studiedMinutes ?? 0) }}</strong>
                <span class="text-medium-emphasis"> de {{ formatMinutes(item.goal.targetMinutes) }}{{ item.goal.type === "DAILY_RECURRING" ? " hoje" : "" }}</span>
              </span>
              <span class="text-label-large">{{ item.progress?.percent ?? 0 }}%</span>
            </div>
            <v-progress-linear
              :model-value="item.progress?.percent ?? 0"
              :color="statusInfo(item).color === 'grey' ? 'primary' : statusInfo(item).color"
              height="10"
              rounded
            />

            <div v-if="item.progress?.totalDays" class="text-body-small text-medium-emphasis mt-2">
              Meta cumprida em {{ item.progress.daysAchieved }} de {{ item.progress.totalDays }} dia(s)
            </div>

            <div class="d-flex flex-wrap align-center ga-2 mt-4">
              <v-chip size="small" :color="statusInfo(item).color" variant="flat">{{ statusInfo(item).label }}</v-chip>
              <span class="text-body-small text-medium-emphasis">
                <v-icon icon="mdi-calendar-outline" size="14" />
                {{ formatDay(item.goal.startDate) }}<template v-if="item.goal.endDate"> até {{ formatDay(item.goal.endDate) }}</template>
              </span>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <GoalFormDialog v-model="dialog" :goal="editing" @saved="onSaved" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import PageHeader from "@/components/PageHeader.vue";
import EmptyState from "@/components/EmptyState.vue";
import ScopeLabel from "@/components/ScopeLabel.vue";
import GoalFormDialog from "../components/GoalFormDialog.vue";
import { goalService } from "../services/goal.service";
import { goalStatusInfo, goalTypeLabels, type Goal, type GoalProgress, type GoalProgressStatus } from "../models/goal.model";
import { useStructureStore } from "@/stores/structure.store";
import { useAuthStore } from "@/modules/auth/stores/auth.store";
import { useConfirmStore } from "@/stores/confirm.store";
import { useNotifyStore } from "@/stores/notify.store";
import { useApi } from "@/composables/useApi";
import { routeProps } from "@/router/RouteProps";
import { formatDay, formatMinutes } from "@/utils/date";

interface GoalItem { goal: Goal, progress: GoalProgress | undefined }

const structure = useStructureStore();
const auth = useAuthStore();
const confirm = useConfirmStore();
const notify = useNotifyStore();
const { run } = useApi();

const loading = ref(true);
const items = ref<GoalItem[]>([]);
const statusFilter = ref<"ALL" | GoalProgressStatus>("ALL");
const dialog = ref(false);
const editing = ref<Goal | null>(null);

const filterOptions: { value: "ALL" | GoalProgressStatus, label: string }[] = [
  { value: "ALL", label: "Todas" },
  { value: "IN_PROGRESS", label: "Em andamento" },
  { value: "ACHIEVED", label: "Concluídas" },
  { value: "EXPIRED", label: "Não atingidas" },
  { value: "NOT_STARTED", label: "Não iniciadas" },
];

const statusOf = (item: GoalItem): GoalProgressStatus => item.progress?.status ?? "IN_PROGRESS";
const statusInfo = (item: GoalItem) => goalStatusInfo[statusOf(item)];

const countByStatus = (value: "ALL" | GoalProgressStatus) =>
  value === "ALL" ? items.value.length : items.value.filter((item) => statusOf(item) === value).length;

const filtered = computed(() =>
  statusFilter.value === "ALL" ? items.value : items.value.filter((item) => statusOf(item) === statusFilter.value));

const load = async () => {
  loading.value = true;
  try {
    const [goals, progress] = await Promise.all([run(goalService.listByUser(auth.userId)), run(goalService.progress())]);
    const progressById = new Map((progress ?? []).map((entry) => [entry.goalId, entry]));
    items.value = (goals ?? []).map((goal) => ({ goal, progress: progressById.get(goal.id) }));
  } finally {
    loading.value = false;
  }
};

const openCreate = () => {
  editing.value = null;
  dialog.value = true;
};

const openEdit = (goal: Goal) => {
  editing.value = goal;
  dialog.value = true;
};

const onSaved = async () => {
  notify.success(editing.value ? "Meta atualizada." : "Meta criada.");
  await load();
};

const remove = async (goal: Goal) => {
  const ok = await confirm.ask({ title: "Excluir meta", message: `Excluir a meta "${goal.title}"?`, confirmText: "Excluir" });
  if (!ok) return;
  if (await run(goalService.remove(goal.id), "Meta excluída.")) await load();
};

onMounted(async () => {
  await structure.load(auth.userId);
  await load();
});
</script>
