<template>
  <div>
    <div v-if="label" class="text-label-large mb-2">{{ label }}</div>
    <v-row density="compact">
      <v-col cols="12" :md="stacked ? 12 : 4">
        <v-select
          v-model="courseId"
          :items="structure.courses"
          item-title="title"
          item-value="id"
          label="Curso"
          :clearable="!required"
          :disabled="disabled"
          :rules="required ? [(v: unknown) => !!v || 'Selecione pelo menos o curso.'] : []"
          :no-data-text="'Nenhum curso cadastrado'"
          hide-details="auto"
          prepend-inner-icon="mdi-school-outline"
        />
      </v-col>
      <v-col cols="12" :md="stacked ? 12 : 4">
        <v-select
          v-model="moduleId"
          :items="moduleItems"
          item-title="title"
          item-value="id"
          label="Módulo (opcional)"
          clearable
          :disabled="disabled || !courseId"
          no-data-text="Nenhum módulo neste curso"
          hide-details="auto"
          prepend-inner-icon="mdi-folder-outline"
        />
      </v-col>
      <v-col cols="12" :md="stacked ? 12 : 4">
        <v-select
          v-model="disciplineId"
          :items="disciplineItems"
          item-title="title"
          item-value="id"
          label="Disciplina (opcional)"
          clearable
          :disabled="disabled || !moduleId"
          no-data-text="Nenhuma disciplina neste módulo"
          hide-details="auto"
          prepend-inner-icon="mdi-book-open-variant"
        />
      </v-col>
    </v-row>
    <div v-if="hint" class="text-body-small text-medium-emphasis mt-1">{{ hint }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useStructureStore } from "@/stores/structure.store";
import type { Scope } from "@/modules/courses/models/structure.model";

/**
 * Seletor em cascata curso > módulo > disciplina.
 * Emite o escopo mais específico escolhido: { courseId } | { moduleId } | { disciplineId } | {}.
 */
const props = withDefaults(defineProps<{
  modelValue: Scope
  required?: boolean
  disabled?: boolean
  label?: string
  hint?: string
  /** um seletor por linha (para cards estreitos) */
  stacked?: boolean
}>(), { required: false, disabled: false, label: "", hint: "", stacked: false });

const emit = defineEmits<{ "update:modelValue": [value: Scope] }>();

const structure = useStructureStore();

const courseId = ref<string | null>(null);
const moduleId = ref<string | null>(null);
const disciplineId = ref<string | null>(null);

const moduleItems = computed(() => structure.modulesOf(courseId.value));
const disciplineItems = computed(() => structure.disciplinesOf(moduleId.value));

// preenche os três seletores a partir do escopo recebido
const syncFromValue = (scope: Scope) => {
  if (scope.disciplineId) {
    const discipline = structure.disciplineById(scope.disciplineId);
    const module = structure.moduleById(discipline?.moduleId);
    disciplineId.value = scope.disciplineId;
    moduleId.value = module?.id ?? null;
    courseId.value = module?.courseId ?? null;
  } else if (scope.moduleId) {
    const module = structure.moduleById(scope.moduleId);
    disciplineId.value = null;
    moduleId.value = scope.moduleId;
    courseId.value = module?.courseId ?? null;
  } else {
    disciplineId.value = null;
    moduleId.value = null;
    courseId.value = scope.courseId ?? null;
  }
};

const current = (): Scope => {
  if (disciplineId.value) return { disciplineId: disciplineId.value };
  if (moduleId.value) return { moduleId: moduleId.value };
  if (courseId.value) return { courseId: courseId.value };
  return {};
};

const sameScope = (a: Scope, b: Scope) =>
  (a.courseId ?? null) === (b.courseId ?? null) &&
  (a.moduleId ?? null) === (b.moduleId ?? null) &&
  (a.disciplineId ?? null) === (b.disciplineId ?? null);

watch(() => props.modelValue, (value) => {
  if (!sameScope(value, current())) syncFromValue(value);
}, { immediate: true, deep: true });

watch(() => [structure.courses.length, structure.modules.length, structure.disciplines.length], () => syncFromValue(props.modelValue));

watch(courseId, (value, old) => {
  if (old !== undefined && value !== old && structure.moduleById(moduleId.value)?.courseId !== value) {
    moduleId.value = null;
  }
});

watch(moduleId, (value, old) => {
  if (old !== undefined && value !== old && structure.disciplineById(disciplineId.value)?.moduleId !== value) {
    disciplineId.value = null;
  }
});

watch([courseId, moduleId, disciplineId], () => {
  const next = current();
  if (!sameScope(next, props.modelValue)) emit("update:modelValue", next);
});
</script>
