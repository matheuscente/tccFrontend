<template>
  <span v-if="info.level" class="scope-label text-body-small text-medium-emphasis">
    <v-icon :icon="icon" size="14" class="mr-1" />{{ info.path.join(" › ") }}
  </span>
  <span v-else-if="showEmpty" class="text-body-small text-medium-emphasis">
    <v-icon icon="mdi-tag-off-outline" size="14" class="mr-1" />Sem vínculo
  </span>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useStructureStore } from "@/stores/structure.store";
import type { Scope } from "@/modules/courses/models/structure.model";

const props = withDefaults(defineProps<{ scope: Scope, showEmpty?: boolean }>(), { showEmpty: false });

const structure = useStructureStore();

const info = computed(() => structure.describe(props.scope));

const icon = computed(() => ({
  course: "mdi-school-outline",
  module: "mdi-folder-outline",
  discipline: "mdi-book-open-variant",
})[info.value.level ?? "course"]);
</script>

<style scoped>
.scope-label {
  display: inline-flex;
  align-items: center;
}
</style>
