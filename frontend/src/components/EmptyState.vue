<template>
  <v-card variant="outlined" class="empty-state text-center pa-8">
    <v-icon :icon="icon" size="56" color="medium-emphasis" class="mb-3" />
    <div class="text-title-medium mb-1">{{ title }}</div>
    <div v-if="text" class="text-body-medium text-medium-emphasis mb-4">{{ text }}</div>
    <slot />
  </v-card>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ title: string, text?: string, icon?: string }>(), { text: "", icon: "mdi-inbox-outline" });
</script>

<style scoped>
.empty-state {
  border-style: dashed;
}
</style>
