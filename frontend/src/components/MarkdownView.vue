<template>
  <div class="markdown" v-html="html" />
</template>

<script setup lang="ts">
import { computed } from "vue";
import { renderMarkdown } from "@/utils/markdown";

const props = defineProps<{ source: string }>();

const html = computed(() => renderMarkdown(props.source));
</script>

<style scoped>
.markdown {
  font-size: 1.0625rem;
  line-height: 1.75;
  overflow-wrap: anywhere;
}

.markdown :deep(h1),
.markdown :deep(h2),
.markdown :deep(h3),
.markdown :deep(h4) {
  line-height: 1.3;
  margin: 1.4em 0 0.5em;
  font-weight: 600;
}

.markdown :deep(h1) { font-size: 1.6rem; }
.markdown :deep(h2) { font-size: 1.35rem; }
.markdown :deep(h3) { font-size: 1.15rem; }

.markdown :deep(p),
.markdown :deep(ul),
.markdown :deep(ol),
.markdown :deep(blockquote),
.markdown :deep(pre),
.markdown :deep(table) {
  margin: 0 0 1em;
}

.markdown :deep(ul),
.markdown :deep(ol) {
  padding-left: 1.5em;
}

.markdown :deep(code) {
  font-family: ui-monospace, "Cascadia Code", Consolas, monospace;
  font-size: 0.9em;
  background: rgba(var(--v-theme-on-surface), 0.07);
  padding: 0.1em 0.35em;
  border-radius: 4px;
}

.markdown :deep(pre) {
  background: rgba(var(--v-theme-on-surface), 0.06);
  padding: 12px 16px;
  border-radius: 8px;
  overflow-x: auto;
}

.markdown :deep(pre code) {
  background: none;
  padding: 0;
}

.markdown :deep(blockquote) {
  border-left: 4px solid rgb(var(--v-theme-primary));
  padding: 0.2em 1em;
  color: rgba(var(--v-theme-on-surface), 0.75);
}

.markdown :deep(table) {
  border-collapse: collapse;
  display: block;
  overflow-x: auto;
}

.markdown :deep(th),
.markdown :deep(td) {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  padding: 6px 12px;
}

.markdown :deep(img) {
  max-width: 100%;
  border-radius: 8px;
}

.markdown :deep(a) {
  color: rgb(var(--v-theme-primary));
}

.markdown :deep(> :first-child) {
  margin-top: 0;
}
</style>
