<template>
  <v-card>
    <v-card-item class="pb-1">
      <v-card-title class="text-title-small text-medium-emphasis">Conteúdo do curso</v-card-title>
    </v-card-item>

    <v-list density="compact" nav color="primary" class="pt-0">
      <v-list-item
        :to="{ name: routeProps.courseDetail.name, params: { id: courseId }, query: tabQuery }"
        :active="!moduleId"
        prepend-icon="mdi-school-outline"
        :title="course?.title"
        class="font-weight-medium"
        rounded="lg"
        exact
      />

      <template v-for="module in modules" :key="module.id">
        <v-list-item
          :to="{ name: routeProps.moduleDetail.name, params: { id: courseId, moduleId: module.id }, query: tabQuery }"
          :active="moduleId === module.id && !disciplineId"
          prepend-icon="mdi-folder-outline"
          :title="module.title"
          rounded="lg"
          class="ml-3"
          exact
        />
        <v-list-item
          v-for="discipline in structure.disciplinesOf(module.id)"
          :key="discipline.id"
          :to="{ name: routeProps.disciplineDetail.name, params: { id: courseId, moduleId: module.id, disciplineId: discipline.id }, query: tabQuery }"
          :active="disciplineId === discipline.id"
          prepend-icon="mdi-book-open-variant"
          :title="discipline.title"
          rounded="lg"
          class="ml-6"
          exact
        />
        <v-list-item
          v-if="moduleId === module.id && !disciplineId"
          prepend-icon="mdi-plus"
          title="Nova disciplina"
          base-color="primary"
          rounded="lg"
          class="ml-6"
          @click="emit('addDiscipline', module.id)"
        />
      </template>

      <v-list-item prepend-icon="mdi-plus" title="Novo módulo" base-color="primary" rounded="lg" class="ml-3" @click="emit('addModule')" />
    </v-list>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useStructureStore } from "@/stores/structure.store";
import { routeProps } from "@/router/RouteProps";
import type { HubTab } from "../models/Types/HubTab";

const props = defineProps<{ courseId: string, moduleId?: string | null, disciplineId?: string | null, tab?: HubTab }>();
const emit = defineEmits<{ addModule: [], addDiscipline: [moduleId: string] }>();

const structure = useStructureStore();

const course = computed(() => structure.courseById(props.courseId));
const modules = computed(() => structure.modulesOf(props.courseId));
// mantém a aba aberta ao trocar de nível
const tabQuery = computed(() => (props.tab && props.tab !== "overview" ? { tab: props.tab } : {}));
</script>
