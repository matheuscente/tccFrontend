<template>
  <v-snackbar v-model="notify.visible" :color="notify.color" timeout="4000" location="bottom right" multi-line>
    <span class="multi-line">{{ notify.message }}</span>
    <template #actions>
      <v-btn variant="text" icon="mdi-close" aria-label="Fechar" @click="notify.visible = false" />
    </template>
  </v-snackbar>

  <v-dialog :model-value="confirm.visible" max-width="440" persistent>
    <v-card>
      <v-card-title class="text-title-large pt-5 px-6">{{ confirm.title }}</v-card-title>
      <v-card-text class="multi-line px-6">{{ confirm.message }}</v-card-text>
      <v-card-actions class="px-6 pb-4">
        <v-spacer />
        <v-btn variant="text" @click="confirm.answer(false)">Cancelar</v-btn>
        <v-btn :color="confirm.color" variant="flat" @click="confirm.answer(true)">{{ confirm.confirmText }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { useConfirmStore } from "@/stores/confirm.store";
import { useNotifyStore } from "@/stores/notify.store";

const notify = useNotifyStore();
const confirm = useConfirmStore();
</script>

<style scoped>
.multi-line {
  white-space: pre-line;
}
</style>
