<template>
  <div>
    <PageHeader title="Meus arquivos" subtitle="Envie apostilas, vídeos, PDFs e outros materiais de estudo" />

    <v-alert type="info" variant="tonal" density="compact" icon="mdi-shield-lock-outline" class="mb-4">
      Seus arquivos são privados: somente você pode visualizá-los ou baixá-los (nem o administrador tem acesso).
    </v-alert>

    <v-card class="mb-4">
      <v-card-title class="text-title-medium pt-4 px-4">Enviar arquivos</v-card-title>
      <v-card-text>
        <div
          class="dropzone mb-4"
          :class="{ 'dropzone--active': dragging }"
          role="button"
          tabindex="0"
          @click="fileInput?.click()"
          @keydown.enter="fileInput?.click()"
          @dragover.prevent="dragging = true"
          @dragleave.prevent="dragging = false"
          @drop.prevent="onDrop"
        >
          <v-icon icon="mdi-cloud-upload-outline" size="40" color="primary" class="mb-2" />
          <div class="text-body-large">Arraste arquivos aqui ou <span class="text-primary font-weight-medium">clique para selecionar</span></div>
          <div class="text-body-small text-medium-emphasis">Até 100 MB por arquivo</div>
          <input ref="fileInput" type="file" multiple hidden @change="onPick" />
        </div>

        <ScopeSelect v-model="uploadScope" label="Vincular os arquivos enviados a (opcional)" />

        <v-list v-if="queue.length" density="compact" class="mt-3 pa-0">
          <v-list-item v-for="item in queue" :key="item.key" class="px-0">
            <template #prepend>
              <v-icon :icon="item.status === 'done' ? 'mdi-check-circle' : item.status === 'error' ? 'mdi-alert-circle' : 'mdi-file-upload-outline'"
                :color="item.status === 'done' ? 'success' : item.status === 'error' ? 'error' : 'primary'" />
            </template>
            <v-list-item-title class="text-body-medium">{{ item.file.name }}</v-list-item-title>
            <v-list-item-subtitle v-if="item.error" class="text-error">{{ item.error }}</v-list-item-subtitle>
            <v-progress-linear v-else :model-value="item.progress" :color="item.status === 'done' ? 'success' : 'primary'" height="4" rounded class="mt-1" />
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>

    <v-card>
      <v-card-text>
        <v-row density="compact" class="mb-2">
          <v-col cols="12" md="9">
            <ScopeSelect v-model="filterScope" />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field v-model="search" label="Buscar por nome" prepend-inner-icon="mdi-magnify" clearable hide-details />
          </v-col>
        </v-row>

        <div v-if="loading" class="d-flex justify-center pa-8">
          <v-progress-circular indeterminate color="primary" />
        </div>

        <EmptyState v-else-if="files.length === 0" icon="mdi-cloud-outline" title="Nenhum arquivo encontrado" text="Envie seus materiais usando a área acima." />

        <v-table v-else density="comfortable" hover>
          <thead>
            <tr>
              <th>Nome</th>
              <th class="d-none d-md-table-cell">Vínculo</th>
              <th class="d-none d-sm-table-cell">Tamanho</th>
              <th class="d-none d-sm-table-cell">Enviado em</th>
              <th class="text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="file in files" :key="file.id">
              <td>
                <div class="d-flex align-center ga-2 cursor-pointer" @click="view(file)">
                  <v-icon :icon="fileIcon(file.mimeType)" color="primary" />
                  <span class="text-body-medium file-name">{{ file.originalName }}</span>
                </div>
              </td>
              <td class="d-none d-md-table-cell"><ScopeLabel :scope="file" show-empty /></td>
              <td class="d-none d-sm-table-cell text-no-wrap">{{ formatBytes(file.size) }}</td>
              <td class="d-none d-sm-table-cell text-no-wrap">{{ formatDateTime(file.createdAt) }}</td>
              <td class="text-right text-no-wrap">
                <v-btn icon="mdi-eye-outline" variant="text" size="small" aria-label="Visualizar" @click="view(file)" />
                <v-btn icon="mdi-download" variant="text" size="small" aria-label="Baixar" :loading="downloading === file.id" @click="download(file)" />
                <v-menu>
                  <template #activator="{ props: menuProps }">
                    <v-btn v-bind="menuProps" icon="mdi-dots-vertical" variant="text" size="small" aria-label="Mais ações" />
                  </template>
                  <v-list density="compact">
                    <v-list-item prepend-icon="mdi-pencil-outline" title="Renomear / vincular" @click="openEdit(file)" />
                    <v-list-item prepend-icon="mdi-delete-outline" title="Excluir" base-color="error" @click="remove(file)" />
                  </v-list>
                </v-menu>
              </td>
            </tr>
          </tbody>
        </v-table>

        <div v-if="files.length" class="text-body-small text-medium-emphasis mt-2">
          {{ files.length }} arquivo(s) · {{ formatBytes(totalSize) }}
        </div>
      </v-card-text>
    </v-card>

    <FileViewerDialog v-model="viewerOpen" :file="viewing" />

    <v-dialog v-model="editOpen" max-width="640">
      <v-card>
        <v-card-title class="text-title-large pt-5 px-6">Editar arquivo</v-card-title>
        <v-card-text class="px-6">
          <v-form ref="editForm" @submit.prevent="saveEdit">
            <v-text-field v-model="editName" label="Nome" :rules="[required('Nome'), maxLength(200, 'Nome')]" class="mb-2" />
            <ScopeSelect v-model="editScope" label="Vínculo (opcional)" />
          </v-form>
        </v-card-text>
        <v-card-actions class="px-6 pb-4">
          <v-spacer />
          <v-btn variant="text" @click="editOpen = false">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" :loading="savingEdit" @click="saveEdit">Salvar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import type { VForm } from "vuetify/components";
import PageHeader from "@/components/PageHeader.vue";
import EmptyState from "@/components/EmptyState.vue";
import ScopeSelect from "@/components/ScopeSelect.vue";
import ScopeLabel from "@/components/ScopeLabel.vue";
import { useApi } from "@/composables/useApi";
import { useAuthStore } from "@/modules/auth/stores/auth.store";
import { useConfirmStore } from "@/stores/confirm.store";
import { useNotifyStore } from "@/stores/notify.store";
import { isError } from "@/services/api/isError.typeGuard";
import { firstErrorMessage } from "@/utils/apiErrors";
import { formatBytes, formatDateTime } from "@/utils/date";
import { maxLength, required } from "@/utils/rules";
import type { Scope } from "@/modules/courses/models/structure.model";
import { fileIcon, type StoredFile } from "../models/file.model";
import { fileService } from "../services/file.service";
import FileViewerDialog from "../components/FileViewerDialog.vue";

const MAX_SIZE = 100 * 1024 * 1024;

const auth = useAuthStore();
const confirm = useConfirmStore();
const notify = useNotifyStore();
const { run, runOne } = useApi();

const files = ref<StoredFile[]>([]);
const loading = ref(false);
const filterScope = ref<Scope>({});
const search = ref<string | null>("");

const fileInput = ref<HTMLInputElement | null>(null);
const dragging = ref(false);
const uploadScope = ref<Scope>({});

interface QueueItem { key: string, file: File, progress: number, status: "waiting" | "uploading" | "done" | "error", error?: string }
const queue = ref<QueueItem[]>([]);
let uploading = false;

const viewerOpen = ref(false);
const viewing = ref<StoredFile | null>(null);
const downloading = ref<string | null>(null);

const editOpen = ref(false);
const editForm = ref<VForm | null>(null);
const editing = ref<StoredFile | null>(null);
const editName = ref("");
const editScope = ref<Scope>({});
const savingEdit = ref(false);

const totalSize = computed(() => files.value.reduce((sum, file) => sum + file.size, 0));

const scopeOf = (file: StoredFile): Scope =>
  file.disciplineId ? { disciplineId: file.disciplineId } : file.moduleId ? { moduleId: file.moduleId } : file.courseId ? { courseId: file.courseId } : {};

const load = async () => {
  if (!auth.userId) return;
  loading.value = true;
  try {
    files.value = (await run(fileService.listByUser(auth.userId, { ...filterScope.value, search: search.value?.trim() || undefined }))) ?? [];
  } finally {
    loading.value = false;
  }
};

let searchTimer: ReturnType<typeof setTimeout> | undefined;
watch(search, () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(load, 400);
});
watch(filterScope, load, { deep: true });

const enqueue = (list: FileList | null | undefined) => {
  if (!list?.length) return;
  Array.from(list).forEach((file) => {
    queue.value.push({
      key: `${file.name}-${file.size}-${Math.random()}`,
      file,
      progress: 0,
      status: file.size > MAX_SIZE ? "error" : "waiting",
      ...(file.size > MAX_SIZE ? { error: "Arquivo maior que 100 MB" } : {}),
    });
  });
  void processQueue();
};

const onPick = (event: Event) => {
  const input = event.target as HTMLInputElement;
  enqueue(input.files);
  input.value = "";
};

const onDrop = (event: DragEvent) => {
  dragging.value = false;
  enqueue(event.dataTransfer?.files);
};

// envia um arquivo por vez
const processQueue = async () => {
  if (uploading) return;
  uploading = true;
  let uploaded = 0;
  try {
    for (const item of queue.value) {
      if (item.status !== "waiting") continue;
      item.status = "uploading";
      const response = await fileService.upload(item.file, uploadScope.value, (percent) => { item.progress = percent; });
      if (isError(response)) {
        item.status = "error";
        item.error = firstErrorMessage(response);
      } else {
        item.status = "done";
        item.progress = 100;
        uploaded++;
      }
    }
  } finally {
    uploading = false;
  }
  if (uploaded) {
    notify.success(uploaded === 1 ? "Arquivo enviado." : `${uploaded} arquivos enviados.`);
    await load();
    setTimeout(() => { queue.value = queue.value.filter((item) => item.status !== "done"); }, 3000);
  }
};

const view = (file: StoredFile) => {
  viewing.value = file;
  viewerOpen.value = true;
};

const download = async (file: StoredFile) => {
  downloading.value = file.id;
  try {
    const access = await runOne(fileService.access(file.id));
    if (!access) return;
    const anchor = document.createElement("a");
    anchor.href = access.downloadUrl;
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    downloading.value = null;
  }
};

const openEdit = (file: StoredFile) => {
  editing.value = file;
  editName.value = file.originalName;
  editScope.value = scopeOf(file);
  editOpen.value = true;
};

const saveEdit = async () => {
  if (!editForm.value || !editing.value) return;
  const { valid } = await editForm.value.validate();
  if (!valid) return;
  savingEdit.value = true;
  try {
    const updated = await runOne(fileService.update(editing.value.id, {
      originalName: editName.value.trim(),
      courseId: editScope.value.courseId ?? null,
      moduleId: editScope.value.moduleId ?? null,
      disciplineId: editScope.value.disciplineId ?? null,
    }), "Arquivo atualizado.");
    if (updated) {
      editOpen.value = false;
      await load();
    }
  } finally {
    savingEdit.value = false;
  }
};

const remove = async (file: StoredFile) => {
  const ok = await confirm.ask({ title: "Excluir arquivo", message: `Excluir "${file.originalName}" definitivamente?`, confirmText: "Excluir" });
  if (!ok) return;
  if (await run(fileService.remove(file.id), "Arquivo excluído.")) await load();
};

onMounted(load);
</script>

<style scoped>
.dropzone {
  border: 2px dashed rgba(var(--v-border-color), 0.3);
  border-radius: 12px;
  padding: 28px 16px;
  text-align: center;
  cursor: pointer;
  transition: background-color 0.15s, border-color 0.15s;
}

.dropzone:hover,
.dropzone--active {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.06);
}

.file-name {
  word-break: break-word;
}
</style>
