<template>
  <AuthShell title="Redefinir senha" subtitle="Escolha uma nova senha para a sua conta">
    <v-alert v-if="!token" type="error" variant="tonal" class="mb-4">
      Link inválido. Solicite um novo link de redefinição.
    </v-alert>

    <template v-else-if="done">
      <v-alert type="success" variant="tonal" class="mb-4">Senha alterada com sucesso! Entre com a nova senha.</v-alert>
      <v-btn block color="primary" size="large" :to="{ name: routeProps.login.name }">Ir para o login</v-btn>
    </template>

    <v-form v-else ref="form" @submit.prevent="handleSubmit">
      <v-text-field
        v-model="password"
        label="Nova senha"
        :type="show ? 'text' : 'password'"
        prepend-inner-icon="mdi-lock-outline"
        :append-inner-icon="show ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
        autocomplete="new-password"
        hint="Mínimo de 8 caracteres, com letra maiúscula, minúscula e número"
        :rules="[strongPassword]"
        class="mb-2"
        @click:append-inner="show = !show"
      />
      <v-text-field
        v-model="confirmation"
        label="Confirme a nova senha"
        :type="show ? 'text' : 'password'"
        prepend-inner-icon="mdi-lock-check-outline"
        autocomplete="new-password"
        :rules="[(v: string) => v === password || 'As senhas não conferem.']"
        class="mb-2"
      />

      <v-alert v-if="errorMessage" type="error" variant="tonal" density="compact" class="mb-4 pre-line">{{ errorMessage }}</v-alert>

      <v-btn block color="primary" size="large" type="submit" :loading="loading">Salvar nova senha</v-btn>
    </v-form>

    <v-btn v-if="!done" block variant="text" class="mt-3" :to="{ name: routeProps.forgotPassword.name }">Solicitar novo link</v-btn>
  </AuthShell>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import type { VForm } from "vuetify/components";
import AuthShell from "@/components/auth/AuthShell.vue";
import { authService } from "../services/auth.service";
import { routeProps } from "@/router/RouteProps";
import { isError } from "@/services/api/isError.typeGuard";
import { firstErrorMessage } from "@/utils/apiErrors";
import { strongPassword } from "@/utils/rules";

const route = useRoute();
const token = computed(() => (typeof route.query.token === "string" ? route.query.token : ""));

const form = ref<VForm | null>(null);
const password = ref("");
const confirmation = ref("");
const show = ref(false);
const loading = ref(false);
const done = ref(false);
const errorMessage = ref<string>();

const handleSubmit = async () => {
  if (!form.value) return;
  errorMessage.value = undefined;

  const { valid } = await form.value.validate();
  if (!valid) return;

  loading.value = true;
  try {
    const response = await authService.resetPassword(token.value, password.value);
    if (isError(response)) {
      errorMessage.value = firstErrorMessage(response);
      return;
    }
    done.value = true;
  } finally {
    loading.value = false;
  }
};
</script>
