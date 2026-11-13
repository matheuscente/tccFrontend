<template>
  <v-main class="d-flex align-center justify-center" style="min-height: 100vh">
    <div class="text-center pa-6">
      <v-icon icon="mdi-map-marker-question-outline" size="72" color="primary" class="mb-4" />
      <h1 class="text-headline-medium mb-2">Página não encontrada</h1>
      <p class="text-body-large text-medium-emphasis mb-6">O endereço acessado não existe ou foi removido.</p>
      <v-btn color="primary" :to="{ name: routeProps.home.name }" prepend-icon="mdi-home-outline">Ir para o início</v-btn>
    </div>
  </v-main>
</template>

<script setup lang="ts">
import { routeProps } from "@/router/RouteProps";
</script>
