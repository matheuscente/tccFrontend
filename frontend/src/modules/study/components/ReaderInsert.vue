<template>
  <div class="insert" :class="{ 'insert--open': writing || queue.length }">
    <div v-if="!writing" class="insert-line">
      <v-menu location="bottom center">
        <template #activator="{ props: menuProps }">
          <v-btn
            v-bind="menuProps"
            icon="mdi-plus"
            size="x-small"
            variant="tonal"
            color="primary"
            class="insert-btn"
            :aria-label="label"
            :title="label"
          />
        </template>
        <v-list density="compact">
          <v-list-item prepend-icon="mdi-notebook-edit-outline" title="Escrever nota" @click="writing = true" />
          <v-list-item prepend-icon="mdi-paperclip" title="Anexar material (PDF, vídeo, imagem…)" @click="input?.click()" />
        </v-list>
      </v-menu>
      <input ref="input" type="file" multiple hidden @change="onPick" />
    </div>

    <v-card v-if="writing" variant="outlined" class="pa-4 my-2">
      <v-form ref="form" @submit.prevent="addNote">
        <v-text-field v-model="title" label="Título" autofocus :rules="[required('Título'), maxLength(150, 'Título')]" class="mb-2" />
        <MarkdownEditor v-model="content" :rows="5" />
        <div class="d-flex justify-end ga-2 mt-3">
          <v-btn variant="text" @click="cancel">Cancelar</v-btn>
          <v-btn type="submit" color="primary" variant="flat" prepend-icon="mdi-plus" :loading="saving">Adicionar nota</v-btn>
        </div>
      </v-form>
    </v-card>

    <v-list v-if="queue.length" density="compact" class="pa-0 my-2">
      <v-list-item v-for="item in queue" :key="item.key" class="px-0" :title="item.file.name" :subtitle="item.error">
        <template #append>
          <v-icon v-if="item.status === 'error'" icon="mdi-alert-circle" color="error" />
          <v-progress-circular v-else :model-value="item.progress" size="22" width="3" color="primary" />
        </template>
      </v-list-item>
    </v-list>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { VForm } from "vuetify/components";
import MarkdownEditor from "@/components/MarkdownEditor.vue";
import { useApi } from "@/composables/useApi";
import { useNotifyStore } from "@/stores/notify.store";
import { isError } from "@/services/api/isError.typeGuard";
import { firstErrorMessage } from "@/utils/apiErrors";
import { maxLength, required } from "@/utils/rules";
import type { Scope } from "@/modules/courses/models/interfaces/Scope.interface";
import { noteService } from "@/modules/notes/services/note.service";
import { fileService } from "@/modules/files/services/file.service";
import { MAX_UPLOAD_SIZE } from "@/modules/files/models/constants/file.constants";
import { positionsBetween } from "../utils/readerOrder";

const props = withDefaults(defineProps<{ scope: Scope, before: number | null, after: number | null, label?: string }>(), { label: "Adicionar aqui" });
const emit = defineEmits<{ added: [id: string] }>();

const { runOne } = useApi();
const notify = useNotifyStore();

const writing = ref(false);
const form = ref<VForm | null>(null);
const title = ref("");
const content = ref("");
const saving = ref(false);
const input = ref<HTMLInputElement | null>(null);

interface QueueItem { key: string, file: File, progress: number, status: "uploading" | "error", error?: string }
const queue = ref<QueueItem[]>([]);

const cancel = () => {
  writing.value = false;
  title.value = "";
  content.value = "";
};

const addNote = async () => {
  if (!form.value) return;
  const { valid } = await form.value.validate();
  if (!valid) return;
  saving.value = true;
  try {
    const [position] = positionsBetween(props.before, props.after);
    const created = await runOne(noteService.create({ title: title.value.trim(), content: content.value, position, ...props.scope }), "Nota adicionada.");
    if (created) {
      cancel();
      emit("added", created.id);
    }
  } finally {
    saving.value = false;
  }
};

// envia um por vez, na ordem escolhida, com posições entre os dois vizinhos
const onPick = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = Array.from(target.files ?? []);
  target.value = "";
  if (!files.length) return;

  const positions = positionsBetween(props.before, props.after, files.length);
  let lastId: string | null = null;
  let sent = 0;

  for (const [index, file] of files.entries()) {
    const item: QueueItem = { key: `${file.name}-${Math.random()}`, file, progress: 0, status: "uploading" };
    queue.value.push(item);
    const current = queue.value[queue.value.length - 1]!;
    if (file.size > MAX_UPLOAD_SIZE) {
      current.status = "error";
      current.error = "Arquivo maior que 100 MB";
      continue;
    }
    const response = await fileService.upload(file, props.scope, (percent) => { current.progress = percent; }, positions[index]);
    if (isError(response)) {
      current.status = "error";
      current.error = firstErrorMessage(response);
      continue;
    }
    sent++;
    lastId = response.data[0]?.id ?? lastId;
    queue.value = queue.value.filter((entry) => entry !== current);
  }

  if (sent) notify.success(sent === 1 ? "Material adicionado." : `${sent} materiais adicionados.`);
  if (lastId) emit("added", lastId);
};
</script>

<style scoped>
.insert-line {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  height: 28px;
}

.insert-line::before {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  border-top: 1px dashed rgba(var(--v-border-color), var(--v-border-opacity));
}

.insert-btn {
  position: relative;
  opacity: 0.55;
  transition: opacity 0.15s;
}

.insert-line:hover .insert-btn,
.insert-btn:focus-visible {
  opacity: 1;
}
</style>
