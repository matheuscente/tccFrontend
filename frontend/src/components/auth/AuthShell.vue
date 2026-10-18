<template>
  <v-main class="auth-shell">
    <div class="auth-shell__inner">
      <div class="text-center mb-6">
        <v-avatar color="primary" size="56" rounded="lg" class="mb-3">
          <v-icon icon="mdi-book-education-outline" size="32" color="on-primary" />
        </v-avatar>
        <div class="text-headline-small font-weight-bold">My Study</div>
        <div class="text-body-medium text-medium-emphasis">Organize seus estudos em um só lugar</div>
      </div>

      <v-card class="pa-2 pa-sm-4" elevation="2">
        <v-card-title class="text-title-large text-center pt-4">{{ title }}</v-card-title>
        <v-card-subtitle v-if="subtitle" class="text-center text-wrap">{{ subtitle }}</v-card-subtitle>
        <v-card-text class="pt-4">
          <slot />
        </v-card-text>
      </v-card>
    </div>
  </v-main>
</template>

<script setup lang="ts">
defineProps<{ title: string, subtitle?: string }>();
</script>

<style scoped>
.auth-shell {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-shell__inner {
  width: 100%;
  max-width: 440px;
  padding: 24px 16px;
  margin-inline: auto;
}
</style>
