<template>
  <div ref="root" class="file-inline">
    <div v-if="!visible || loading" class="placeholder d-flex justify-center align-center">
      <v-progress-circular v-if="loading" indeterminate color="primary" />
      <v-icon v-else :icon="fileIcon(file.mimeType)" size="40" color="medium-emphasis" />
    </div>
    <v-alert v-else-if="error" type="error" variant="tonal" density="compact">
      {{ error }}
      <template #append><v-btn size="small" variant="text" @click="load">Tentar novamente</v-btn></template>
    </v-alert>
    <template v-else-if="access">
      <img v-if="kind === 'image'" :src="access.viewUrl" :alt="file.originalName" class="media" :class="{ 'media--fill': fill }" />
      <div v-else-if="kind === 'video'" ref="holder" class="video-holder" :style="floating ? { height: `${holderHeight}px` } : undefined">
        <div :class="floating ? 'video-floating elevation-12' : 'h-100'">
          <video
            ref="player"
            :src="access.viewUrl"
            controls
            playsinline
            preload="metadata"
            :autoplay="autoplay"
            class="media"
            :class="{ 'media--fill': fill && !floating }"
            @play="playing = true"
            @pause="playing = false"
            @ended="playing = false"
          />
          <v-btn
            v-if="floating"
            icon="mdi-close"
            size="x-small"
            color="surface"
            class="floating-close"
            aria-label="Fechar mini player"
            @click="closeFloating"
          />
        </div>
      </div>
      <audio v-else-if="kind === 'audio'" :src="access.viewUrl" controls preload="metadata" class="w-100" />
      <iframe v-else-if="kind === 'pdf'" :src="access.viewUrl" :title="file.originalName" class="pdf-frame" :class="{ 'pdf-frame--fill': fill }" />
      <template v-else-if="kind === 'text'">
        <MarkdownView v-if="markdown" :source="textContent" />
        <pre v-else class="text-preview">{{ textContent }}</pre>
      </template>
      <v-sheet v-else border rounded="lg" class="d-flex align-center ga-3 pa-4">
        <v-icon :icon="fileIcon(file.mimeType)" size="32" color="primary" />
        <div class="flex-grow-1 text-body-medium">Este tipo de arquivo não abre no navegador.</div>
        <v-btn color="primary" variant="tonal" prepend-icon="mdi-download" :href="access.downloadUrl">Baixar</v-btn>
      </v-sheet>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import MarkdownView from "@/components/MarkdownView.vue";
import { isError } from "@/services/api/isError.typeGuard";
import { firstErrorMessage } from "@/utils/apiErrors";
import { isMarkdownFile } from "@/utils/markdown";
import { TEXT_PREVIEW_LIMIT } from "../models/constants/file.constants";
import type { FileAccessDTO } from "../models/DTO/FileAccessDto";
import type { StoredFileDTO } from "../models/DTO/StoredFileDto";
import { fileService } from "../services/file.service";
import { fileIcon, fileKind } from "../utils/fileKind";

// eager: carrega já (painel lateral); floatable: vídeo vira mini player no canto ao sair da tela; fill: ocupa a altura do painel
const props = withDefaults(defineProps<{ file: StoredFileDTO, eager?: boolean, floatable?: boolean, fill?: boolean, autoplay?: boolean }>(), {
  eager: false,
  floatable: false,
  fill: false,
  autoplay: false,
});

const root = ref<HTMLElement | null>(null);
const holder = ref<HTMLElement | null>(null);
const player = ref<HTMLVideoElement | null>(null);
const visible = ref(false);
const loading = ref(false);
const error = ref<string>();
const access = ref<FileAccessDTO | null>(null);
const textContent = ref("");

const playing = ref(false);
const inView = ref(true);
const dismissed = ref(false);
const holderHeight = ref(0);

const kind = computed(() => fileKind(props.file.mimeType));
const markdown = computed(() => isMarkdownFile(props.file.originalName, props.file.mimeType));
const floating = computed(() => props.floatable && playing.value && !inView.value && !dismissed.value);

let lazyObserver: IntersectionObserver | undefined;
let viewObserver: IntersectionObserver | undefined;

const load = async () => {
  visible.value = true;
  loading.value = true;
  error.value = undefined;
  try {
    const response = await fileService.access(props.file.id);
    if (isError(response)) {
      error.value = firstErrorMessage(response);
      return;
    }
    const granted = response.data[0] ?? null;
    if (granted && kind.value === "text") {
      if (props.file.size > TEXT_PREVIEW_LIMIT) {
        textContent.value = "Arquivo grande demais para exibir aqui. Use o botão de download.";
      } else {
        const result = await fetch(granted.viewUrl);
        textContent.value = result.ok ? await result.text() : "Não foi possível carregar o conteúdo.";
      }
    }
    access.value = granted;
  } catch {
    error.value = "Não foi possível abrir o arquivo.";
  } finally {
    loading.value = false;
  }
};

const closeFloating = () => {
  player.value?.pause();
  dismissed.value = true;
};

// guarda a altura do vídeo antes de ele sair do fluxo, para a página não "pular"
watch(floating, (value) => {
  if (value && holder.value) holderHeight.value = holder.value.getBoundingClientRect().height;
});

watch(playing, (value) => {
  if (value) dismissed.value = false;
});

watch(holder, (element) => {
  viewObserver?.disconnect();
  if (!element || !props.floatable) return;
  viewObserver = new IntersectionObserver((entries) => {
    inView.value = entries.some((entry) => entry.isIntersecting);
  }, { threshold: 0.25 });
  viewObserver.observe(element);
});

watch(() => props.file.id, () => {
  access.value = null;
  if (props.eager) void load();
});

onMounted(() => {
  if (props.eager) {
    void load();
    return;
  }
  // só pede o link (e carrega PDF/vídeo) quando o material chega perto da tela
  lazyObserver = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    lazyObserver?.disconnect();
    void load();
  }, { rootMargin: "600px 0px" });
  if (root.value) lazyObserver.observe(root.value);
});

onBeforeUnmount(() => {
  lazyObserver?.disconnect();
  viewObserver?.disconnect();
});
</script>

<style scoped>
.file-inline {
  height: 100%;
}

.placeholder {
  min-height: 160px;
  height: 100%;
  border-radius: 12px;
  background: rgba(var(--v-theme-on-surface), 0.04);
}

.media {
  display: block;
  max-width: 100%;
  max-height: 80vh;
  margin: 0 auto;
  border-radius: 12px;
}

.media--fill {
  width: 100%;
  height: 100%;
  max-height: none;
  object-fit: contain;
  background: #000;
}

img.media--fill {
  background: transparent;
}

.video-holder {
  height: 100%;
}

.video-floating {
  position: fixed;
  right: 12px;
  bottom: 12px;
  width: min(62vw, 320px);
  z-index: 2400;
  border-radius: 12px;
  background: #000;
}

.video-floating .media {
  border-radius: 12px;
}

.floating-close {
  position: absolute;
  top: -10px;
  left: -10px;
}

.pdf-frame {
  width: 100%;
  height: 85vh;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 12px;
}

.pdf-frame--fill {
  height: 100%;
}

.text-preview {
  white-space: pre-wrap;
  font-family: ui-monospace, "Cascadia Code", Consolas, monospace;
  font-size: 0.9rem;
  background: rgba(var(--v-theme-on-surface), 0.04);
  padding: 16px;
  border-radius: 12px;
  max-height: 70vh;
  overflow: auto;
}
</style>
