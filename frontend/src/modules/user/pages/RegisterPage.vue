<template>
  <AuthShell title="Cadastre-se" subtitle="Crie sua conta para começar a organizar seus estudos">
    <v-form ref="form" @submit.prevent="handleRegister">
      <v-text-field
        v-model="formData.name"
        label="Nome completo"
        prepend-inner-icon="mdi-card-account-details-outline"
        autocomplete="name"
        :rules="[required('Nome'), minLength(5, 'Nome'), maxLength(50, 'Nome')]"
        :error-messages="fieldErrors.name"
        class="mb-2"
      />
      <v-text-field
        v-model="formData.email"
        label="E-mail"
        type="email"
        prepend-inner-icon="mdi-email-outline"
        autocomplete="email"
        :rules="[required('E-mail'), email]"
        :error-messages="fieldErrors.email"
        class="mb-2"
      />
      <v-text-field
        v-model="formData.username"
        label="Nome de usuário"
        prepend-inner-icon="mdi-account-outline"
        autocomplete="username"
        hint="De 5 a 20 caracteres: letras, números e _"
        :rules="[required('Nome de usuário'), minLength(5, 'Nome de usuário'), maxLength(20, 'Nome de usuário'), usernameRule]"
        :error-messages="fieldErrors.username"
        class="mb-2"
      />
      <v-text-field
        v-model="formData.birthDate"
        label="Data de nascimento"
        type="date"
        prepend-inner-icon="mdi-cake-variant-outline"
        :max="todayInput()"
        :rules="[required('Data de nascimento'), notFuture]"
        :error-messages="fieldErrors.birthDate"
        class="mb-2"
      />
      <v-text-field
        v-model="formData.password"
        label="Senha"
        :type="showPassword ? 'text' : 'password'"
        prepend-inner-icon="mdi-lock-outline"
        :append-inner-icon="showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
        autocomplete="new-password"
        hint="Mínimo de 8 caracteres, com letra maiúscula, minúscula e número"
        :rules="[strongPassword]"
        :error-messages="fieldErrors.password"
        class="mb-2"
        @click:append-inner="showPassword = !showPassword"
      />
      <v-text-field
        v-model="confirmPassword"
        label="Confirme a senha"
        :type="showPassword ? 'text' : 'password'"
        prepend-inner-icon="mdi-lock-check-outline"
        autocomplete="new-password"
        :rules="[(v: string) => v === formData.password || 'As senhas não conferem.']"
        class="mb-2"
      />

      <v-alert v-if="registerError" type="error" variant="tonal" density="compact" class="mb-4 pre-line">
        {{ registerError }}
      </v-alert>

      <v-btn block color="primary" size="large" type="submit" :loading="loading">Criar conta</v-btn>
      <v-btn block variant="text" class="mt-3" :to="{ name: routeProps.login.name }">Já tenho conta</v-btn>
    </v-form>
  </AuthShell>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
import type { VForm } from "vuetify/components";
import AuthShell from "@/components/auth/AuthShell.vue";
import { useAuthStore } from "@/modules/auth/stores/auth.store";
import { userService } from "../services/user.service";
import { routeProps } from "@/router/RouteProps";
import { isError } from "@/services/api/isError.typeGuard";
import { splitApiErrors } from "@/utils/apiErrors";
import { inputToApiDate, todayInput } from "@/utils/date";
import { email, maxLength, minLength, notFuture, required, strongPassword, username as usernameRule } from "@/utils/rules";
import { useNotifyStore } from "@/stores/notify.store";

const router = useRouter();
const authStore = useAuthStore();
const notify = useNotifyStore();

const form = ref<VForm | null>(null);
const formData = reactive({ name: "", email: "", username: "", birthDate: "", password: "" });
const confirmPassword = ref("");
const showPassword = ref(false);
const loading = ref(false);
const registerError = ref<string>();
const fieldErrors = ref<Record<string, string>>({});

const handleRegister = async () => {
  if (!form.value) return;

  registerError.value = undefined;
  fieldErrors.value = {};

  const { valid } = await form.value.validate();
  if (!valid) return;

  loading.value = true;
  try {
    const response = await userService.create({
      name: formData.name.trim(),
      email: formData.email.trim(),
      username: formData.username.trim(),
      password: formData.password,
      birthDate: inputToApiDate(formData.birthDate),
    });

    if (isError(response)) {
      const { fields, general } = splitApiErrors(response);
      fieldErrors.value = fields;
      registerError.value = general;
      return;
    }

    const loginError = await authStore.login(formData.username.trim(), formData.password);
    if (loginError) {
      notify.success("Conta criada! Faça login para continuar.");
      router.push({ name: routeProps.login.name });
      return;
    }

    notify.success("Conta criada com sucesso. Bem-vindo(a)!");
    router.push({ name: routeProps.home.name });
  } finally {
    loading.value = false;
  }
};

watch(formData, () => {
  fieldErrors.value = {};
  registerError.value = undefined;
});
</script>
