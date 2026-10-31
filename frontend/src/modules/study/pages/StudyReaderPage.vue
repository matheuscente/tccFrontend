<template>
  <div class="reader">
    <v-toolbar class="reader-bar" density="comfortable" color="surface" border="b">
      <v-btn icon="mdi-close" variant="text" :to="exitRoute" aria-label="Sair do modo estudo" />
      <div class="flex-grow-1 text-truncate">
        <div class="text-label-medium text-medium-emphasis text-truncate">Modo estudo · {{ path.slice(0, -1).join(" › ") || levelInfo.label }}</div>
        <div class="text-title-medium font-weight-medium text-truncate">{{ current?.title }}</div>
      </div>
      <v-btn icon="mdi-format-list-bulleted" variant="text" aria-label="Sumário" @click="tocOpen = true" />
      <v-btn :icon="isDark ? 'mdi-weather-sunny' : 'mdi-weather-night'" variant="text" :aria-label="isDark ? 'Tema claro' : 'Tema escuro'" @click="toggleTheme" />
      <v-btn
        v-if="studyingHere"
        color="success"
        variant="flat"
        prepend-icon="mdi-stop"
        class="mr-2"
        :loading="timerBusy"
        @click="finishStudy"
      >
        {{ formatDuration(timer.elapsedSeconds) }}
        <span class="d-none d-sm-inline ml-1">· Finalizar</span>
      </v-btn>
      <v-btn
        v-else
        color="primary"
        variant="flat"
        prepend-icon="mdi-play"
        class="mr-2"
        :loading="timerBusy"
        :disabled="!!timer.active"
        @click="startStudy"
      >
        <span class="d-none d-sm-inline">Iniciar cronômetro</span>
        <span class="d-sm-none">Iniciar</span>
      </v-btn>
    </v-toolbar>

    <div v-if="loading" class="d-flex justify-center pa-12">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <EmptyState v-else-if="!current" icon="mdi-school-outline" title="Conteúdo não encontrado" text="Ele pode ter sido excluído." class="ma-6">
      <v-btn color="primary" :to="{ name: routeProps.courses.name }">Voltar para cursos</v-btn>
    </EmptyState>

    <div v-else class="reader-body" :class="{ 'reader-body--split': wide }">
      <article class="page">
        <v-alert v-if="timer.active && !studyingHere" type="info" variant="tonal" density="compact" class="mb-6">
          Há um cronômetro em andamento em <ScopeLabel :scope="timer.active" />. Finalize-o para cronometrar este estudo.
        </v-alert>

        <header class="mb-6">
          <div class="text-label-large text-primary mb-1">{{ levelInfo.label }}</div>
          <h1 class="text-headline-medium font-weight-bold">{{ current.title }}</h1>
          <p v-if="current.description" class="text-body-large text-medium-emphasis mt-2">{{ current.description }}</p>
          <div class="text-body-medium text-medium-emphasis mt-3">
            {{ totals.notes }} nota(s) · {{ totals.files }} material(is)<template v-if="totals.activities"> · {{ totals.activities }} atividade(s)</template>
          </div>
          <p v-if="!totals.notes && !totals.files" class="text-body-large text-medium-emphasis mt-4">
            Ainda não há conteúdo aqui. Use o <v-icon icon="mdi-plus-circle-outline" size="small" /> para escrever uma nota ou anexar um PDF, vídeo ou imagem.
          </p>
        </header>

        <section v-for="section in sections" :id="`section-${section.id}`" :key="section.id" class="section">
          <component :is="section.depth === 1 ? 'h2' : 'h3'" v-if="section.depth > 0" class="section-title" :class="section.depth === 1 ? 'text-headline-small' : 'text-title-large'">
            <v-icon :icon="section.level === 'module' ? 'mdi-folder-outline' : 'mdi-book-open-variant'" size="small" class="mr-2" color="primary" />{{ section.title }}
          </component>
          <p v-if="section.depth > 0 && section.description" class="text-body-medium text-medium-emphasis mb-2">{{ section.description }}</p>

          <ReaderInsert
            :scope="section.scope"
            :before="null"
            :after="section.items[0]?.order ?? null"
            :label="`Adicionar no início de ${section.title}`"
            @added="onAdded"
          />

          <template v-for="(item, index) in section.items" :key="item.id">
            <div :id="`item-${item.id}`" class="item">
              <div class="item-meta text-label-medium text-medium-emphasis mb-2">
                <v-icon :icon="item.type === 'note' ? 'mdi-notebook-outline' : fileIcon(item.file.mimeType)" size="16" class="mr-1" />
                {{ item.type === "note" ? "Nota" : "Material" }} · incluído em {{ formatDateTime(item.createdAt) }}
              </div>

              <ReaderNote v-if="item.type === 'note'" :note="item.note" @updated="replaceNote" @removed="removeNote" />

              <template v-else>
                <v-sheet
                  v-if="wide && sideKind(item.file)"
                  border
                  rounded="lg"
                  class="media-card d-flex align-center ga-3 pa-3"
                  :class="{ 'media-card--active': isSelected(item.file) }"
                  role="button"
                  tabindex="0"
                  @click="select(item.file)"
                  @keydown.enter.prevent="select(item.file)"
                >
                  <v-avatar :color="isSelected(item.file) ? 'primary' : undefined" variant="tonal" rounded="lg" size="48">
                    <v-icon :icon="sideKind(item.file) === 'image' ? 'mdi-image-outline' : kindOf(item.file) === 'pdf' ? 'mdi-file-pdf-box' : kindOf(item.file) === 'audio' ? 'mdi-music' : 'mdi-play'" />
                  </v-avatar>
                  <div class="flex-grow-1" style="min-width: 0">
                    <div class="text-title-medium font-weight-medium file-name">{{ item.file.originalName }}</div>
                    <div class="text-body-small text-medium-emphasis">
                      {{ isSelected(item.file) ? "Aberto ao lado" : sideKind(item.file) === "image" ? "Clique para ver ao lado" : "Clique para abrir ao lado" }} · {{ formatBytes(item.file.size) }}
                    </div>
                  </div>
                  <v-btn icon="mdi-download" size="small" variant="text" :aria-label="`Baixar ${item.file.originalName}`" :loading="downloading === item.id" @click.stop="download(item.file)" />
                </v-sheet>

                <template v-else>
                  <div class="d-flex align-start ga-2 mb-3">
                    <h3 class="text-title-large font-weight-bold flex-grow-1 file-name">{{ item.file.originalName }}</h3>
                    <v-btn icon="mdi-download" size="small" variant="text" :aria-label="`Baixar ${item.file.originalName}`" :loading="downloading === item.id" @click="download(item.file)" />
                  </div>
                  <FileInline :file="item.file" floatable />
                </template>
              </template>
            </div>

            <ReaderInsert
              :scope="section.scope"
              :before="item.order"
              :after="section.items[index + 1]?.order ?? null"
              @added="onAdded"
            />
          </template>

          <v-sheet v-if="section.activities.length" border rounded="lg" class="practice pa-4">
            <div class="text-title-small font-weight-bold mb-2"><v-icon icon="mdi-clipboard-check-outline" size="18" class="mr-1" />Praticar</div>
            <div v-for="activity in section.activities" :key="activity.id" class="d-flex flex-wrap align-center ga-2 py-1">
              <span class="text-body-medium flex-grow-1">{{ activity.title }} <span class="text-medium-emphasis">· {{ activity.questionCount }} questão(ões)<template v-if="activity.bestScore !== null"> · melhor nota {{ formatScore(activity.bestScore) }}</template></span></span>
              <v-btn
                size="small"
                color="primary"
                variant="tonal"
                prepend-icon="mdi-play"
                :disabled="!activity.questionCount"
                :to="{ name: routeProps.activityAnswer.name, params: { id: activity.id } }"
              >
                Responder
              </v-btn>
            </div>
          </v-sheet>
        </section>
        <div class="pb-16" />
      </article>

      <aside v-if="wide" class="viewer">
        <div class="viewer-pane viewer-pane--player">
          <div class="viewer-head text-label-large text-medium-emphasis">
            <v-icon icon="mdi-play-box-outline" size="18" class="mr-1" />{{ selectedPlayer?.originalName ?? "Vídeo / documento" }}
          </div>
          <div class="viewer-content">
            <FileInline v-if="selectedPlayer" :key="selectedPlayer.id" :file="selectedPlayer" eager fill :autoplay="autoplay" />
            <div v-else class="viewer-empty">Clique em um vídeo, PDF ou áudio na lista para abrir aqui.</div>
          </div>
        </div>
        <div class="viewer-pane viewer-pane--image">
          <div class="viewer-head text-label-large text-medium-emphasis">
            <v-icon icon="mdi-image-outline" size="18" class="mr-1" />{{ selectedImage?.originalName ?? "Imagem" }}
          </div>
          <div class="viewer-content">
            <FileInline v-if="selectedImage" :key="selectedImage.id" :file="selectedImage" eager fill />
            <div v-else class="viewer-empty">Clique em uma imagem na lista para ver aqui.</div>
          </div>
        </div>
      </aside>
    </div>

    <v-bottom-sheet v-model="tocOpen">
      <v-card>
        <v-card-title class="text-title-medium pt-4">Sumário</v-card-title>
        <ReaderToc :sections="sections" @go="(id) => { tocOpen = false; scrollTo(id); }" />
      </v-card>
    </v-bottom-sheet>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { useDisplay, useTheme } from "vuetify";
import EmptyState from "@/components/EmptyState.vue";
import ScopeLabel from "@/components/ScopeLabel.vue";
import FileInline from "@/modules/files/components/FileInline.vue";
import ReaderNote from "../components/ReaderNote.vue";
import ReaderInsert from "../components/ReaderInsert.vue";
import ReaderToc from "../components/ReaderToc.vue";
import { useApi } from "@/composables/useApi";
import { useHubRoute } from "@/composables/useHubRoute";
import { useAuthStore } from "@/modules/auth/stores/auth.store";
import { useStructureStore } from "@/stores/structure.store";
import { useNotifyStore } from "@/stores/notify.store";
import { useTimerStore } from "../stores/timer.store";
import { isError } from "@/services/api/isError.typeGuard";
import { noteService } from "@/modules/notes/services/note.service";
import { fileService } from "@/modules/files/services/file.service";
import { activityService } from "@/modules/activities/services/activity.service";
import { fileIcon, fileKind } from "@/modules/files/utils/fileKind";
import { routeProps } from "@/router/RouteProps";
import { firstErrorMessage } from "@/utils/apiErrors";
import { formatBytes, formatDateTime, formatDuration, formatMinutes } from "@/utils/date";
import { formatScore } from "@/utils/score";
import { sameScope, scopeOf } from "@/utils/scope";
import { writeStorage } from "@/utils/storage";
import type { Scope } from "@/modules/courses/models/interfaces/Scope.interface";
import type { ScopeLevel } from "@/modules/courses/models/Types/ScopeLevel";
import type { NoteDTO } from "@/modules/notes/models/DTO/NoteDto";
import type { StoredFileDTO } from "@/modules/files/models/DTO/StoredFileDto";
import type { ActivityDTO } from "@/modules/activities/models/DTO/ActivityDto";
import type { ReaderItem } from "../models/Types/ReaderItem";
import type { ReaderSection } from "../models/interfaces/ReaderSection.interface";
import { orderOf } from "../utils/readerOrder";

const route = useRoute();
const auth = useAuthStore();
const structure = useStructureStore();
const notify = useNotifyStore();
const timer = useTimerStore();
const theme = useTheme();
const hubRoute = useHubRoute();
const { run, runOne } = useApi();
const { lgAndUp: wide } = useDisplay();

const courseId = computed(() => String(route.params.id));
const moduleId = computed(() => (route.params.moduleId ? String(route.params.moduleId) : null));
const disciplineId = computed(() => (route.params.disciplineId ? String(route.params.disciplineId) : null));

const level = computed<ScopeLevel>(() => (disciplineId.value ? "discipline" : moduleId.value ? "module" : "course"));
const scope = computed<Scope>(() => {
  if (disciplineId.value) return { disciplineId: disciplineId.value };
  if (moduleId.value) return { moduleId: moduleId.value };
  return { courseId: courseId.value };
});
const current = computed(() => (level.value === "discipline"
  ? structure.disciplineById(disciplineId.value)
  : level.value === "module" ? structure.moduleById(moduleId.value) : structure.courseById(courseId.value)));
const path = computed(() => structure.describe(scope.value).path);

const levelInfo = computed(() => ({
  course: { label: "Curso" },
  module: { label: "Módulo" },
  discipline: { label: "Disciplina" },
})[level.value]);

const exitRoute = computed(() => hubRoute(scope.value) ?? { name: routeProps.courses.name });

const loading = ref(true);
const notes = ref<NoteDTO[]>([]);
const files = ref<StoredFileDTO[]>([]);
const activities = ref<ActivityDTO[]>([]);
const downloading = ref<string | null>(null);
const timerBusy = ref(false);
const tocOpen = ref(false);

const isDark = computed(() => theme.global.current.value.dark);
const toggleTheme = () => {
  const next = isDark.value ? "light" : "dark";
  theme.change(next);
  writeStorage("theme", next);
};

// seções na ordem da estrutura (curso → módulos → disciplinas); dentro de cada uma, ordem de inclusão
const sections = computed<ReaderSection[]>(() => {
  const list: { scope: Scope, title: string, description: string | null, level: ScopeLevel, depth: number, id: string }[] = [];
  const addDisciplines = (parentModuleId: string, depth: number) => {
    structure.disciplinesOf(parentModuleId).forEach((discipline) => list.push({
      id: discipline.id, scope: { disciplineId: discipline.id }, title: discipline.title, description: discipline.description, level: "discipline", depth,
    }));
  };

  if (level.value === "course") {
    const course = structure.courseById(courseId.value);
    if (course) list.push({ id: course.id, scope: { courseId: course.id }, title: course.title, description: course.description, level: "course", depth: 0 });
    structure.modulesOf(courseId.value).forEach((module) => {
      list.push({ id: module.id, scope: { moduleId: module.id }, title: module.title, description: module.description, level: "module", depth: 1 });
      addDisciplines(module.id, 2);
    });
  } else if (level.value === "module") {
    const module = structure.moduleById(moduleId.value);
    if (module) list.push({ id: module.id, scope: { moduleId: module.id }, title: module.title, description: module.description, level: "module", depth: 0 });
    if (moduleId.value) addDisciplines(moduleId.value, 1);
  } else {
    const discipline = structure.disciplineById(disciplineId.value);
    if (discipline) list.push({ id: discipline.id, scope: { disciplineId: discipline.id }, title: discipline.title, description: discipline.description, level: "discipline", depth: 0 });
  }

  const items: ReaderItem[] = [
    ...notes.value.map((note) => ({ type: "note" as const, id: note.id, order: orderOf(note), createdAt: note.createdAt, note })),
    ...files.value.map((file) => ({ type: "file" as const, id: file.id, order: orderOf(file), createdAt: file.createdAt, file })),
  ].sort((a, b) => a.order - b.order);

  const itemScope = (item: ReaderItem) => scopeOf(item.type === "note" ? item.note : item.file);

  return list.map((section) => ({
    ...section,
    items: items.filter((item) => sameScope(itemScope(item), section.scope)),
    activities: activities.value.filter((activity) => sameScope(scopeOf(activity), section.scope)),
  }));
});


const totals = computed(() => ({
  notes: notes.value.length,
  files: files.value.length,
  activities: sections.value.reduce((total, section) => total + section.activities.length, 0),
}));

// no computador, vídeo/PDF/áudio abrem no painel de cima e imagens no de baixo
const kindOf = (file: StoredFileDTO) => fileKind(file.mimeType);
const sideKind = (file: StoredFileDTO): "player" | "image" | null => {
  const kind = kindOf(file);
  if (kind === "image") return "image";
  if (kind === "video" || kind === "pdf" || kind === "audio") return "player";
  return null;
};

const selectedPlayerId = ref<string | null>(null);
const selectedImageId = ref<string | null>(null);
const autoplay = ref(false);
const orderedFiles = computed(() => [...files.value].sort((a, b) => orderOf(a) - orderOf(b)));
const selectedPlayer = computed(() => orderedFiles.value.find((file) => file.id === selectedPlayerId.value)
  ?? orderedFiles.value.find((file) => sideKind(file) === "player") ?? null);
const selectedImage = computed(() => orderedFiles.value.find((file) => file.id === selectedImageId.value)
  ?? orderedFiles.value.find((file) => sideKind(file) === "image") ?? null);

const isSelected = (file: StoredFileDTO) => selectedPlayer.value?.id === file.id || selectedImage.value?.id === file.id;

const select = (file: StoredFileDTO) => {
  if (sideKind(file) === "image") {
    selectedImageId.value = file.id;
  } else {
    selectedPlayerId.value = file.id;
    autoplay.value = kindOf(file) === "video";
  }
};

const studyingHere = computed(() => !!timer.active && sameScope(scopeOf(timer.active), scope.value));

const load = async () => {
  if (!auth.userId) return;
  const [noteList, fileList, activityList] = await Promise.all([
    run(noteService.listByUser(auth.userId, scope.value)),
    run(fileService.listByUser(auth.userId, scope.value)),
    run(activityService.listByUser(auth.userId)),
  ]);
  notes.value = noteList ?? [];
  files.value = fileList ?? [];
  activities.value = (activityList ?? []).filter((activity) => structure.contains(scope.value, activity));
};

const replaceNote = (note: NoteDTO) => {
  const index = notes.value.findIndex((item) => item.id === note.id);
  if (index >= 0) notes.value.splice(index, 1, note);
};

const removeNote = (id: string) => {
  notes.value = notes.value.filter((item) => item.id !== id);
};

const onAdded = async (id: string) => {
  await load();
  await nextTick();
  const element = document.getElementById(`item-${id}`);
  const box = element?.getBoundingClientRect();
  if (box && (box.top < 64 || box.top > window.innerHeight - 80)) scrollTo(`item-${id}`);
};

const scrollTo = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
};

const download = async (file: StoredFileDTO) => {
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

const startStudy = async () => {
  timerBusy.value = true;
  try {
    const error = await timer.start(scope.value);
    if (error) notify.error(firstErrorMessage(error));
    else notify.success("Cronômetro iniciado. Bons estudos!");
  } finally {
    timerBusy.value = false;
  }
};

const finishStudy = async () => {
  timerBusy.value = true;
  try {
    const result = await timer.finish();
    if (isError(result)) {
      notify.error(firstErrorMessage(result));
      return;
    }
    notify.success(result ? `Sessão registrada: ${formatMinutes(result.minutes)} de estudo.` : "Sessão finalizada.");
  } finally {
    timerBusy.value = false;
  }
};

onMounted(async () => {
  await structure.load(auth.userId);
  if (!current.value) await structure.reload();
  if (current.value) await load();
  loading.value = false;
});
</script>

<style scoped>
.reader-bar {
  position: sticky;
  top: 0;
  z-index: 5;
}

.reader-body {
  display: flex;
  justify-content: center;
  gap: 32px;
  padding: 32px 24px 0;
}

.page {
  width: 100%;
  max-width: 820px;
  min-width: 0;
}

.reader-body--split .page {
  flex: 1 1 0;
  max-width: 720px;
}

.viewer {
  flex: 1 1 0;
  min-width: 0;
  position: sticky;
  top: 88px;
  align-self: flex-start;
  height: calc(100vh - 112px);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.viewer-pane {
  display: flex;
  flex-direction: column;
  min-height: 0;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
  overflow: hidden;
}

.viewer-pane--player {
  flex: 3 1 0;
}

.viewer-pane--image {
  flex: 2 1 0;
}

.viewer-head {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.viewer-content {
  flex: 1 1 auto;
  min-height: 0;
  padding: 8px;
}

.viewer-empty {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 16px;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.media-card {
  cursor: pointer;
  transition: border-color 0.15s, background-color 0.15s;
}

.media-card:hover,
.media-card--active {
  border-color: rgb(var(--v-theme-primary)) !important;
  background: rgba(var(--v-theme-primary), 0.05);
}

.section {
  scroll-margin-top: 80px;
}

.section-title {
  display: flex;
  align-items: center;
  font-weight: 700;
  margin: 48px 0 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.item {
  padding: 16px 0;
  scroll-margin-top: 80px;
}


.file-name {
  word-break: break-word;
}

.practice {
  margin: 8px 0 24px;
  background: rgba(var(--v-theme-primary), 0.04);
}

@media (max-width: 959px) {
  .reader-body {
    padding: 20px 16px 0;
  }
}
</style>
