<template>
  <AuthShell title="Esqueci minha senha" subtitle="Informe o e-mail da sua conta e enviaremos um link para criar uma nova senha">
    <v-alert v-if="sent" type="success" variant="tonal" class="mb-4">
      Se o e-mail estiver cadastrado, você receberá o link em instantes. Ele vale por 30 minutos.
    </v-alert>

    <v-form v-else ref="form" @submit.prevent="handleSubmit">
      <v-text-field
        v-model="emailValue"
        label="E-mail"
        type="email"
        prepend-inner-icon="mdi-email-outline"
        autocomplete="email"
        :rules="[required('E-mail'), email]"
        :error-messages="errorMessage"
        class="mb-4"
        autofocus
      />
      <v-btn block color="primary" size="large" type="submit" :loading="loading">Enviar link</v-btn>
    </v-form>

    <v-btn block variant="text" class="mt-3" prepend-icon="mdi-arrow-left" :to="{ name: routeProps.login.name }">Voltar para o login</v-btn>
  </AuthShell>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { VForm } from "vuetify/components";
import AuthShell from "@/components/auth/AuthShell.vue";
import { authService } from "../services/auth.service";
import { routeProps } from "@/router/RouteProps";
import { isError } from "@/services/api/isError.typeGuard";
import { firstErrorMessage } from "@/utils/apiErrors";
import { email, required } from "@/utils/rules";

const form = ref<VForm | null>(null);
const emailValue = ref("");
const loading = ref(false);
const sent = ref(false);
const errorMessage = ref<string>();

const handleSubmit = async () => {
  if (!form.value) return;
  errorMessage.value = undefined;

  const { valid } = await form.value.validate();
  if (!valid) return;

  loading.value = true;
  try {
    const response = await authService.forgotPassword(emailValue.value.trim());
    if (isError(response)) {
      errorMessage.value = firstErrorMessage(response);
      return;
    }
    sent.value = true;
  } finally {
    loading.value = false;
  }
};
</script>
