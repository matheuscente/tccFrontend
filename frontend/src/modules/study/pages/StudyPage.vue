<template>
  <div>
    <PageHeader title="Sessões de estudo" subtitle="Use o cronômetro ou registre manualmente o tempo estudado" />
    <StudySessionsPanel />
  </div>
</template>

<script setup lang="ts">
import PageHeader from "@/components/PageHeader.vue";
import StudySessionsPanel from "../components/StudySessionsPanel.vue";
</script>
