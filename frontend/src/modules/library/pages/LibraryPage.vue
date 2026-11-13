<template>
  <div>
    <PageHeader title="Biblioteca" subtitle="Todos os seus materiais, notas, questões e atividades, de todos os cursos e também os sem vínculo" />

    <v-tabs v-model="tab" color="primary" show-arrows class="mb-4">
      <v-tab v-for="item in libraryTabs" :key="item.value" :value="item.value" :prepend-icon="item.icon">{{ item.title }}</v-tab>
    </v-tabs>

    <v-alert v-if="tab === 'files' || tab === 'notes'" type="info" variant="tonal" density="compact" icon="mdi-shield-lock-outline" class="mb-4">
      Notas e arquivos são privados: somente você pode vê-los (nem o administrador tem acesso).
    </v-alert>

    <FilesPanel v-if="tab === 'files'" />
    <NotesPanel v-else-if="tab === 'notes'" />
    <QuestionsPanel v-else-if="tab === 'questions'" />
    <ActivitiesPanel v-else />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import PageHeader from "@/components/PageHeader.vue";
import FilesPanel from "@/modules/files/components/FilesPanel.vue";
import NotesPanel from "@/modules/notes/components/NotesPanel.vue";
import QuestionsPanel from "@/modules/questions/components/QuestionsPanel.vue";
import ActivitiesPanel from "@/modules/activities/components/ActivitiesPanel.vue";
import { libraryTabs } from "../models/constants/library.constants";
import type { LibraryTab } from "../models/Types/LibraryTab";

const route = useRoute();
const router = useRouter();

const tab = computed<LibraryTab>({
  get: () => libraryTabs.find((item) => item.value === route.query.tab)?.value ?? "files",
  set: (value) => { void router.replace({ query: { ...route.query, tab: value } }); },
});
</script>
