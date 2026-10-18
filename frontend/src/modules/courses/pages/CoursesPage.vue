<template>
  <div>
    <PageHeader title="Cursos" subtitle="Organize seus estudos em cursos, módulos e disciplinas">
      <template #actions>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">Novo curso</v-btn>
      </template>
    </PageHeader>

    <v-text-field
      v-if="structure.courses.length"
      v-model="search"
      label="Buscar curso"
      prepend-inner-icon="mdi-magnify"
      clearable
      hide-details
      class="mb-6"
      style="max-width: 420px"
    />

    <v-row v-if="structure.loading && !structure.courses.length">
      <v-col v-for="n in 3" :key="n" cols="12" sm="6" lg="4">
        <v-skeleton-loader type="card" />
      </v-col>
    </v-row>

    <EmptyState
      v-else-if="!structure.courses.length"
      icon="mdi-school-outline"
      title="Nenhum curso cadastrado"
      text="Comece criando um curso. Depois adicione módulos e disciplinas para organizar seus conteúdos."
    >
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">Criar meu primeiro curso</v-btn>
    </EmptyState>

    <v-row v-else>
      <v-col v-for="course in filtered" :key="course.id" cols="12" sm="6" lg="4">
        <v-card class="h-100 d-flex flex-column" :to="{ name: routeProps.courseDetail.name, params: { id: course.id } }">
          <v-card-item>
            <template #prepend>
              <v-avatar color="primary" variant="tonal" rounded="lg">
                <v-icon icon="mdi-school-outline" />
              </v-avatar>
            </template>
            <v-card-title class="text-title-medium text-wrap">{{ course.title }}</v-card-title>
            <v-card-subtitle>Criado em {{ formatDay(course.createdAt) }}</v-card-subtitle>
            <template #append>
              <v-menu location="bottom end">
                <template #activator="{ props: menuProps }">
                  <v-btn v-bind="menuProps" icon="mdi-dots-vertical" variant="text" size="small" aria-label="Ações" @click.prevent />
                </template>
                <v-list density="compact">
                  <v-list-item prepend-icon="mdi-pencil-outline" title="Editar" @click="openEdit(course)" />
                  <v-list-item prepend-icon="mdi-delete-outline" title="Excluir" base-color="error" @click="remove(course)" />
                </v-list>
              </v-menu>
            </template>
          </v-card-item>
          <v-card-text class="flex-grow-1">
            <p class="text-body-medium text-medium-emphasis description">
              {{ course.description || "Sem descrição." }}
            </p>
          </v-card-text>
          <v-card-actions class="px-4 pb-4">
            <v-chip size="small" variant="tonal" prepend-icon="mdi-folder-outline">
              {{ structure.modulesOf(course.id).length }} módulo(s)
            </v-chip>
            <v-chip size="small" variant="tonal" prepend-icon="mdi-book-open-variant" class="ml-2">
              {{ disciplineCount(course.id) }} disciplina(s)
            </v-chip>
          </v-card-actions>
        </v-card>
      </v-col>
      <v-col v-if="!filtered.length" cols="12">
        <div class="text-body-medium text-medium-emphasis">Nenhum curso encontrado para "{{ search }}".</div>
      </v-col>
    </v-row>

    <TitledFormDialog
      v-model="dialog"
      :title="editing ? 'Editar curso' : 'Novo curso'"
      :initial="editing"
      :min-title="5"
      :min-description="5"
      :save="save"
      @saved="onSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import PageHeader from "@/components/PageHeader.vue";
import EmptyState from "@/components/EmptyState.vue";
import TitledFormDialog from "../components/TitledFormDialog.vue";
import { useStructureStore } from "@/stores/structure.store";
import { useAuthStore } from "@/modules/auth/stores/auth.store";
import { useConfirmStore } from "@/stores/confirm.store";
import { useNotifyStore } from "@/stores/notify.store";
import { useApi } from "@/composables/useApi";
import { courseService } from "../services/structure.service";
import type { Course, TitledInput } from "../models/structure.model";
import { routeProps } from "@/router/RouteProps";
import { formatDay } from "@/utils/date";

const structure = useStructureStore();
const auth = useAuthStore();
const confirm = useConfirmStore();
const notify = useNotifyStore();
const { run } = useApi();

const search = ref("");
const dialog = ref(false);
const editing = ref<Course | null>(null);

const filtered = computed(() => {
  const term = (search.value ?? "").trim().toLowerCase();
  return term ? structure.courses.filter((course) => course.title.toLowerCase().includes(term)) : structure.courses;
});

const disciplineCount = (courseId: string) =>
  structure.modulesOf(courseId).reduce((total, module) => total + structure.disciplinesOf(module.id).length, 0);

const openCreate = () => {
  editing.value = null;
  dialog.value = true;
};

const openEdit = (course: Course) => {
  editing.value = course;
  dialog.value = true;
};

const save = (data: TitledInput) =>
  editing.value ? courseService.update(editing.value.id, data) : courseService.create(auth.userId, data);

const onSaved = async () => {
  notify.success(editing.value ? "Curso atualizado." : "Curso criado.");
  await structure.reload();
};

const remove = async (course: Course) => {
  const ok = await confirm.ask({
    title: "Excluir curso",
    message: `Excluir "${course.title}"?\n\nTambém serão removidos os módulos, disciplinas, metas, sessões de estudo, questões e atividades ligados a este curso.`,
    confirmText: "Excluir",
  });
  if (!ok) return;

  const result = await run(courseService.remove(course.id), "Curso excluído.");
  if (result) await structure.reload();
};

onMounted(() => structure.load(auth.userId));
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
