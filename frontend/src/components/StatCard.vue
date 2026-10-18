<template>
  <v-card class="h-100" :to="to">
    <v-card-text class="d-flex align-center ga-4">
      <v-avatar :color="color" variant="tonal" size="48" rounded="lg">
        <v-icon :icon="icon" />
      </v-avatar>
      <div>
        <div class="text-body-small text-medium-emphasis">{{ label }}</div>
        <div class="text-title-large font-weight-bold">{{ value }}</div>
        <div v-if="caption" class="text-body-small text-medium-emphasis">{{ caption }}</div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type { RouteLocationRaw } from "vue-router";

withDefaults(defineProps<{
  label: string
  value: string | number
  icon: string
  color?: string
  caption?: string
  to?: RouteLocationRaw
}>(), { color: "primary", caption: "", to: undefined });
</script>
