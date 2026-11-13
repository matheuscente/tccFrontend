<template>
  <div>
    <v-btn-toggle v-model="mode" mandatory density="compact" variant="outlined" divided color="primary" class="mb-2">
      <v-btn value="write" prepend-icon="mdi-pencil-outline" size="small">Escrever</v-btn>
      <v-btn value="preview" prepend-icon="mdi-eye-outline" size="small">Visualizar</v-btn>
    </v-btn-toggle>

    <v-textarea
      v-if="mode === 'write'"
      :model-value="modelValue"
      :label="label"
      :rows="rows"
      auto-grow
      counter="100000"
      :placeholder="placeholder"
      hint="Aceita Markdown: # título, **negrito**, - listas, `código`, [link](https://...)"
      persistent-hint
      class="content-area"
      @update:model-value="emit('update:modelValue', $event)"
    />
    <v-sheet v-else border rounded="lg" class="pa-4 preview">
      <MarkdownView v-if="modelValue.trim()" :source="modelValue" />
      <span v-else class="text-body-medium text-medium-emphasis">Nada para visualizar ainda.</span>
    </v-sheet>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import MarkdownView from "./MarkdownView.vue";

withDefaults(defineProps<{ modelValue: string, label?: string, rows?: number, placeholder?: string }>(), {
  label: "Conteúdo",
  rows: 8,
  placeholder: "Escreva suas anotações aqui…",
});
const emit = defineEmits<{ "update:modelValue": [value: string] }>();

const mode = ref<"write" | "preview">("write");
</script>

<style scoped>
.content-area :deep(textarea) {
  font-family: ui-monospace, "Cascadia Code", Consolas, monospace;
  line-height: 1.6;
}

.preview {
  min-height: 160px;
}
</style>
