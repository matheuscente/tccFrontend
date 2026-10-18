<template>
  <v-dialog :model-value="modelValue" max-width="680" persistent scrollable @update:model-value="emit('update:modelValue', $event)">
    <v-card>
      <v-card-title class="text-title-large pt-5 px-6">{{ goal ? "Editar meta" : "Nova meta" }}</v-card-title>
      <v-card-text class="px-6">
        <v-form ref="form" @submit.prevent="submit">
          <v-text-field
            v-model="data.title"
            label="Título da meta"
            placeholder="Ex.: Revisar banco de dados"
            :rules="[required('Título'), minLength(3, 'Título'), maxLength(100, 'Título')]"
            :error-messages="fieldErrors.title"
            class="mb-2"
            autofocus
          />

          <template v-if="!goal">
            <v-select
              v-model="data.type"
              :items="typeItems"
              label="Tipo de meta"
              :rules="[required('Tipo')]"
              :error-messages="fieldErrors.type"
              :hint="typeHints[data.type]"
              persistent-hint
              class="mb-4"
            />
          </template>
          <v-alert v-else variant="tonal" density="compact" type="info" class="mb-4">
            {{ goalTypeLabels[goal.type] }} — {{ typeHints[goal.type] }}
          </v-alert>

          <div class="text-label-large mb-2">Tempo de estudo da meta</div>
          <v-row density="compact" class="mb-2">
            <v-col cols="6">
              <v-text-field v-model.number="data.hours" type="number" min="0" label="Horas" :rules="[nonNegative]" hide-details="auto" />
            </v-col>
            <v-col cols="6">
              <v-text-field v-model.number="data.minutes" type="number" min="0" max="59" label="Minutos" :rules="[nonNegative, (v: number) => v < 60 || 'Use até 59 minutos.']" hide-details="auto" />
            </v-col>
          </v-row>
          <div v-if="totalMinutesError" class="text-error text-body-small mb-2">{{ totalMinutesError }}</div>
          <div v-if="fieldErrors.targetMinutes" class="text-error text-body-small mb-2">{{ fieldErrors.targetMinutes }}</div>

          <v-row density="compact" class="mt-2">
            <v-col v-if="!goal" cols="12" sm="6">
              <v-text-field
                v-model="data.startDate"
                type="date"
                :label="currentType === 'DAILY_ONCE' ? 'Dia da meta' : 'Data de início'"
                :rules="[required('Data de início')]"
                :error-messages="fieldErrors.startDate"
              />
            </v-col>
            <v-col v-if="currentType !== 'DAILY_ONCE'" cols="12" sm="6">
              <v-text-field
                v-model="data.endDate"
                type="date"
                :label="endDateRequired ? 'Data final' : 'Data final (opcional)'"
                :min="goal ? isoToInputDate(goal.startDate) : data.startDate"
                :rules="[endDateRule]"
                :error-messages="fieldErrors.endDate"
                :clearable="!endDateRequired"
              />
            </v-col>
          </v-row>

          <ScopeSelect
            v-if="!goal"
            v-model="data.scope"
            required
            label="Vincular a"
            hint="A meta conta o tempo estudado no escopo escolhido (um curso inclui seus módulos e disciplinas)."
            class="mt-2"
          />

          <v-alert v-if="generalError" type="error" variant="tonal" density="compact" class="mt-4 pre-line">{{ generalError }}</v-alert>
        </v-form>
      </v-card-text>
      <v-card-actions class="px-6 pb-4">
        <v-spacer />
        <v-btn variant="text" @click="emit('update:modelValue', false)">Cancelar</v-btn>
        <v-btn color="primary" variant="flat" :loading="loading" @click="submit">Salvar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import type { VForm } from "vuetify/components";
import ScopeSelect from "@/components/ScopeSelect.vue";
import { goalService } from "../services/goal.service";
import { goalTypeLabels, type Goal, type GoalType } from "../models/goal.model";
import type { Scope } from "@/modules/courses/models/structure.model";
import { isError } from "@/services/api/isError.typeGuard";
import { splitApiErrors } from "@/utils/apiErrors";
import { inputToApiDate, isoToInputDate, todayInput } from "@/utils/date";
import { maxLength, minLength, required } from "@/utils/rules";

const props = withDefaults(defineProps<{ modelValue: boolean, goal?: Goal | null }>(), { goal: null });
const emit = defineEmits<{ "update:modelValue": [value: boolean], saved: [] }>();

const typeHints: Record<GoalType, string> = {
  DAILY_ONCE: "Estudar o tempo definido em um único dia.",
  DAILY_RECURRING: "Estudar o tempo definido todos os dias, a partir da data de início.",
  TOTAL_BY_DATE: "Acumular o tempo total até a data final.",
  TOTAL_IN_PERIOD: "Acumular o tempo total dentro do período (início e fim).",
};

const typeItems = (Object.keys(goalTypeLabels) as GoalType[]).map((value) => ({ value, title: goalTypeLabels[value] }));

const form = ref<VForm | null>(null);
const loading = ref(false);
const fieldErrors = ref<Record<string, string>>({});
const generalError = ref<string>();
const totalMinutesError = ref<string>();

const data = reactive({
  title: "",
  type: "DAILY_RECURRING" as GoalType,
  hours: 1,
  minutes: 0,
  startDate: todayInput(),
  endDate: "" as string | null,
  scope: {} as Scope,
});

const currentType = computed<GoalType>(() => props.goal?.type ?? data.type);
const endDateRequired = computed(() => currentType.value === "TOTAL_BY_DATE" || currentType.value === "TOTAL_IN_PERIOD");

const nonNegative = (value: number) => (value === null || value === undefined || (Number.isInteger(Number(value)) && Number(value) >= 0)) || "Use um número inteiro positivo.";

const endDateRule = (value: string | null) => {
  if (!value) return endDateRequired.value ? "Data final é obrigatória para este tipo de meta." : true;
  const start = props.goal ? isoToInputDate(props.goal.startDate) : data.startDate;
  return !start || value >= start || "A data final não pode ser anterior ao início.";
};

watch(() => props.modelValue, (open) => {
  if (!open) return;
  fieldErrors.value = {};
  generalError.value = undefined;
  totalMinutesError.value = undefined;

  const goal = props.goal;
  data.title = goal?.title ?? "";
  data.type = goal?.type ?? "DAILY_RECURRING";
  data.hours = goal ? Math.floor(goal.targetMinutes / 60) : 1;
  data.minutes = goal ? goal.targetMinutes % 60 : 0;
  data.startDate = goal ? isoToInputDate(goal.startDate) : todayInput();
  data.endDate = goal ? isoToInputDate(goal.endDate) : "";
  data.scope = {};
  form.value?.resetValidation();
});

const submit = async () => {
  if (!form.value) return;
  fieldErrors.value = {};
  generalError.value = undefined;
  totalMinutesError.value = undefined;

  const { valid } = await form.value.validate();
  const targetMinutes = Number(data.hours || 0) * 60 + Number(data.minutes || 0);
  if (targetMinutes <= 0) totalMinutesError.value = "Defina um tempo maior que zero.";
  if (!valid || targetMinutes <= 0) return;

  loading.value = true;
  try {
    const endDate = currentType.value === "DAILY_ONCE" || !data.endDate ? null : inputToApiDate(data.endDate);

    const response = props.goal
      ? await goalService.update(props.goal.id, {
          title: data.title.trim(),
          targetMinutes,
          ...(props.goal.type !== "DAILY_ONCE" ? { endDate } : {}),
        })
      : await goalService.create({
          title: data.title.trim(),
          type: data.type,
          targetMinutes,
          startDate: inputToApiDate(data.startDate),
          ...(endDate ? { endDate } : {}),
          ...data.scope,
        });

    if (isError(response)) {
      const { fields, general } = splitApiErrors(response);
      fieldErrors.value = fields;
      generalError.value = general;
      return;
    }

    emit("saved");
    emit("update:modelValue", false);
  } finally {
    loading.value = false;
  }
};
</script>
