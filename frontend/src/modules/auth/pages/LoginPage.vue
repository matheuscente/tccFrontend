<template>
  <AuthShell title="Entrar">
    <v-form ref="form" @submit.prevent="handleLogin">
      <v-text-field
        v-model="username"
        label="Usuário ou e-mail"
        prepend-inner-icon="mdi-account-outline"
        autocomplete="username"
        :rules="[required('Usuário ou e-mail'), minLength(4, 'Usuário ou e-mail')]"
        :error-messages="fieldErrors.username"
        class="mb-2"
        autofocus
      />

      <v-text-field
        v-model="password"
        label="Senha"
        prepend-inner-icon="mdi-lock-outline"
        :type="showPassword ? 'text' : 'password'"
        :append-inner-icon="showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
        autocomplete="current-password"
        :rules="[required('Senha'), minLength(8, 'Senha')]"
        :error-messages="fieldErrors.password"
        class="mb-1"
        @click:append-inner="showPassword = !showPassword"
      />

      <div class="text-right mb-4">
        <router-link :to="{ name: routeProps.forgotPassword.name }" class="text-body-medium text-primary">
          Esqueci minha senha
        </router-link>
      </div>

      <v-alert v-if="loginError" type="error" variant="tonal" density="compact" class="mb-4 pre-line">
        {{ loginError }}
      </v-alert>

      <v-btn block color="primary" size="large" type="submit" :loading="loading">Entrar</v-btn>
    </v-form>

    <v-divider class="my-5" />

    <div class="text-center text-body-medium">
      Ainda não tem conta?
      <router-link :to="{ name: routeProps.register.name }" class="text-primary font-weight-medium">Cadastre-se</router-link>
    </div>
  </AuthShell>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { VForm } from "vuetify/components";
import AuthShell from "@/components/auth/AuthShell.vue";
import { useAuthStore } from "../stores/auth.store";
import { routeProps } from "@/router/RouteProps";
import { minLength, required } from "@/utils/rules";
import { splitApiErrors } from "@/utils/apiErrors";
import { isError } from "@/services/api/isError.typeGuard";

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const form = ref<VForm | null>(null);
const username = ref("");
const password = ref("");
const showPassword = ref(false);
const loading = ref(false);
const loginError = ref<string>();
const fieldErrors = ref<Record<string, string>>({});

const safeRedirect = (): string | null => {
  const redirect = route.query.redirect;
  // só caminhos internos: "//host" ou "/\host" seriam tratados como outra origem
  return typeof redirect === "string" && /^\/(?![/\\])/.test(redirect) ? redirect : null;
};

const handleLogin = async () => {
  if (!form.value) return;

  loginError.value = undefined;
  fieldErrors.value = {};

  const { valid } = await form.value.validate();
  if (!valid) return;

  loading.value = true;
  try {
    const response = await authStore.login(username.value.trim(), password.value);

    if (isError(response)) {
      const { fields, general } = splitApiErrors(response);
      fieldErrors.value = fields;
      loginError.value = general;
      return;
    }

    await router.push(safeRedirect() ?? { name: routeProps.home.name });
  } finally {
    loading.value = false;
  }
};

watch([username, password], () => {
  fieldErrors.value = {};
  loginError.value = undefined;
});
</script>
