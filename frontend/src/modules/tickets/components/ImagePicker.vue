<template>
  <div>
    <input ref="input" type="file" accept="image/png,image/jpeg,image/gif,image/webp" multiple hidden @change="onSelect" />
    <div class="d-flex flex-wrap align-center ga-2">
      <v-btn
        variant="tonal"
        size="small"
        prepend-icon="mdi-image-plus"
        :disabled="disabled || modelValue.length >= max"
        @click="input?.click()"
      >
        Anexar imagens
      </v-btn>
      <span class="text-body-small text-medium-emphasis">Até {{ max }} imagens (PNG, JPG, GIF ou WEBP, máx. 5 MB cada)</span>
    </div>

    <div v-if="previews.length" class="d-flex flex-wrap ga-2 mt-3">
      <div v-for="(preview, index) in previews" :key="preview.url" class="preview">
        <v-img :src="preview.url" width="72" height="72" cover class="rounded-lg" />
        <v-btn
          icon="mdi-close"
          size="x-small"
          color="error"
          class="preview__remove"
          :aria-label="`Remover ${preview.name}`"
          @click="remove(index)"
        />
      </div>
    </div>

    <div v-if="error" class="text-error text-body-small mt-2">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";

const props = withDefaults(defineProps<{ modelValue: File[], max?: number, disabled?: boolean }>(), { max: 5, disabled: false });
const emit = defineEmits<{ "update:modelValue": [files: File[]] }>();

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = /^image\/(png|jpe?g|gif|webp)$/;

const input = ref<HTMLInputElement | null>(null);
const error = ref("");
const urls = new Map<File, string>();

const previews = computed(() => props.modelValue.map((file) => {
  if (!urls.has(file)) urls.set(file, URL.createObjectURL(file));
  return { name: file.name, url: urls.get(file)! };
}));

const onSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const selected = Array.from(target.files ?? []);
  target.value = "";
  error.value = "";

  const valid: File[] = [];
  for (const file of selected) {
    if (!ALLOWED.test(file.type)) {
      error.value = `"${file.name}" não é uma imagem permitida.`;
      continue;
    }
    if (file.size > MAX_SIZE) {
      error.value = `"${file.name}" tem mais de 5 MB.`;
      continue;
    }
    valid.push(file);
  }

  const next = [...props.modelValue, ...valid];
  if (next.length > props.max) error.value = `Você pode anexar no máximo ${props.max} imagens.`;
  emit("update:modelValue", next.slice(0, props.max));
};

const remove = (index: number) => {
  const next = [...props.modelValue];
  next.splice(index, 1);
  emit("update:modelValue", next);
};

watch(() => props.modelValue, (files) => {
  for (const [file, url] of urls) {
    if (!files.includes(file)) {
      URL.revokeObjectURL(url);
      urls.delete(file);
    }
  }
  if (!files.length) error.value = "";
});

onBeforeUnmount(() => urls.forEach((url) => URL.revokeObjectURL(url)));
</script>

<style scoped>
.preview {
  position: relative;
}

.preview__remove {
  position: absolute;
  top: -8px;
  right: -8px;
}
</style>
