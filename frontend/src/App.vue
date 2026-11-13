<template>
  <v-app>
    <router-view />
    <AppFeedback />
  </v-app>
</template>

<script setup lang="ts">
import AppFeedback from "@/components/AppFeedback.vue";
</script>
