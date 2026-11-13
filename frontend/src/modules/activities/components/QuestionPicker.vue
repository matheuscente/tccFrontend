<template>
  <div>
    <div class="d-flex align-center ga-2 mb-2">
      <v-text-field
        v-model="search"
        label="Filtrar questões"
        prepend-inner-icon="mdi-magnify"
        density="compact"
        hide-details
        clearable
      />
      <v-btn variant="text" size="small" :disabled="filtered.length === 0" @click="toggleAll">
        {{ allSelected ? "Desmarcar todas" : "Marcar todas" }}
      </v-btn>
    </div>

    <div v-if="loading" class="d-flex justify-center pa-4">
      <v-progress-circular indeterminate size="28" color="primary" />
    </div>

    <v-alert v-else-if="questions.length === 0" type="info" variant="tonal" density="compact">
      {{ emptyText }}
    </v-alert>

    <v-list v-else density="compact" class="picker-list border rounded-lg">
      <v-list-item v-for="question in filtered" :key="question.id" @click="toggle(question.id)">
        <template #prepend>
          <v-checkbox-btn
            :model-value="modelValue.includes(question.id)"
            color="primary"
            :aria-label="`Selecionar questão: ${question.statement}`"
            @click.stop="toggle(question.id)"
          />
        </template>
        <v-list-item-title class="text-wrap text-body-medium">{{ question.statement }}</v-list-item-title>
        <v-list-item-subtitle>
          <ScopeLabel :scope="question" />
        </v-list-item-subtitle>
      </v-list-item>
      <v-list-item v-if="filtered.length === 0" title="Nenhuma questão corresponde ao filtro." />
    </v-list>

    <div class="text-body-small text-medium-emphasis mt-1">{{ modelValue.length }} selecionada(s)</div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import ScopeLabel from "@/components/ScopeLabel.vue";
import type { QuestionDTO } from "@/modules/questions/models/DTO/QuestionDto";

const props = withDefaults(defineProps<{
  modelValue: string[]
  questions: QuestionDTO[]
  loading?: boolean
  emptyText?: string
}>(), { loading: false, emptyText: "Nenhuma questão disponível neste escopo. Cadastre questões no banco de questões." });

const emit = defineEmits<{ "update:modelValue": [value: string[]] }>();

const search = ref<string | null>("");

const filtered = computed(() => {
  const term = (search.value ?? "").trim().toLowerCase();
  return term ? props.questions.filter((question) => question.statement.toLowerCase().includes(term)) : props.questions;
});

const allSelected = computed(() => filtered.value.length > 0 && filtered.value.every((question) => props.modelValue.includes(question.id)));

const toggle = (id: string) => {
  emit("update:modelValue", props.modelValue.includes(id) ? props.modelValue.filter((item) => item !== id) : [...props.modelValue, id]);
};

const toggleAll = () => {
  const ids = filtered.value.map((question) => question.id);
  emit("update:modelValue", allSelected.value
    ? props.modelValue.filter((id) => !ids.includes(id))
    : [...props.modelValue, ...ids.filter((id) => !props.modelValue.includes(id))]);
};
</script>

<style scoped>
.picker-list {
  max-height: 320px;
  overflow-y: auto;
}
</style>
