<template>
  <div>
    <v-row>
      <v-col cols="12" md="4" :class="{ 'd-none': mobile && selected }">
        <v-card class="notes-list">
          <v-card-text class="pb-2">
            <v-btn block color="primary" prepend-icon="mdi-plus" class="mb-3" :loading="creating" @click="createNote">Nova nota</v-btn>
            <v-text-field v-model="search" label="Buscar" prepend-inner-icon="mdi-magnify" clearable hide-details density="compact" :class="{ 'mb-3': !fixed }" />
            <v-select
              v-if="!fixed"
              v-model="filterCourseId"
              :items="structure.courses"
              item-title="title"
              item-value="id"
              label="Filtrar por curso"
              clearable
              hide-details
              density="compact"
            />
          </v-card-text>

          <div v-if="loading" class="d-flex justify-center pa-6">
            <v-progress-circular indeterminate color="primary" />
          </div>

          <div v-else-if="notes.length === 0" class="text-center text-body-medium text-medium-emphasis pa-6">
            {{ search || filterCourseId ? "Nenhuma nota encontrada." : "Nenhuma nota ainda. Crie a primeira!" }}
          </div>

          <v-list v-else lines="two" class="py-0" color="primary">
            <v-list-item
              v-for="note in notes"
              :key="note.id"
              :active="selected?.id === note.id"
              @click="select(note)"
            >
              <v-list-item-title class="font-weight-medium">{{ note.title || "Sem título" }}</v-list-item-title>
              <v-list-item-subtitle>{{ preview(note.content) }}</v-list-item-subtitle>
              <div class="d-flex align-center justify-space-between mt-1">
                <ScopeLabel v-if="!fixed || !sameScope(scopeOf(note), fixedScope)" :scope="note" show-empty />
                <span v-else />
                <span class="text-body-small text-medium-emphasis">{{ formatDateTime(note.updatedAt) }}</span>
              </div>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <v-col cols="12" md="8" :class="{ 'd-none': mobile && !selected }">
        <v-card v-if="selected" class="editor">
          <v-card-text>
            <div class="d-flex align-center ga-2 mb-3">
              <v-btn v-if="mobile" icon="mdi-arrow-left" variant="text" aria-label="Voltar para a lista" @click="selected = null" />
              <v-text-field
                v-model="draft.title"
                label="Título"
                hide-details="auto"
                :rules="[required('Título'), maxLength(150, 'Título')]"
                class="flex-grow-1"
              />
              <v-btn icon="mdi-delete-outline" variant="text" color="error" aria-label="Excluir nota" @click="remove" />
            </div>

            <MarkdownEditor v-model="draft.content" :rows="16" class="mb-2" />

            <div v-if="!editingScope" class="d-flex flex-wrap align-center ga-2">
              <span class="text-label-large">Vínculo:</span>
              <ScopeLabel :scope="draft.scope" show-empty />
              <v-btn size="small" variant="text" color="primary" prepend-icon="mdi-pencil-outline" @click="editingScope = true">Alterar</v-btn>
            </div>
            <ScopeSelect v-else v-model="draft.scope" label="Vínculo (opcional)" stacked />

            <div class="d-flex align-center justify-end ga-2 mt-3 text-body-small text-medium-emphasis">
              <template v-if="status === 'saving'">
                <v-progress-circular indeterminate size="14" width="2" /> Salvando…
              </template>
              <template v-else-if="status === 'error'">
                <v-icon icon="mdi-alert-circle-outline" color="error" size="16" /> Erro ao salvar
                <v-btn size="x-small" variant="text" @click="retrySave">Tentar novamente</v-btn>
              </template>
              <template v-else-if="status === 'pending'">
                <v-icon icon="mdi-pencil-outline" size="16" /> Alterações pendentes
              </template>
              <template v-else>
                <v-icon icon="mdi-check" color="success" size="16" /> Salvo
              </template>
            </div>
          </v-card-text>
        </v-card>

        <EmptyState v-else icon="mdi-notebook-outline" title="Selecione uma nota" text="Escolha uma nota na lista ou crie uma nova." />
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { useDisplay } from "vuetify";
import EmptyState from "@/components/EmptyState.vue";
import ScopeSelect from "@/components/ScopeSelect.vue";
import ScopeLabel from "@/components/ScopeLabel.vue";
import MarkdownEditor from "@/components/MarkdownEditor.vue";
import { useApi } from "@/composables/useApi";
import { useAuthStore } from "@/modules/auth/stores/auth.store";
import { useStructureStore } from "@/stores/structure.store";
import { useConfirmStore } from "@/stores/confirm.store";
import { isError } from "@/services/api/isError.typeGuard";
import { formatDateTime } from "@/utils/date";
import { maxLength, required } from "@/utils/rules";
import { useLatest } from "@/composables/useLatest";
import type { Scope } from "@/modules/courses/models/interfaces/Scope.interface";
import { hasScope, sameScope, scopeOf } from "@/utils/scope";
import type { NoteDTO } from "../models/DTO/NoteDto";
import { noteService } from "../services/note.service";

const props = withDefaults(defineProps<{ scope?: Scope | null }>(), { scope: null });
const emit = defineEmits<{ changed: [] }>();

const auth = useAuthStore();
const structure = useStructureStore();
const confirm = useConfirmStore();
const { mobile } = useDisplay();
const { run, runOne } = useApi();
const latest = useLatest();

const notes = ref<NoteDTO[]>([]);
const loading = ref(false);
const creating = ref(false);
const search = ref<string | null>("");
const filterCourseId = ref<string | null>(null);
const selected = ref<NoteDTO | null>(null);
const draft = reactive<{ title: string, content: string, scope: Scope }>({ title: "", content: "", scope: {} });
const status = ref<"saved" | "pending" | "saving" | "error">("saved");
const editingScope = ref(false);

let saveTimer: ReturnType<typeof setTimeout> | undefined;
let searchTimer: ReturnType<typeof setTimeout> | undefined;
let loadingDraft = false;
let editVersion = 0;

const fixed = computed(() => hasScope(props.scope));
const fixedScope = computed<Scope>(() => (fixed.value ? scopeOf(props.scope ?? {}) : {}));

const preview = (content: string) => content.replace(/\s+/g, " ").trim().slice(0, 90) || "Nota vazia";

const load = async () => {
  if (!auth.userId) return;
  const request = latest.next();
  loading.value = true;
  try {
    const data = await run(noteService.listByUser(auth.userId, {
      ...(fixed.value ? fixedScope.value : filterCourseId.value ? { courseId: filterCourseId.value } : {}),
      search: search.value?.trim() || undefined,
    }));
    if (latest.isLatest(request)) notes.value = data ?? [];
  } finally {
    if (latest.isLatest(request)) loading.value = false;
  }
};

const flush = async () => {
  if (status.value === "pending") {
    clearTimeout(saveTimer);
    await save();
  }
};

const select = async (note: NoteDTO) => {
  await flush();
  loadingDraft = true;
  selected.value = note;
  editingScope.value = false;
  draft.title = note.title;
  draft.content = note.content;
  draft.scope = scopeOf(note);
  status.value = "saved";
  // libera o watcher só depois que o ScopeSelect sincronizar, para a troca de nota não contar como edição
  setTimeout(() => { loadingDraft = false; }, 0);
};

const save = async () => {
  const note = selected.value;
  if (!note) return;
  if (!draft.title.trim()) {
    status.value = "pending";
    return;
  }

  const version = editVersion;
  status.value = "saving";
  const scopeChanged = !sameScope(draft.scope, scopeOf(note));
  const response = await noteService.update(note.id, {
    title: draft.title.trim(),
    content: draft.content,
    ...(scopeChanged ? {
      courseId: draft.scope.courseId ?? null,
      moduleId: draft.scope.moduleId ?? null,
      disciplineId: draft.scope.disciplineId ?? null,
    } : {}),
  });

  const stillSelected = selected.value?.id === note.id;

  if (isError(response)) {
    if (stillSelected) status.value = "error";
    return;
  }

  const updated = response.data[0];
  if (updated) {
    const index = notes.value.findIndex((item) => item.id === updated.id);
    if (index >= 0) notes.value.splice(index, 1, updated);
    if (stillSelected) selected.value = updated;
  }
  // edições feitas durante o envio continuam pendentes (o timer já reagendou o save)
  if (stillSelected && version === editVersion) status.value = "saved";
};

const retrySave = () => {
  clearTimeout(saveTimer);
  void save();
};

watch(draft, () => {
  if (loadingDraft || !selected.value) return;
  editVersion++;
  status.value = "pending";
  clearTimeout(saveTimer);
  saveTimer = setTimeout(save, 1000);
}, { deep: true });

watch(search, () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(load, 400);
});
watch(filterCourseId, load);

const createNote = async () => {
  await flush();
  creating.value = true;
  try {
    const created = await runOne(noteService.create({ title: "Nova nota", content: "", ...fixedScope.value }));
    if (created) {
      emit("changed");
      notes.value.unshift(created);
      await select(created);
    }
  } finally {
    creating.value = false;
  }
};

const remove = async () => {
  const note = selected.value;
  if (!note) return;
  const ok = await confirm.ask({ title: "Excluir nota", message: `Excluir a nota "${note.title}"?`, confirmText: "Excluir" });
  if (!ok) return;
  clearTimeout(saveTimer);
  if (await run(noteService.remove(note.id), "Nota excluída.")) {
    notes.value = notes.value.filter((item) => item.id !== note.id);
    selected.value = null;
    emit("changed");
    status.value = "saved";
  }
};

onMounted(async () => {
  await load();
  if (!mobile.value && notes.value[0]) await select(notes.value[0]);
});

onBeforeUnmount(() => {
  clearTimeout(searchTimer);
  clearTimeout(saveTimer);
  if (status.value === "pending") void save();
});
</script>

<style scoped>
.notes-list {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

</style>
