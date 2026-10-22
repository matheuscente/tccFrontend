<template>
  <div>
    <v-skeleton-loader v-if="loading" type="heading, paragraph, list-item-two-line@3" />

    <EmptyState
      v-else-if="!course"
      icon="mdi-school-outline"
      title="Curso não encontrado"
      text="Ele pode ter sido excluído."
    >
      <v-btn color="primary" :to="{ name: routeProps.courses.name }">Voltar para cursos</v-btn>
    </EmptyState>

    <template v-else>
      <PageHeader :title="course.title" :subtitle="course.description || 'Sem descrição'" :back="{ name: routeProps.courses.name }">
        <template #actions>
          <v-btn variant="tonal" prepend-icon="mdi-timer-outline" :loading="starting === course.id" @click="study({ courseId: course.id }, course.id)">
            Estudar agora
          </v-btn>
          <v-btn variant="tonal" prepend-icon="mdi-pencil-outline" @click="openCourseEdit">Editar</v-btn>
          <v-btn color="primary" prepend-icon="mdi-plus" @click="openModule(null)">Novo módulo</v-btn>
        </template>
      </PageHeader>

      <v-row class="mb-2">
        <v-col cols="12" sm="4">
          <StatCard label="Módulos" :value="modules.length" icon="mdi-folder-outline" />
        </v-col>
        <v-col cols="12" sm="4">
          <StatCard label="Disciplinas" :value="disciplineTotal" icon="mdi-book-open-variant" color="secondary" />
        </v-col>
        <v-col cols="12" sm="4">
          <StatCard label="Criado em" :value="formatDay(course.createdAt)" icon="mdi-calendar-outline" color="info" />
        </v-col>
      </v-row>

      <EmptyState
        v-if="!modules.length"
        icon="mdi-folder-plus-outline"
        title="Nenhum módulo neste curso"
        text="Divida o curso em módulos (ex.: semestres, unidades) e depois cadastre as disciplinas."
      >
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openModule(null)">Adicionar módulo</v-btn>
      </EmptyState>

      <v-expansion-panels v-else v-model="openPanels" multiple variant="accordion">
        <v-expansion-panel v-for="module in modules" :key="module.id" :value="module.id">
          <v-expansion-panel-title>
            <div class="d-flex align-center ga-3 flex-grow-1 mr-2">
              <v-icon icon="mdi-folder-outline" color="primary" />
              <div class="flex-grow-1">
                <div class="text-title-small font-weight-medium">{{ module.title }}</div>
                <div class="text-body-small text-medium-emphasis">
                  {{ structure.disciplinesOf(module.id).length }} disciplina(s)
                  <span v-if="module.description"> · {{ module.description }}</span>
                </div>
              </div>
            </div>
          </v-expansion-panel-title>

          <v-expansion-panel-text>
            <div class="d-flex flex-wrap ga-2 mb-3">
              <v-btn size="small" variant="tonal" color="primary" prepend-icon="mdi-plus" @click="openDiscipline(module.id, null)">Disciplina</v-btn>
              <v-btn size="small" variant="tonal" prepend-icon="mdi-timer-outline" :loading="starting === module.id" @click="study({ moduleId: module.id }, module.id)">Estudar agora</v-btn>
              <v-btn size="small" variant="text" prepend-icon="mdi-pencil-outline" @click="openModule(module)">Editar</v-btn>
              <v-btn size="small" variant="text" color="error" prepend-icon="mdi-delete-outline" @click="removeModule(module)">Excluir</v-btn>
            </div>

            <div v-if="!structure.disciplinesOf(module.id).length" class="text-body-medium text-medium-emphasis py-2">
              Nenhuma disciplina neste módulo.
            </div>

            <v-list v-else density="comfortable" class="py-0" border rounded="lg">
              <template v-for="(discipline, index) in structure.disciplinesOf(module.id)" :key="discipline.id">
                <v-divider v-if="index" />
                <v-list-item :title="discipline.title" :subtitle="discipline.description || undefined">
                  <template #prepend>
                    <v-icon icon="mdi-book-open-variant" color="secondary" />
                  </template>
                  <template #append>
                    <div class="d-flex ga-1">
                      <v-btn
                        size="small"
                        variant="tonal"
                        color="success"
                        prepend-icon="mdi-play"
                        class="d-none d-sm-flex"
                        :loading="starting === discipline.id"
                        @click="study({ disciplineId: discipline.id }, discipline.id)"
                      >
                        Estudar
                      </v-btn>
                      <v-btn
                        size="small"
                        variant="text"
                        icon="mdi-play"
                        color="success"
                        class="d-sm-none"
                        :aria-label="`Estudar ${discipline.title} agora`"
                        :loading="starting === discipline.id"
                        @click="study({ disciplineId: discipline.id }, discipline.id)"
                      />
                      <v-btn size="small" variant="text" icon="mdi-pencil-outline" :aria-label="`Editar disciplina ${discipline.title}`" @click="openDiscipline(module.id, discipline)" />
                      <v-btn size="small" variant="text" icon="mdi-delete-outline" color="error" :aria-label="`Excluir disciplina ${discipline.title}`" @click="removeDiscipline(discipline)" />
                    </div>
                  </template>
                </v-list-item>
              </template>
            </v-list>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
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
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import PageHeader from "@/components/PageHeader.vue";
import EmptyState from "@/components/EmptyState.vue";
import StatCard from "@/components/StatCard.vue";
import TitledFormDialog from "../components/TitledFormDialog.vue";
import { useStructureStore } from "@/stores/structure.store";
import { useAuthStore } from "@/modules/auth/stores/auth.store";
import { useConfirmStore } from "@/stores/confirm.store";
import { useNotifyStore } from "@/stores/notify.store";
import { useTimerStore } from "@/modules/study/stores/timer.store";
import { useApi } from "@/composables/useApi";
import { courseService } from "../services/course.service";
import { moduleService } from "../services/module.service";
import { disciplineService } from "../services/discipline.service";
import type { DisciplineDTO } from "../models/DTO/DisciplineDto";
import type { ModuleDTO } from "../models/DTO/ModuleDto";
import type { TitledInputDTO } from "../models/DTO/TitledInputDto";
import type { Scope } from "../models/interfaces/Scope.interface";
import type { ApiResult } from "@/services/abstract/service.abstract";
import { routeProps } from "@/router/RouteProps";
import { formatDay } from "@/utils/date";
import { firstErrorMessage } from "@/utils/apiErrors";

const route = useRoute();
const router = useRouter();
const structure = useStructureStore();
const auth = useAuthStore();
const confirm = useConfirmStore();
const notify = useNotifyStore();
const timer = useTimerStore();
const { run } = useApi();

const courseId = computed(() => String(route.params.id));
const loading = ref(true);
const openPanels = ref<string[]>([]);
const starting = ref<string | null>(null);

const course = computed(() => structure.courseById(courseId.value));
const modules = computed(() => structure.modulesOf(courseId.value));
const disciplineTotal = computed(() => modules.value.reduce((total, module) => total + structure.disciplinesOf(module.id).length, 0));

interface DialogOptions {
  title: string
  minTitle: number
  minDescription: number
  allowClearDescription: boolean
  successMessage: string
  initial: { title: string, description: string | null } | null
  save: (data: TitledInputDTO) => Promise<ApiResult<unknown>>
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

const openDialog = (options: DialogOptions) => {
  Object.assign(dialog, options);
  dialog.open = true;
};

const openCourseEdit = () => {
  if (!course.value) return;
  openDialog({
    title: "Editar curso",
    minTitle: 5,
    minDescription: 5,
    allowClearDescription: false,
    successMessage: "Curso atualizado.",
    initial: course.value,
    save: (data) => courseService.update(courseId.value, data),
  });
};

const openModule = (module: ModuleDTO | null) => openDialog({
  title: module ? "Editar módulo" : "Novo módulo",
  minTitle: 3,
  minDescription: 3,
  allowClearDescription: false,
  successMessage: module ? "Módulo atualizado." : "Módulo criado.",
  initial: module,
  save: (data) => (module ? moduleService.update(module.id, data) : moduleService.create(courseId.value, data)),
});

const openDiscipline = (moduleId: string, discipline: DisciplineDTO | null) => openDialog({
  title: discipline ? "Editar disciplina" : "Nova disciplina",
  minTitle: 3,
  minDescription: 3,
  allowClearDescription: true,
  successMessage: discipline ? "Disciplina atualizada." : "Disciplina criada.",
  initial: discipline,
  save: (data) => (discipline ? disciplineService.update(discipline.id, data) : disciplineService.create(moduleId, data)),
});

const onSaved = async () => {
  notify.success(dialog.successMessage);
  await structure.reload();
};

const removeModule = async (module: ModuleDTO) => {
  const ok = await confirm.ask({
    title: "Excluir módulo",
    message: `Excluir "${module.title}"?\n\nAs disciplinas, metas, sessões de estudo, questões e atividades deste módulo também serão removidas.`,
    confirmText: "Excluir",
  });
  if (!ok) return;
  if (await run(moduleService.remove(module.id), "Módulo excluído.")) await structure.reload();
};

const removeDiscipline = async (discipline: DisciplineDTO) => {
  const ok = await confirm.ask({
    title: "Excluir disciplina",
    message: `Excluir "${discipline.title}"?\n\nAs metas, sessões de estudo, questões e atividades desta disciplina também serão removidas.`,
    confirmText: "Excluir",
  });
  if (!ok) return;
  if (await run(disciplineService.remove(discipline.id), "Disciplina excluída.")) await structure.reload();
};

const study = async (scope: Scope, key: string) => {
  if (timer.active) {
    notify.info("Já existe uma sessão de estudo em andamento. Finalize-a antes de iniciar outra.");
    router.push({ name: routeProps.study.name });
    return;
  }
  starting.value = key;
  try {
    const error = await timer.start(scope);
    if (error) {
      notify.error(firstErrorMessage(error));
      return;
    }
    notify.success("Cronômetro iniciado. Bons estudos!");
    router.push({ name: routeProps.study.name });
  } finally {
    starting.value = null;
  }
};

onMounted(async () => {
  await structure.load(auth.userId);
  if (!course.value) await structure.reload();
  loading.value = false;
  if (modules.value.length === 1) openPanels.value = [modules.value[0]!.id];
});
</script>
