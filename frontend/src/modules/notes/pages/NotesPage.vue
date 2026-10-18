<template>
  <div>
    <PageHeader title="Bloco de notas" subtitle="Suas anotações são privadas: somente você pode vê-las">
      <template #actions>
        <v-btn color="primary" prepend-icon="mdi-plus" :loading="creating" @click="createNote">Nova nota</v-btn>
      </template>
    </PageHeader>

    <v-row>
      <v-col cols="12" md="4" :class="{ 'd-none': mobile && selected }">
        <v-card class="notes-list">
          <v-card-text class="pb-2">
            <v-text-field v-model="search" label="Buscar" prepend-inner-icon="mdi-magnify" clearable hide-details density="compact" class="mb-3" />
            <v-select
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
                <ScopeLabel :scope="note" />
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

            <v-textarea
              v-model="draft.content"
              label="Conteúdo"
              rows="16"
              auto-grow
              counter="100000"
              placeholder="Escreva suas anotações aqui…"
              class="mb-2 content-area"
            />

            <ScopeSelect v-model="draft.scope" label="Vínculo (opcional)" />

            <div class="d-flex align-center justify-end ga-2 mt-3 text-body-small text-medium-emphasis">
              <template v-if="status === 'saving'">
                <v-progress-circular indeterminate size="14" width="2" /> Salvando…
              </template>
              <template v-else-if="status === 'error'">
                <v-icon icon="mdi-alert-circle-outline" color="error" size="16" /> Erro ao salvar
                <v-btn size="x-small" variant="text" @click="save">Tentar novamente</v-btn>
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
import { onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { useDisplay } from "vuetify";
import PageHeader from "@/components/PageHeader.vue";
import EmptyState from "@/components/EmptyState.vue";
import ScopeSelect from "@/components/ScopeSelect.vue";
import ScopeLabel from "@/components/ScopeLabel.vue";
import { useApi } from "@/composables/useApi";
import { useAuthStore } from "@/modules/auth/stores/auth.store";
import { useStructureStore } from "@/stores/structure.store";
import { useConfirmStore } from "@/stores/confirm.store";
import { isError } from "@/services/api/isError.typeGuard";
import { formatDateTime } from "@/utils/date";
import { maxLength, required } from "@/utils/rules";
import type { Scope } from "@/modules/courses/models/structure.model";
import type { Note } from "../models/note.model";
import { noteService } from "../services/note.service";

const auth = useAuthStore();
const structure = useStructureStore();
const confirm = useConfirmStore();
const { mobile } = useDisplay();
const { run, runOne } = useApi();

const notes = ref<Note[]>([]);
const loading = ref(false);
const creating = ref(false);
const search = ref<string | null>("");
const filterCourseId = ref<string | null>(null);
const selected = ref<Note | null>(null);
const draft = reactive<{ title: string, content: string, scope: Scope }>({ title: "", content: "", scope: {} });
const status = ref<"saved" | "pending" | "saving" | "error">("saved");

let saveTimer: ReturnType<typeof setTimeout> | undefined;
let searchTimer: ReturnType<typeof setTimeout> | undefined;
let loadingDraft = false;

const scopeOf = (note: Note): Scope =>
  note.disciplineId ? { disciplineId: note.disciplineId } : note.moduleId ? { moduleId: note.moduleId } : note.courseId ? { courseId: note.courseId } : {};

const sameScope = (a: Scope, b: Scope) =>
  (a.courseId ?? null) === (b.courseId ?? null) && (a.moduleId ?? null) === (b.moduleId ?? null) && (a.disciplineId ?? null) === (b.disciplineId ?? null);

const preview = (content: string) => content.replace(/\s+/g, " ").trim().slice(0, 90) || "Nota vazia";

const load = async () => {
  if (!auth.userId) return;
  loading.value = true;
  try {
    const data = await run(noteService.listByUser(auth.userId, {
      ...(filterCourseId.value ? { courseId: filterCourseId.value } : {}),
      search: search.value?.trim() || undefined,
    }));
    notes.value = data ?? [];
  } finally {
    loading.value = false;
  }
};

const flush = async () => {
  if (status.value === "pending") {
    clearTimeout(saveTimer);
    await save();
  }
};

const select = async (note: Note) => {
  await flush();
  loadingDraft = true;
  selected.value = note;
  draft.title = note.title;
  draft.content = note.content;
  draft.scope = scopeOf(note);
  status.value = "saved";
  // libera o watcher depois que o ScopeSelect sincronizar
  setTimeout(() => { loadingDraft = false; }, 0);
};

const save = async () => {
  const note = selected.value;
  if (!note) return;
  if (!draft.title.trim()) {
    status.value = "pending";
    return;
  }

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

  if (isError(response)) {
    status.value = "error";
    return;
  }

  const updated = response.data[0];
  if (updated) {
    const index = notes.value.findIndex((item) => item.id === updated.id);
    if (index >= 0) notes.value.splice(index, 1, updated);
    if (selected.value?.id === updated.id) selected.value = updated;
  }
  status.value = "saved";
};

watch(draft, () => {
  if (loadingDraft || !selected.value) return;
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
    const created = await runOne(noteService.create({ title: "Nova nota", content: "" }));
    if (created) {
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
    status.value = "saved";
  }
};

onMounted(async () => {
  await load();
  if (!mobile.value && notes.value[0]) await select(notes.value[0]);
});

onBeforeUnmount(() => {
  clearTimeout(searchTimer);
  if (status.value === "pending") {
    clearTimeout(saveTimer);
    void save();
  }
});
</script>

<style scoped>
.notes-list {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.content-area :deep(textarea) {
  font-family: ui-monospace, "Cascadia Code", Consolas, monospace;
  line-height: 1.6;
}
</style>
