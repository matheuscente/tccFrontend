<template>
  <v-dialog :model-value="modelValue" max-width="760" scrollable persistent @update:model-value="emit('update:modelValue', $event)">
    <v-card>
      <v-card-title class="text-title-large pt-5 px-6">{{ question ? "Editar questão" : "Nova questão" }}</v-card-title>

      <v-card-text class="px-6">
        <v-form ref="form" @submit.prevent="save">
          <v-btn-toggle
            v-model="type"
            mandatory
            color="primary"
            variant="outlined"
            divided
            density="comfortable"
            class="mb-4"
            :disabled="!!question"
          >
            <v-btn value="MULTIPLE_CHOICE" prepend-icon="mdi-format-list-bulleted">Múltipla escolha</v-btn>
            <v-btn value="TRUE_FALSE" prepend-icon="mdi-check-circle-outline">Verdadeiro ou falso</v-btn>
          </v-btn-toggle>

          <v-textarea
            v-model="statement"
            label="Enunciado"
            rows="3"
            auto-grow
            counter="3000"
            :rules="[required('Enunciado'), minLength(5, 'Enunciado'), maxLength(3000, 'Enunciado')]"
            :error-messages="fieldErrors.statement"
            class="mb-2"
          />

          <div class="text-label-large mb-2">
            Alternativas <span class="text-body-small text-medium-emphasis">(marque a correta)</span>
          </div>

          <v-radio-group v-model="correctIndex" hide-details class="mb-2">
            <div v-for="(option, index) in options" :key="index" class="d-flex align-center ga-2 mb-2">
              <v-radio :value="index" color="success" class="flex-grow-0" :aria-label="`Marcar alternativa ${index + 1} como correta`" />
              <v-text-field
                v-model="option.text"
                :label="`Alternativa ${letter(index)}`"
                :readonly="type === 'TRUE_FALSE'"
                :rules="[required('Alternativa'), maxLength(500, 'Alternativa')]"
                hide-details="auto"
                density="compact"
                :base-color="correctIndex === index ? 'success' : undefined"
              />
              <v-btn
                v-if="type === 'MULTIPLE_CHOICE'"
                icon="mdi-close"
                variant="text"
                size="small"
                :disabled="options.length <= 2"
                aria-label="Remover alternativa"
                @click="removeOption(index)"
              />
            </div>
          </v-radio-group>

          <v-btn
            v-if="type === 'MULTIPLE_CHOICE'"
            variant="tonal"
            prepend-icon="mdi-plus"
            size="small"
            :disabled="options.length >= 6"
            class="mb-4"
            @click="options.push({ text: '' })"
          >
            Adicionar alternativa
          </v-btn>

          <v-alert v-if="optionsError" type="warning" variant="tonal" density="compact" class="mb-4">{{ optionsError }}</v-alert>

          <v-textarea
            v-model="explanation"
            label="Explicação (opcional)"
            hint="Aparece na correção da atividade"
            rows="2"
            auto-grow
            counter="3000"
            :rules="[maxLength(3000, 'Explicação')]"
            class="mb-2"
          />

          <ScopeSelect
            v-if="!question"
            v-model="scope"
            required
            label="Vínculo"
            hint="A questão poderá ser usada em atividades deste escopo ou de escopos acima dele."
          />
          <div v-else class="text-body-small text-medium-emphasis">
            Vínculo: <ScopeLabel :scope="question" /> (não pode ser alterado)
          </div>

          <v-alert v-if="generalError" type="error" variant="tonal" density="compact" class="mt-4 pre-line">{{ generalError }}</v-alert>
        </v-form>
      </v-card-text>

      <v-card-actions class="px-6 pb-4">
        <v-spacer />
        <v-btn variant="text" @click="emit('update:modelValue', false)">Cancelar</v-btn>
        <v-btn color="primary" variant="flat" :loading="saving" @click="save">Salvar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { VForm } from "vuetify/components";
import ScopeSelect from "@/components/ScopeSelect.vue";
import ScopeLabel from "@/components/ScopeLabel.vue";
import { isError } from "@/services/api/isError.typeGuard";
import { splitApiErrors } from "@/utils/apiErrors";
import { maxLength, minLength, required } from "@/utils/rules";
import { useNotifyStore } from "@/stores/notify.store";
import type { Scope } from "@/modules/courses/models/structure.model";
import type { Question, QuestionType } from "../models/question.model";
import { questionService } from "../services/question.service";

const props = defineProps<{ modelValue: boolean, question: Question | null, defaultScope?: Scope }>();
const emit = defineEmits<{ "update:modelValue": [value: boolean], saved: [question: Question] }>();

const notify = useNotifyStore();

const form = ref<VForm | null>(null);
const type = ref<QuestionType>("MULTIPLE_CHOICE");
const statement = ref("");
const explanation = ref("");
const options = ref<{ text: string }[]>([]);
const correctIndex = ref<number | null>(null);
const scope = ref<Scope>({});
const saving = ref(false);
const generalError = ref<string>();
const fieldErrors = ref<Record<string, string>>({});
const triedSave = ref(false);

const letter = (index: number) => String.fromCharCode(65 + index);

const trueFalse = () => [{ text: "Verdadeiro" }, { text: "Falso" }];

const reset = () => {
  generalError.value = undefined;
  fieldErrors.value = {};
  triedSave.value = false;
  const q = props.question;
  if (q) {
    type.value = q.type;
    statement.value = q.statement;
    explanation.value = q.explanation ?? "";
    options.value = q.options.map((option) => ({ text: option.text }));
    const correct = q.options.findIndex((option) => option.isCorrect);
    correctIndex.value = correct >= 0 ? correct : null;
  } else {
    type.value = "MULTIPLE_CHOICE";
    statement.value = "";
    explanation.value = "";
    options.value = [{ text: "" }, { text: "" }, { text: "" }, { text: "" }];
    correctIndex.value = null;
    scope.value = { ...(props.defaultScope ?? {}) };
  }
};

watch(() => props.modelValue, (open) => { if (open) reset(); });

watch(type, (value, old) => {
  if (props.question || value === old) return;
  correctIndex.value = null;
  options.value = value === "TRUE_FALSE" ? trueFalse() : [{ text: "" }, { text: "" }, { text: "" }, { text: "" }];
});

const removeOption = (index: number) => {
  options.value.splice(index, 1);
  if (correctIndex.value === index) correctIndex.value = null;
  else if (correctIndex.value !== null && correctIndex.value > index) correctIndex.value--;
};

const optionsError = computed(() => {
  if (!triedSave.value) return "";
  if (correctIndex.value === null) return "Marque a alternativa correta.";
  const texts = options.value.map((option) => option.text.trim().toLowerCase());
  if (new Set(texts).size !== texts.length) return "As alternativas não podem se repetir.";
  return "";
});

const save = async () => {
  if (!form.value) return;
  triedSave.value = true;
  generalError.value = undefined;
  fieldErrors.value = {};

  const { valid } = await form.value.validate();
  if (!valid || optionsError.value) return;

  const payloadOptions = options.value.map((option, index) => ({ text: option.text.trim(), isCorrect: index === correctIndex.value }));

  saving.value = true;
  try {
    const response = props.question
      ? await questionService.update(props.question.id, {
          statement: statement.value.trim(),
          explanation: explanation.value.trim() || null,
          options: payloadOptions,
        })
      : await questionService.create({
          statement: statement.value.trim(),
          type: type.value,
          explanation: explanation.value.trim() || null,
          options: payloadOptions,
          ...scope.value,
        });

    if (isError(response)) {
      const { fields, general } = splitApiErrors(response);
      fieldErrors.value = fields;
      generalError.value = general ?? Object.values(fields).join("\n");
      return;
    }

    const saved = response.data[0];
    notify.success(props.question ? "Questão atualizada." : "Questão criada.");
    if (saved) emit("saved", saved);
    emit("update:modelValue", false);
  } finally {
    saving.value = false;
  }
};
</script>
