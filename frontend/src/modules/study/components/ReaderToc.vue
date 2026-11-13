<template>
  <nav aria-label="Sumário">
    <div class="text-label-large text-medium-emphasis px-3 mb-2">Sumário</div>
    <v-list density="compact" nav class="py-0">
      <template v-for="section in sections" :key="section.id">
        <v-list-item
          :title="section.title"
          :class="`depth-${section.depth}`"
          class="font-weight-medium"
          rounded="lg"
          @click="emit('go', `section-${section.id}`)"
        />
        <v-list-item
          v-for="item in section.items"
          :key="item.id"
          :prepend-icon="item.type === 'note' ? 'mdi-notebook-outline' : fileIcon(item.file.mimeType)"
          :title="item.type === 'note' ? item.note.title || 'Sem título' : item.file.originalName"
          :class="`depth-${section.depth + 1}`"
          class="text-medium-emphasis"
          rounded="lg"
          @click="emit('go', `item-${item.id}`)"
        />
      </template>
    </v-list>
  </nav>
</template>

<script setup lang="ts">
import { fileIcon } from "@/modules/files/utils/fileKind";
import type { ReaderSection } from "../models/interfaces/ReaderSection.interface";

defineProps<{ sections: ReaderSection[] }>();
const emit = defineEmits<{ go: [id: string] }>();
</script>

<style scoped>
.depth-1 { margin-left: 12px; }
.depth-2 { margin-left: 24px; }
.depth-3 { margin-left: 36px; }

:deep(.v-list-item__prepend > .v-icon) {
  margin-inline-end: 8px;
}
</style>
