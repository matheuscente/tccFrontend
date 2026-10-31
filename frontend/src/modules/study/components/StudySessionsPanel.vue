<template>
  <div>
    <v-row class="mb-2">
      <v-col v-if="!fixed" cols="12" lg="7">
        <StudyTimerCard />
      </v-col>

      <v-col cols="12" :lg="fixed ? 12 : 5">
        <v-card class="h-100">
          <v-card-item>
            <template #prepend><v-icon icon="mdi-pencil-plus-outline" size="28" /></template>
            <v-card-title class="text-title-large">Registro manual</v-card-title>
            <v-card-subtitle>Estudou sem o cronômetro? Registre aqui</v-card-subtitle>
          </v-card-item>
          <v-card-text>
            <v-alert v-if="!structure.courses.length" type="info" variant="tonal" density="compact">
              Cadastre um curso para registrar sessões.
            </v-alert>
            <v-form v-else ref="manualForm" @submit.prevent="register">
              <ScopeSelect v-if="!fixed" v-model="manual.scope" required stacked />
              <v-row density="compact" class="mt-3">
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.number="manual.minutes"
                    type="number"
                    min="1"
                    max="1440"
                    label="Minutos estudados"
                    :rules="[positiveInteger('Minutos'), (v: number) => v <= 1440 || 'Máximo de 1440 minutos.']"
                    :error-messages="manualErrors.minutes"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="manual.date"
                    type="date"
                    label="Data"
                    :max="todayInput()"
                    :rules="[required('Data'), notFuture]"
                    :error-messages="manualErrors.studiedAt"
                  />
                </v-col>
              </v-row>
              <v-btn type="submit" color="primary" variant="flat" prepend-icon="mdi-content-save-outline" :loading="registering">Registrar</v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-card>
      <v-card-item>
        <v-card-title class="text-title-large">Histórico</v-card-title>
        <v-card-subtitle>{{ completed.length }} sessão(ões) · {{ formatMinutes(totalMinutes) }} no total</v-card-subtitle>
        <template #append>
          <v-btn icon="mdi-refresh" variant="text" aria-label="Atualizar" :loading="loading" @click="load" />
        </template>
      </v-card-item>

      <v-data-table
        :headers="headers"
        :items="visible"
        :loading="loading"
        :items-per-page="10"
        :sort-by="[{ key: 'studiedAt', order: 'desc' }]"
        no-data-text="Nenhuma sessão registrada ainda."
        loading-text="Carregando..."
        items-per-page-text="Por página"
        density="comfortable"
      >
        <template #[`item.studiedAt`]="{ item }">{{ formatDay(item.studiedAt) }}</template>
        <template #[`item.scope`]="{ item }"><ScopeLabel :scope="item" /></template>
        <template #[`item.minutes`]="{ item }">
          {{ item.status === "IN_PROGRESS" ? "—" : formatMinutes(item.minutes) }}
        </template>
        <template #[`item.status`]="{ item }">
          <v-chip size="small" :color="item.status === 'COMPLETED' ? 'success' : 'warning'" variant="tonal">
            {{ item.status === "COMPLETED" ? "Concluída" : "Em andamento" }}
          </v-chip>
        </template>
        <template #[`item.actions`]="{ item }">
          <div class="d-flex justify-end">
            <v-btn
              v-if="item.status === 'COMPLETED'"
              icon="mdi-pencil-outline"
              variant="text"
              size="small"
              aria-label="Editar"
              @click="openEdit(item)"
            />
            <v-btn icon="mdi-delete-outline" variant="text" size="small" color="error" aria-label="Excluir" @click="remove(item)" />
          </div>
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="editDialog" max-width="460" persistent>
      <v-card>
        <v-card-title class="text-title-large pt-5 px-6">Editar sessão</v-card-title>
        <v-card-text class="px-6">
          <ScopeLabel v-if="editing" :scope="editing" class="mb-4 d-block" />
          <v-form ref="editForm" @submit.prevent="saveEdit">
            <v-text-field
              v-model.number="edit.minutes"
              type="number"
              min="1"
              label="Minutos"
              :rules="[positiveInteger('Minutos')]"
              class="mb-2"
            />
            <v-text-field v-model="edit.date" type="date" label="Data" :max="todayInput()" :rules="[required('Data'), notFuture]" />
          </v-form>
        </v-card-text>
        <v-card-actions class="px-6 pb-4">
          <v-spacer />
          <v-btn variant="text" @click="editDialog = false">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" :loading="saving" @click="saveEdit">Salvar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import type { VForm } from "vuetify/components";
import ScopeSelect from "@/components/ScopeSelect.vue";
import ScopeLabel from "@/components/ScopeLabel.vue";
import StudyTimerCard from "./StudyTimerCard.vue";
import { hasScope, scopeOf } from "@/utils/scope";
import { studySessionService } from "../services/study-session.service";
import type { StudySessionDTO } from "../models/DTO/StudySessionDto";
import type { Scope } from "@/modules/courses/models/interfaces/Scope.interface";
import { useStructureStore } from "@/stores/structure.store";
import { useAuthStore } from "@/modules/auth/stores/auth.store";
import { useTimerStore } from "../stores/timer.store";
import { useConfirmStore } from "@/stores/confirm.store";
import { useNotifyStore } from "@/stores/notify.store";
import { useApi } from "@/composables/useApi";
import { isError } from "@/services/api/isError.typeGuard";
import { splitApiErrors } from "@/utils/apiErrors";
import { formatDay, formatMinutes, inputToApiDate, isoToInputDate, todayInput } from "@/utils/date";
import { notFuture, positiveInteger, required } from "@/utils/rules";

const props = withDefaults(defineProps<{ scope?: Scope | null }>(), { scope: null });
const emit = defineEmits<{ changed: [] }>();

const structure = useStructureStore();
const auth = useAuthStore();
const timer = useTimerStore();
const confirm = useConfirmStore();
const notify = useNotifyStore();
const { run } = useApi();

const headers = [
  { title: "Data", key: "studiedAt" },
  { title: "Conteúdo", key: "scope", sortable: false },
  { title: "Duração", key: "minutes" },
  { title: "Status", key: "status" },
  { title: "", key: "actions", sortable: false, align: "end" as const },
];

const loading = ref(false);
const sessions = ref<StudySessionDTO[]>([]);

const fixed = computed(() => hasScope(props.scope));
const fixedScope = computed<Scope>(() => (fixed.value ? scopeOf(props.scope ?? {}) : {}));
const visible = computed(() => (fixed.value ? sessions.value.filter((session) => structure.contains(fixedScope.value, session)) : sessions.value));
const completed = computed(() => visible.value.filter((session) => session.status === "COMPLETED"));
const totalMinutes = computed(() => completed.value.reduce((total, session) => total + session.minutes, 0));

const load = async () => {
  loading.value = true;
  try {
    sessions.value = (await run(studySessionService.listByUser(auth.userId))) ?? [];
  } finally {
    loading.value = false;
  }
};

const manualForm = ref<VForm | null>(null);
const manual = reactive({ scope: {} as Scope, minutes: 30, date: todayInput() });
watch(fixedScope, (value) => { if (fixed.value) manual.scope = { ...value }; }, { immediate: true });
const manualErrors = ref<Record<string, string>>({});
const registering = ref(false);

const register = async () => {
  if (!manualForm.value) return;
  manualErrors.value = {};
  const { valid } = await manualForm.value.validate();
  if (!valid) return;

  registering.value = true;
  try {
    const response = await studySessionService.register({
      ...manual.scope,
      minutes: Number(manual.minutes),
      studiedAt: inputToApiDate(manual.date),
    });
    if (isError(response)) {
      const { fields, general } = splitApiErrors(response);
      manualErrors.value = fields;
      if (general) notify.error(general);
      return;
    }
    notify.success("Sessão registrada.");
    manual.minutes = 30;
    emit("changed");
    await load();
  } finally {
    registering.value = false;
  }
};

const editDialog = ref(false);
const editForm = ref<VForm | null>(null);
const editing = ref<StudySessionDTO | null>(null);
const edit = reactive({ minutes: 0, date: "" });
const saving = ref(false);

const openEdit = (session: StudySessionDTO) => {
  editing.value = session;
  edit.minutes = session.minutes;
  edit.date = isoToInputDate(session.studiedAt);
  editDialog.value = true;
};

const saveEdit = async () => {
  if (!editForm.value || !editing.value) return;
  const { valid } = await editForm.value.validate();
  if (!valid) return;

  saving.value = true;
  try {
    const result = await run(
      studySessionService.update(editing.value.id, { minutes: Number(edit.minutes), studiedAt: inputToApiDate(edit.date) }),
      "Sessão atualizada.",
    );
    if (result) {
      editDialog.value = false;
      emit("changed");
      await load();
    }
  } finally {
    saving.value = false;
  }
};

const remove = async (session: StudySessionDTO) => {
  const ok = await confirm.ask({
    title: "Excluir sessão",
    message: session.status === "IN_PROGRESS"
      ? "Esta sessão está em andamento. Excluir vai descartar o tempo do cronômetro."
      : `Excluir a sessão de ${formatDay(session.studiedAt)} (${formatMinutes(session.minutes)})?`,
    confirmText: "Excluir",
  });
  if (!ok) return;
  if (await run(studySessionService.remove(session.id), "Sessão excluída.")) {
    emit("changed");
    if (timer.active?.id === session.id) timer.reset();
    else await load();
  }
};

// cobre início/fim do cronômetro feito por este card ou por outra tela
watch(() => timer.active?.id, () => load());

onMounted(async () => {
  await structure.load(auth.userId);
  await load();
});
</script>
