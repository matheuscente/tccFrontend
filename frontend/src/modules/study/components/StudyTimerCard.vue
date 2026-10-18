<template>
  <v-card :color="timer.active ? 'success' : undefined" :variant="timer.active ? 'tonal' : 'elevated'" class="h-100">
    <v-card-item>
      <template #prepend>
        <v-icon :icon="timer.active ? 'mdi-timer-sand' : 'mdi-timer-outline'" size="28" />
      </template>
      <v-card-title class="text-title-large">{{ timer.active ? "Estudando agora" : "Cronômetro de estudo" }}</v-card-title>
      <v-card-subtitle v-if="!timer.active">Escolha o que vai estudar e inicie o cronômetro</v-card-subtitle>
    </v-card-item>

    <v-card-text>
      <template v-if="timer.active">
        <div class="timer-display font-weight-bold my-2">{{ formatDuration(timer.elapsedSeconds) }}</div>
        <ScopeLabel :scope="timer.active" />
        <div class="text-body-small text-medium-emphasis mt-1">Iniciado em {{ formatDateTime(timer.active.startedAt) }}</div>
      </template>

      <template v-else>
        <v-alert v-if="!structure.courses.length" type="info" variant="tonal" density="compact">
          Cadastre um curso para poder registrar sessões de estudo.
        </v-alert>
        <v-form v-else ref="form">
          <ScopeSelect v-model="scope" required stacked />
        </v-form>
      </template>
    </v-card-text>

    <v-card-actions class="px-4 pb-4">
      <v-btn
        v-if="timer.active"
        color="error"
        variant="flat"
        size="large"
        prepend-icon="mdi-stop"
        :loading="loading"
        @click="finish"
      >
        Finalizar sessão
      </v-btn>
      <v-btn
        v-else
        color="success"
        variant="flat"
        size="large"
        prepend-icon="mdi-play"
        :loading="loading"
        :disabled="!structure.courses.length"
        @click="start"
      >
        Iniciar
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { VForm } from "vuetify/components";
import ScopeSelect from "@/components/ScopeSelect.vue";
import ScopeLabel from "@/components/ScopeLabel.vue";
import { useTimerStore } from "../stores/timer.store";
import { useStructureStore } from "@/stores/structure.store";
import { useNotifyStore } from "@/stores/notify.store";
import type { Scope } from "@/modules/courses/models/structure.model";
import { firstErrorMessage } from "@/utils/apiErrors";
import { formatDateTime, formatDuration, formatMinutes } from "@/utils/date";


const emit = defineEmits<{ finished: [] , started: [] }>();

const timer = useTimerStore();
const structure = useStructureStore();
const notify = useNotifyStore();

const form = ref<VForm | null>(null);
const scope = ref<Scope>({});
const loading = ref(false);

const start = async () => {
  if (!form.value) return;
  const { valid } = await form.value.validate();
  if (!valid) return;

  loading.value = true;
  try {
    const error = await timer.start(scope.value);
    if (error) {
      notify.error(firstErrorMessage(error));
      return;
    }
    notify.success("Cronômetro iniciado. Bons estudos!");
    emit("started");
  } finally {
    loading.value = false;
  }
};

const finish = async () => {
  loading.value = true;
  try {
    const result = await timer.finish();
    if (result && "state" in result) {
      notify.error(firstErrorMessage(result));
      return;
    }
    notify.success(result ? `Sessão registrada: ${formatMinutes(result.minutes)} de estudo.` : "Sessão finalizada.");
    scope.value = {};
    emit("finished");
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.timer-display {
  font-size: clamp(2.5rem, 8vw, 4rem);
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}
</style>
