<template>
  <v-dialog :model-value="modelValue" :fullscreen="mobile" max-width="1100" scrollable @update:model-value="emit('update:modelValue', $event)">
    <v-card v-if="file">
      <v-card-item>
        <template #prepend>
          <v-icon :icon="fileIcon(file.mimeType)" color="primary" />
        </template>
        <v-card-title class="text-title-medium text-truncate">{{ file.originalName }}</v-card-title>
        <v-card-subtitle>{{ formatBytes(file.size) }} · {{ file.mimeType }}</v-card-subtitle>
        <template #append>
          <v-btn v-if="access" icon="mdi-download" variant="text" :href="access.downloadUrl" aria-label="Baixar" />
          <v-btn icon="mdi-close" variant="text" aria-label="Fechar" @click="emit('update:modelValue', false)" />
        </template>
      </v-card-item>

      <v-divider />

      <v-card-text class="viewer pa-0">
        <div v-if="loading" class="d-flex justify-center align-center pa-12">
          <v-progress-circular indeterminate color="primary" />
        </div>

        <v-alert v-else-if="error" type="error" variant="tonal" class="ma-4">{{ error }}</v-alert>

        <template v-else-if="access">
          <div v-if="kind === 'image'" class="d-flex justify-center pa-4">
            <img :src="access.viewUrl" :alt="file.originalName" class="media" />
          </div>
          <div v-else-if="kind === 'video'" class="d-flex justify-center pa-4">
            <video :src="access.viewUrl" controls preload="metadata" class="media" />
          </div>
          <div v-else-if="kind === 'audio'" class="pa-6">
            <audio :src="access.viewUrl" controls preload="metadata" class="w-100" />
          </div>
          <iframe v-else-if="kind === 'pdf'" :src="access.viewUrl" :title="file.originalName" class="pdf-frame" />
          <pre v-else-if="kind === 'text'" class="text-preview pa-4">{{ textContent }}</pre>
          <div v-else class="text-center pa-10">
            <v-icon icon="mdi-file-eye-outline" size="56" color="medium-emphasis" class="mb-3" />
            <div class="text-body-large mb-4">Este tipo de arquivo não pode ser visualizado no navegador.</div>
            <v-btn color="primary" prepend-icon="mdi-download" :href="access.downloadUrl">Baixar arquivo</v-btn>
          </div>
        </template>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useDisplay } from "vuetify";
import { isError } from "@/services/api/isError.typeGuard";
import { firstErrorMessage } from "@/utils/apiErrors";
import { formatBytes } from "@/utils/date";
import { fileIcon, fileKind, type FileAccess, type StoredFile } from "../models/file.model";
import { fileService } from "../services/file.service";

const props = defineProps<{ modelValue: boolean, file: StoredFile | null }>();
const emit = defineEmits<{ "update:modelValue": [value: boolean] }>();

const { mobile } = useDisplay();

const access = ref<FileAccess | null>(null);
const loading = ref(false);
const error = ref<string>();
const textContent = ref("");

const kind = computed(() => (props.file ? fileKind(props.file.mimeType) : "other"));

const TEXT_LIMIT = 2 * 1024 * 1024;

const open = async () => {
  if (!props.file) return;
  access.value = null;
  error.value = undefined;
  textContent.value = "";
  loading.value = true;
  try {
    const response = await fileService.access(props.file.id);
    if (isError(response)) {
      error.value = firstErrorMessage(response);
      return;
    }
    access.value = response.data[0] ?? null;

    if (access.value && kind.value === "text") {
      if (props.file.size > TEXT_LIMIT) {
        textContent.value = "Arquivo grande demais para pré-visualizar. Use o botão de download.";
      } else {
        const result = await fetch(access.value.viewUrl);
        textContent.value = result.ok ? await result.text() : "Não foi possível carregar o conteúdo.";
      }
    }
  } catch {
    error.value = "Não foi possível abrir o arquivo.";
  } finally {
    loading.value = false;
  }
};

watch(() => [props.modelValue, props.file?.id], ([visible]) => {
  if (visible) void open();
  else access.value = null;
});
</script>

<style scoped>
.viewer {
  min-height: 240px;
}

.media {
  max-width: 100%;
  max-height: 75vh;
  border-radius: 8px;
}

.pdf-frame {
  width: 100%;
  height: 78vh;
  border: 0;
  display: block;
}

.text-preview {
  white-space: pre-wrap;
  word-break: break-word;
  font-family: ui-monospace, Consolas, monospace;
  font-size: 0.875rem;
  max-height: 75vh;
  overflow: auto;
  margin: 0;
}
</style>
