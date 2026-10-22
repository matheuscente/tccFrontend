<template>
  <v-dialog :model-value="modelValue" max-width="520" persistent @update:model-value="emit('update:modelValue', $event)">
    <v-card>
      <v-card-title class="text-title-large pt-5 px-6">{{ title }}</v-card-title>
      <v-card-text class="px-6">
        <v-form ref="form" @submit.prevent="submit">
          <v-text-field
            v-model="data.title"
            label="Título"
            :rules="[required('Título'), minLength(minTitle, 'Título'), maxLength(100, 'Título')]"
            :error-messages="fieldErrors.title"
            counter="100"
            class="mb-2"
            autofocus
          />
          <v-textarea
            v-model="data.description"
            label="Descrição (opcional)"
            :rules="[minLength(minDescription, 'Descrição'), maxLength(500, 'Descrição'), keepDescription]"
            :error-messages="fieldErrors.description"
            counter="500"
            rows="3"
            auto-grow
          />
          <v-alert v-if="generalError" type="error" variant="tonal" density="compact" class="mt-2 pre-line">{{ generalError }}</v-alert>
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
import { reactive, ref, watch } from "vue";
import type { VForm } from "vuetify/components";
import type { ApiResult } from "@/services/abstract/service.abstract";
import { isError } from "@/services/api/isError.typeGuard";
import { splitApiErrors } from "@/utils/apiErrors";
import { maxLength, minLength, required } from "@/utils/rules";
import type { TitledInputDTO } from "../models/DTO/TitledInputDto";

const props = withDefaults(defineProps<{
  modelValue: boolean
  title: string
  initial?: { title: string, description: string | null } | null
  minTitle?: number
  minDescription?: number
  allowClearDescription?: boolean
  save: (data: TitledInputDTO) => Promise<ApiResult<unknown>>
}>(), { initial: null, minTitle: 3, minDescription: 3, allowClearDescription: false });

const emit = defineEmits<{ "update:modelValue": [value: boolean], saved: [] }>();

const form = ref<VForm | null>(null);
const data = reactive({ title: "", description: "" });
const loading = ref(false);
const fieldErrors = ref<Record<string, string>>({});
const generalError = ref<string>();

watch(() => props.modelValue, (open) => {
  if (!open) return;
  data.title = props.initial?.title ?? "";
  data.description = props.initial?.description ?? "";
  fieldErrors.value = {};
  generalError.value = undefined;
  form.value?.resetValidation();
});

// cursos e módulos não aceitam descrição vazia nem nula na API; disciplinas aceitam null
const keepDescription = (value: unknown) =>
  props.allowClearDescription || !props.initial?.description || String(value ?? "").trim() !== ""
  || "A descrição não pode ser removida, apenas alterada.";

const submit = async () => {
  if (!form.value) return;
  fieldErrors.value = {};
  generalError.value = undefined;

  const { valid } = await form.value.validate();
  if (!valid) return;

  const description = data.description.trim();
  const payload: TitledInputDTO = { title: data.title.trim() };
  if (description) payload.description = description;
  else if (props.initial?.description && props.allowClearDescription) payload.description = null;

  loading.value = true;
  try {
    const response = await props.save(payload);
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
