<template>
  <v-dialog v-model="open" max-width="620" persistent>
    <v-card>
      <v-card-title class="text-title-large pt-5 px-6">Novo chamado</v-card-title>
      <v-card-subtitle class="px-6 text-wrap">Descreva sua dúvida, problema ou sugestão. Nossa equipe responderá por aqui.</v-card-subtitle>
      <v-card-text class="px-6 pt-4">
        <v-form ref="form" @submit.prevent="submit">
          <v-text-field
            v-model="subject"
            label="Assunto"
            counter="150"
            :rules="[required('Assunto'), minLength(5, 'Assunto'), maxLength(150, 'Assunto')]"
            :error-messages="fieldErrors.subject"
            class="mb-2"
          />
          <v-select
            v-model="category"
            label="Categoria"
            :items="categoryItems"
            :rules="[required('Categoria')]"
            :error-messages="fieldErrors.category"
            class="mb-2"
          />
          <v-textarea
            v-model="message"
            label="Mensagem"
            rows="5"
            auto-grow
            counter="5000"
            :rules="[required('Mensagem'), minLength(2, 'Mensagem'), maxLength(5000, 'Mensagem')]"
            :error-messages="fieldErrors.message"
            class="mb-2"
          />
          <ImagePicker v-model="images" />
          <v-alert v-if="generalError" type="error" variant="tonal" density="compact" class="mt-4 pre-line">{{ generalError }}</v-alert>
        </v-form>
      </v-card-text>
      <v-card-actions class="px-6 pb-4">
        <v-spacer />
        <v-btn variant="text" :disabled="saving" @click="close">Cancelar</v-btn>
        <v-btn color="primary" variant="flat" :loading="saving" @click="submit">Enviar chamado</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import type { VForm } from "vuetify/components";
import { isError } from "@/services/api/isError.typeGuard";
import { splitApiErrors } from "@/utils/apiErrors";
import { maxLength, minLength, required } from "@/utils/rules";
import { useNotifyStore } from "@/stores/notify.store";
import ImagePicker from "./ImagePicker.vue";
import { ticketService } from "../services/ticket.service";
import { ticketCategoryLabels } from "../models/constants/ticket.constants";
import type { TicketDetailDTO } from "../models/DTO/TicketDetailDto";
import type { TicketCategory } from "../models/Types/TicketCategory";

const open = defineModel<boolean>({ default: false });
const emit = defineEmits<{ created: [ticket: TicketDetailDTO] }>();

const notify = useNotifyStore();

const categoryItems = (Object.keys(ticketCategoryLabels) as TicketCategory[]).map((value) => ({ value, title: ticketCategoryLabels[value] }));

const form = ref<VForm | null>(null);
const subject = ref("");
const category = ref<TicketCategory | null>(null);
const message = ref("");
const images = ref<File[]>([]);
const saving = ref(false);
const fieldErrors = ref<Record<string, string>>({});
const generalError = ref<string>();

const reset = () => {
  subject.value = "";
  category.value = null;
  message.value = "";
  images.value = [];
  fieldErrors.value = {};
  generalError.value = undefined;
  form.value?.resetValidation();
};

const close = () => {
  open.value = false;
};

watch(open, (value) => {
  if (value) reset();
});

const submit = async () => {
  if (!form.value) return;
  fieldErrors.value = {};
  generalError.value = undefined;

  const { valid } = await form.value.validate();
  if (!valid || !category.value) return;

  saving.value = true;
  try {
    const response = await ticketService.create(
      { subject: subject.value.trim(), category: category.value, message: message.value.trim() },
      images.value,
    );

    if (isError(response)) {
      const { fields, general } = splitApiErrors(response);
      fieldErrors.value = fields;
      generalError.value = general;
      return;
    }

    const ticket = response.data[0];
    notify.success("Chamado aberto com sucesso.");
    open.value = false;
    if (ticket) emit("created", ticket);
  } finally {
    saving.value = false;
  }
};
</script>
