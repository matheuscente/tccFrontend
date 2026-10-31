<template>
  <div>
    <PageHeader title="Metas de estudo" subtitle="Defina objetivos de tempo e acompanhe o seu progresso" />
    <GoalsPanel />
  </div>
</template>

<script setup lang="ts">
import PageHeader from "@/components/PageHeader.vue";
import GoalsPanel from "../components/GoalsPanel.vue";
</script>
