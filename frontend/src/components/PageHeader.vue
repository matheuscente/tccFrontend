<template>
  <div class="d-flex flex-wrap align-center ga-3 mb-6">
    <v-btn v-if="back" icon="mdi-arrow-left" variant="text" :to="back" aria-label="Voltar" />
    <div class="flex-grow-1">
      <h1 class="text-headline-small font-weight-bold">{{ title }}</h1>
      <p v-if="subtitle" class="text-body-medium text-medium-emphasis mt-1">{{ subtitle }}</p>
    </div>
    <div class="d-flex flex-wrap ga-2">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RouteLocationRaw } from "vue-router";

defineProps<{ title: string, subtitle?: string, back?: RouteLocationRaw }>();
</script>
