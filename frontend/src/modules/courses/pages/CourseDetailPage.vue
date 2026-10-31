<template>
  <div>
    <v-skeleton-loader v-if="loading" type="heading, paragraph, list-item-two-line@3" />

    <EmptyState
      v-else-if="!course || !current"
      icon="mdi-school-outline"
      title="Conteúdo não encontrado"
      text="Ele pode ter sido excluído."
    >
      <v-btn color="primary" :to="{ name: routeProps.courses.name }">Voltar para cursos</v-btn>
    </EmptyState>

    <template v-else>
      <v-breadcrumbs :items="breadcrumbs" density="compact" class="px-0 pt-0 pb-2 text-body-medium">
        <template #divider><v-icon icon="mdi-chevron-right" size="16" /></template>
      </v-breadcrumbs>

      <div class="d-flex flex-wrap align-center ga-3 mb-6">
        <v-avatar :color="levelInfo.color" variant="tonal" size="48" rounded="lg">
          <v-icon :icon="levelInfo.icon" />
        </v-avatar>
        <div class="flex-grow-1" style="min-width: 0">
          <div class="text-label-large text-medium-emphasis">{{ levelInfo.label }}</div>
          <h1 class="text-headline-small font-weight-bold">{{ current.title }}</h1>
          <p v-if="current.description" class="text-body-medium text-medium-emphasis mt-1">{{ current.description }}</p>
        </div>
        <div class="d-flex flex-wrap ga-2">
          <v-btn
            v-if="studyingHere"
            color="success"
            variant="flat"
            prepend-icon="mdi-stop"
            :loading="finishing"
            @click="finishStudy"
          >
            Finalizar estudo · {{ formatDuration(timer.elapsedSeconds) }}
          </v-btn>
          <v-btn v-else variant="tonal" prepend-icon="mdi-timer-outline" :loading="starting === scopeKey" @click="study(scope, scopeKey)">
            Cronômetro
          </v-btn>
          <v-btn color="primary" variant="flat" prepend-icon="mdi-book-open-page-variant-outline" :to="readerRoute(scope) ?? undefined">
            Estudar
          </v-btn>
          <v-menu location="bottom end">
            <template #activator="{ props: menuProps }">
              <v-btn v-bind="menuProps" variant="tonal" icon="mdi-dots-vertical" :aria-label="`Ações de ${current.title}`" />
            </template>
            <v-list density="compact">
              <v-list-item prepend-icon="mdi-pencil-outline" :title="`Editar ${levelInfo.label.toLowerCase()}`" @click="openEditCurrent" />
              <v-list-item v-if="level === 'course'" prepend-icon="mdi-folder-plus-outline" title="Novo módulo" @click="openModule(null)" />
              <v-list-item v-if="level === 'module'" prepend-icon="mdi-book-plus-outline" title="Nova disciplina" @click="openDiscipline(moduleId!, null)" />
              <v-list-item prepend-icon="mdi-delete-outline" :title="`Excluir ${levelInfo.label.toLowerCase()}`" base-color="error" @click="removeCurrent" />
            </v-list>
          </v-menu>
        </div>
      </div>

      <v-row>
        <v-col cols="12" md="4" lg="3">
          <v-expansion-panels v-if="smAndDown" class="mb-2">
            <v-expansion-panel title="Navegar no curso">
              <v-expansion-panel-text class="tree-mobile">
                <CourseTreeNav :course-id="courseId" :module-id="moduleId" :discipline-id="disciplineId" :tab="tab" @add-module="openModule(null)" @add-discipline="openDiscipline($event, null)" />
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
          <CourseTreeNav v-else :course-id="courseId" :module-id="moduleId" :discipline-id="disciplineId" :tab="tab" class="tree" @add-module="openModule(null)" @add-discipline="openDiscipline($event, null)" />
        </v-col>

        <v-col cols="12" md="8" lg="9">
          <v-tabs v-model="tab" color="primary" show-arrows class="mb-4">
            <v-tab v-for="item in hubTabs" :key="item.value" :value="item.value" min-width="0" class="px-3">
              {{ item.title }}
              <span v-if="item.value !== 'overview' && !content.state.loading" class="text-medium-emphasis ml-1">{{ content.counts.value[item.value] ?? 0 }}</span>
            </v-tab>
          </v-tabs>

          <ScopeOverview
            v-if="tab === 'overview'"
            :loading="content.state.loading"
            :counts="content.counts.value"
            :children="children"
            :child-label="childLabel"
            :add-child-label="level === 'course' ? 'Módulo' : 'Disciplina'"
            :empty-child-text="level === 'course' ? 'Divida o curso em módulos (ex.: semestres, unidades).' : 'Cadastre as disciplinas deste módulo.'"
            :goals="content.state.goals"
            :files="content.state.files"
            :notes="content.state.notes"
            :summary="content.state.summary"
            :performance="content.state.performance"
            @open-tab="tab = $event"
            @study="(childScope) => router.push(readerRoute(childScope) ?? {})"
            @add-child="level === 'course' ? openModule(null) : openDiscipline(moduleId!, null)"
          />
          <FilesPanel v-else-if="tab === 'files'" :scope="scope" @changed="content.load" />
          <NotesPanel v-else-if="tab === 'notes'" :scope="scope" @changed="content.load" />
          <QuestionsPanel v-else-if="tab === 'questions'" :scope="scope" @changed="content.load" />
          <ActivitiesPanel v-else-if="tab === 'activities'" :scope="scope" @changed="content.load" />
          <GoalsPanel v-else-if="tab === 'goals'" :scope="scope" @changed="content.load" />
          <StudySessionsPanel v-else :scope="scope" @changed="content.load" />
        </v-col>
      </v-row>
    </template>

    <TitledFormDialog
      v-model="dialog.open"
      :title="dialog.title"
      :initial="dialog.initial"
      :min-title="dialog.minTitle"
      :min-description="dialog.minDescription"
      :allow-clear-description="dialog.allowClearDescription"
      :save="dialog.save"
      @saved="onSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter, type RouteLocationRaw } from "vue-router";
import { useDisplay } from "vuetify";
import EmptyState from "@/components/EmptyState.vue";
import TitledFormDialog from "../components/TitledFormDialog.vue";
import CourseTreeNav from "../components/CourseTreeNav.vue";
import ScopeOverview from "../components/ScopeOverview.vue";
import FilesPanel from "@/modules/files/components/FilesPanel.vue";
import NotesPanel from "@/modules/notes/components/NotesPanel.vue";
import QuestionsPanel from "@/modules/questions/components/QuestionsPanel.vue";
import ActivitiesPanel from "@/modules/activities/components/ActivitiesPanel.vue";
import GoalsPanel from "@/modules/goals/components/GoalsPanel.vue";
import StudySessionsPanel from "@/modules/study/components/StudySessionsPanel.vue";
import { useStructureStore } from "@/stores/structure.store";
import { useAuthStore } from "@/modules/auth/stores/auth.store";
import { useConfirmStore } from "@/stores/confirm.store";
import { useNotifyStore } from "@/stores/notify.store";
import { useTimerStore } from "@/modules/study/stores/timer.store";
import { useApi } from "@/composables/useApi";
import { useScopeContent } from "@/composables/useScopeContent";
import { useHubRoute } from "@/composables/useHubRoute";
import { useReaderRoute } from "@/composables/useReaderRoute";
import { courseService } from "../services/course.service";
import { moduleService } from "../services/module.service";
import { disciplineService } from "../services/discipline.service";
import { hubTabs } from "../models/constants/hub.constants";
import type { DisciplineDTO } from "../models/DTO/DisciplineDto";
import type { ModuleDTO } from "../models/DTO/ModuleDto";
import type { TitledInputDTO } from "../models/DTO/TitledInputDto";
import type { Scope } from "../models/interfaces/Scope.interface";
import type { OverviewChild } from "../models/interfaces/OverviewChild.interface";
import type { HubTab } from "../models/Types/HubTab";
import type { ScopeLevel } from "../models/Types/ScopeLevel";
import type { ApiResult } from "@/services/abstract/service.abstract";
import { isError } from "@/services/api/isError.typeGuard";
import { routeProps } from "@/router/RouteProps";
import { formatDuration, formatMinutes } from "@/utils/date";
import { firstErrorMessage } from "@/utils/apiErrors";
import { sameScope } from "@/utils/scope";

const route = useRoute();
const router = useRouter();
const structure = useStructureStore();
const auth = useAuthStore();
const confirm = useConfirmStore();
const notify = useNotifyStore();
const timer = useTimerStore();
const hubRoute = useHubRoute();
const readerRoute = useReaderRoute();
const { run } = useApi();
const { smAndDown } = useDisplay();

const courseId = computed(() => String(route.params.id));
const moduleId = computed(() => (route.params.moduleId ? String(route.params.moduleId) : null));
const disciplineId = computed(() => (route.params.disciplineId ? String(route.params.disciplineId) : null));

const loading = ref(true);
const starting = ref<string | null>(null);
const finishing = ref(false);

const course = computed(() => structure.courseById(courseId.value));
const module = computed(() => structure.moduleById(moduleId.value));
const discipline = computed(() => structure.disciplineById(disciplineId.value));

const level = computed<ScopeLevel>(() => (disciplineId.value ? "discipline" : moduleId.value ? "module" : "course"));
const current = computed(() => (level.value === "discipline" ? discipline.value : level.value === "module" ? module.value : course.value));

const scope = computed<Scope>(() => {
  if (disciplineId.value) return { disciplineId: disciplineId.value };
  if (moduleId.value) return { moduleId: moduleId.value };
  return { courseId: courseId.value };
});
const scopeKey = computed(() => disciplineId.value ?? moduleId.value ?? courseId.value);

const levelInfo = computed(() => ({
  course: { label: "Curso", icon: "mdi-school-outline", color: "primary" },
  module: { label: "Módulo", icon: "mdi-folder-outline", color: "primary" },
  discipline: { label: "Disciplina", icon: "mdi-book-open-variant", color: "secondary" },
})[level.value]);

const tab = computed<HubTab>({
  get: () => hubTabs.find((item) => item.value === route.query.tab)?.value ?? "overview",
  set: (value) => { void router.replace({ query: value === "overview" ? {} : { tab: value } }); },
});

const content = useScopeContent(() => scope.value);

const breadcrumbs = computed(() => {
  const items: { title: string, to?: RouteLocationRaw, disabled?: boolean }[] = [
    { title: "Cursos", to: { name: routeProps.courses.name } },
  ];
  if (course.value) items.push({ title: course.value.title, to: hubRoute({ courseId: course.value.id }) ?? undefined });
  if (module.value) items.push({ title: module.value.title, to: hubRoute({ moduleId: module.value.id }) ?? undefined });
  if (discipline.value) items.push({ title: discipline.value.title });
  const last = items[items.length - 1];
  if (last) {
    last.disabled = true;
    delete last.to;
  }
  return items;
});

const childLabel = computed(() => (level.value === "course" ? "Módulos" : level.value === "module" ? "Disciplinas" : ""));

const children = computed<OverviewChild[]>(() => {
  if (level.value === "course") {
    return structure.modulesOf(courseId.value).map((item) => ({
      id: item.id,
      title: item.title,
      subtitle: `${structure.disciplinesOf(item.id).length} disciplina(s)${item.description ? ` · ${item.description}` : ""}`,
      icon: "mdi-folder-outline",
      color: "primary",
      to: hubRoute({ moduleId: item.id }) ?? "",
      scope: { moduleId: item.id },
    }));
  }
  if (level.value === "module") {
    return structure.disciplinesOf(moduleId.value).map((item) => ({
      id: item.id,
      title: item.title,
      subtitle: item.description || "Sem descrição",
      icon: "mdi-book-open-variant",
      color: "secondary",
      to: hubRoute({ disciplineId: item.id }) ?? "",
      scope: { disciplineId: item.id },
    }));
  }
  return [];
});

const studyingHere = computed(() => !!timer.active && sameScope(
  { courseId: timer.active.courseId, moduleId: timer.active.moduleId, disciplineId: timer.active.disciplineId },
  { courseId: null, moduleId: null, disciplineId: null, ...scope.value },
));

interface DialogOptions {
  title: string
  minTitle: number
  minDescription: number
  allowClearDescription: boolean
  successMessage: string
  initial: { title: string, description: string | null } | null
  save: (data: TitledInputDTO) => Promise<ApiResult<unknown>>
  onCreated?: (id: string) => void
}

const dialog = reactive<DialogOptions & { open: boolean }>({
  open: false,
  title: "",
  minTitle: 3,
  minDescription: 3,
  allowClearDescription: false,
  successMessage: "",
  initial: null,
  save: () => Promise.resolve({ statusCode: 200, state: "success", data: [] }),
});

let createdId: string | null = null;

const openDialog = (options: DialogOptions) => {
  Object.assign(dialog, { onCreated: undefined }, options);
  dialog.open = true;
};

// guarda o id criado para abrir o novo módulo/disciplina logo depois de salvar
const capture = <T extends { id: string }>(call: Promise<ApiResult<T>>) => call.then((response) => {
  createdId = isError(response) ? null : (response.data[0]?.id ?? null);
  return response;
});

const openEditCurrent = () => {
  if (level.value === "course" && course.value) {
    openDialog({
      title: "Editar curso",
      minTitle: 5,
      minDescription: 5,
      allowClearDescription: false,
      successMessage: "Curso atualizado.",
      initial: course.value,
      save: (data) => courseService.update(courseId.value, data),
    });
  } else if (level.value === "module" && module.value) {
    openModule(module.value);
  } else if (discipline.value && moduleId.value) {
    openDiscipline(moduleId.value, discipline.value);
  }
};

const openModule = (item: ModuleDTO | null) => openDialog({
  title: item ? "Editar módulo" : "Novo módulo",
  minTitle: 3,
  minDescription: 3,
  allowClearDescription: false,
  successMessage: item ? "Módulo atualizado." : "Módulo criado.",
  initial: item,
  save: (data) => (item ? moduleService.update(item.id, data) : capture(moduleService.create(courseId.value, data))),
  ...(item ? {} : { onCreated: (id: string) => router.push(hubRoute({ moduleId: id }) ?? {}) }),
});

const openDiscipline = (parentId: string, item: DisciplineDTO | null) => openDialog({
  title: item ? "Editar disciplina" : "Nova disciplina",
  minTitle: 3,
  minDescription: 3,
  allowClearDescription: true,
  successMessage: item ? "Disciplina atualizada." : "Disciplina criada.",
  initial: item,
  save: (data) => (item ? disciplineService.update(item.id, data) : capture(disciplineService.create(parentId, data))),
  ...(item ? {} : { onCreated: (id: string) => router.push(hubRoute({ disciplineId: id }) ?? {}) }),
});

const onSaved = async () => {
  notify.success(dialog.successMessage);
  await structure.reload();
  if (dialog.onCreated && createdId) dialog.onCreated(createdId);
  createdId = null;
};

const removeCurrent = async () => {
  const target = current.value;
  if (!target) return;
  const label = levelInfo.value.label.toLowerCase();
  const ok = await confirm.ask({
    title: `Excluir ${label}`,
    message: `Excluir "${target.title}"?\n\nTudo o que estiver dentro dele (módulos, disciplinas, metas, sessões de estudo, questões e atividades) também será removido. Notas e arquivos ficam sem vínculo.`,
    confirmText: "Excluir",
  });
  if (!ok) return;

  const call = level.value === "course"
    ? courseService.remove(courseId.value)
    : level.value === "module"
      ? moduleService.remove(target.id)
      : disciplineService.remove(target.id);

  if (!(await run(call, `${levelInfo.value.label} excluído(a).`))) return;
  await structure.reload();
  const parent = level.value === "discipline"
    ? hubRoute({ moduleId: moduleId.value })
    : level.value === "module"
      ? hubRoute({ courseId: courseId.value })
      : { name: routeProps.courses.name };
  router.push(parent ?? { name: routeProps.courses.name });
};

const study = async (target: Scope, key: string) => {
  if (timer.active) {
    notify.info("Já existe uma sessão de estudo em andamento. Finalize-a antes de iniciar outra.");
    return;
  }
  starting.value = key;
  try {
    const error = await timer.start(target);
    if (error) {
      notify.error(firstErrorMessage(error));
      return;
    }
    notify.success("Cronômetro iniciado. Bons estudos!");
  } finally {
    starting.value = null;
  }
};

const finishStudy = async () => {
  finishing.value = true;
  try {
    const result = await timer.finish();
    if (isError(result)) {
      notify.error(firstErrorMessage(result));
      return;
    }
    notify.success(result ? `Sessão registrada: ${formatMinutes(result.minutes)} de estudo.` : "Sessão finalizada.");
  } finally {
    finishing.value = false;
  }
};

watch(() => timer.active?.id, (value, old) => {
  if (old && !value) void content.load();
});

onMounted(async () => {
  await structure.load(auth.userId);
  if (!current.value) await structure.reload();
  loading.value = false;
  if (current.value) await content.load();
});
</script>

<style scoped>
.tree {
  position: sticky;
  top: 80px;
}

.tree-mobile :deep(.v-expansion-panel-text__wrapper) {
  padding: 0;
}
</style>
