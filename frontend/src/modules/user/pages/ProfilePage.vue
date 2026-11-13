<template>
  <div>
    <PageHeader title="Meu perfil" subtitle="Gerencie seus dados pessoais, senha e conta" />

    <v-row>
      <v-col cols="12" lg="7">
        <v-card class="mb-4">
          <v-card-title class="text-title-medium">Dados pessoais</v-card-title>
          <v-card-text>
            <v-form ref="profileForm" @submit.prevent="saveProfile">
              <v-row density="compact">
                <v-col cols="12">
                  <v-text-field
                    v-model="profile.name"
                    label="Nome completo"
                    prepend-inner-icon="mdi-card-account-details-outline"
                    :rules="[required('Nome'), minLength(5, 'Nome'), maxLength(50, 'Nome')]"
                    :error-messages="profileErrors.name"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="profile.email"
                    label="E-mail"
                    type="email"
                    prepend-inner-icon="mdi-email-outline"
                    :rules="[required('E-mail'), email]"
                    :error-messages="profileErrors.email"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="profile.username"
                    label="Nome de usuário"
                    prepend-inner-icon="mdi-account-outline"
                    :rules="[required('Nome de usuário'), minLength(5, 'Nome de usuário'), maxLength(20, 'Nome de usuário'), usernameRule]"
                    :error-messages="profileErrors.username"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="profile.birthDate"
                    label="Data de nascimento"
                    type="date"
                    prepend-inner-icon="mdi-cake-variant-outline"
                    :max="todayInput()"
                    :rules="[required('Data de nascimento'), notFuture]"
                    :error-messages="profileErrors.birthDate"
                  />
                </v-col>
              </v-row>
              <v-alert v-if="profileError" type="error" variant="tonal" density="compact" class="mb-3 pre-line">{{ profileError }}</v-alert>
              <div class="d-flex justify-end ga-2">
                <v-btn variant="text" :disabled="!dirty || savingProfile" @click="fillProfile">Descartar</v-btn>
                <v-btn color="primary" type="submit" :disabled="!dirty" :loading="savingProfile">Salvar alterações</v-btn>
              </div>
            </v-form>
          </v-card-text>
        </v-card>

        <v-card class="mb-4">
          <v-card-title class="text-title-medium">Alterar senha</v-card-title>
          <v-card-text>
            <v-form ref="passwordForm" @submit.prevent="savePassword">
              <v-text-field
                v-model="passwords.old"
                label="Senha atual"
                :type="showPasswords ? 'text' : 'password'"
                prepend-inner-icon="mdi-lock-outline"
                autocomplete="current-password"
                :rules="[required('Senha atual')]"
                :error-messages="passwordErrors.oldPassword"
                class="mb-2"
              />
              <v-text-field
                v-model="passwords.new"
                label="Nova senha"
                :type="showPasswords ? 'text' : 'password'"
                prepend-inner-icon="mdi-lock-reset"
                :append-inner-icon="showPasswords ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
                autocomplete="new-password"
                hint="Mínimo de 8 caracteres, com letra maiúscula, minúscula e número"
                :rules="[strongPassword, (v: string) => v !== passwords.old || 'A nova senha deve ser diferente da atual.']"
                :error-messages="passwordErrors.newPassword"
                class="mb-2"
                @click:append-inner="showPasswords = !showPasswords"
              />
              <v-text-field
                v-model="passwords.confirm"
                label="Confirme a nova senha"
                :type="showPasswords ? 'text' : 'password'"
                prepend-inner-icon="mdi-lock-check-outline"
                autocomplete="new-password"
                :rules="[(v: string) => v === passwords.new || 'As senhas não conferem.']"
                class="mb-2"
              />
              <v-alert v-if="passwordError" type="error" variant="tonal" density="compact" class="mb-3 pre-line">{{ passwordError }}</v-alert>
              <div class="d-flex justify-end">
                <v-btn color="primary" type="submit" :loading="savingPassword">Alterar senha</v-btn>
              </div>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" lg="5">
        <v-card class="mb-4">
          <v-card-text class="d-flex align-center ga-4">
            <v-avatar color="primary" variant="tonal" size="64">
              <v-icon icon="mdi-account" size="36" />
            </v-avatar>
            <div>
              <div class="text-title-large font-weight-bold">{{ auth.user?.name }}</div>
              <div class="text-body-medium text-medium-emphasis">@{{ auth.user?.username }}</div>
              <v-chip size="small" class="mt-2" :color="auth.isAdmin ? 'primary' : undefined" variant="tonal">
                {{ auth.isAdmin ? "Administrador" : "Estudante" }}
              </v-chip>
            </div>
          </v-card-text>
          <v-divider />
          <v-card-text class="text-body-medium text-medium-emphasis">
            Membro desde {{ formatDateTime(auth.user?.createdAt) }}
          </v-card-text>
        </v-card>

        <v-card border="error md" variant="outlined" class="danger">
          <v-card-title class="text-title-medium text-error">Excluir conta</v-card-title>
          <v-card-text class="text-body-medium">
            Sua conta será desativada e você perderá o acesso a cursos, metas, sessões, questões, atividades e notas.
            Esta ação não pode ser desfeita por você.
          </v-card-text>
          <v-card-actions class="px-4 pb-4">
            <v-btn color="error" variant="flat" prepend-icon="mdi-account-remove-outline" :loading="deleting" @click="deleteAccount">
              Excluir minha conta
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
import type { VForm } from "vuetify/components";
import PageHeader from "@/components/PageHeader.vue";
import { useAuthStore } from "@/modules/auth/stores/auth.store";
import { useConfirmStore } from "@/stores/confirm.store";
import { useNotifyStore } from "@/stores/notify.store";
import { useStructureStore } from "@/stores/structure.store";
import { routeProps } from "@/router/RouteProps";
import { isError } from "@/services/api/isError.typeGuard";
import { firstErrorMessage, splitApiErrors } from "@/utils/apiErrors";
import { formatDateTime, inputToApiDate, isoToInputDate, todayInput } from "@/utils/date";
import { email, maxLength, minLength, notFuture, required, strongPassword, username as usernameRule } from "@/utils/rules";
import { userService } from "../services/user.service";
import type { UpdateUserDTO } from "../models/DTO/UpdateUserDto";

const auth = useAuthStore();
const confirm = useConfirmStore();
const notify = useNotifyStore();
const structure = useStructureStore();
const router = useRouter();

const profileForm = ref<VForm | null>(null);
const passwordForm = ref<VForm | null>(null);

const profile = reactive({ name: "", email: "", username: "", birthDate: "" });
const profileErrors = ref<Record<string, string>>({});
const profileError = ref<string>();
const savingProfile = ref(false);

const passwords = reactive({ old: "", new: "", confirm: "" });
const passwordErrors = ref<Record<string, string>>({});
const passwordError = ref<string>();
const savingPassword = ref(false);
const showPasswords = ref(false);

const deleting = ref(false);

const original = computed(() => ({
  name: auth.user?.name ?? "",
  email: auth.user?.email ?? "",
  username: auth.user?.username ?? "",
  birthDate: isoToInputDate(auth.user?.birthDate),
}));

const changes = computed<UpdateUserDTO>(() => {
  const data: UpdateUserDTO = {};
  // o backend salva o nome em maiúsculas: compara sem diferenciar
  if (profile.name.trim().toUpperCase() !== original.value.name.toUpperCase()) data.name = profile.name.trim();
  if (profile.email.trim().toLowerCase() !== original.value.email) data.email = profile.email.trim();
  if (profile.username.trim().toLowerCase() !== original.value.username) data.username = profile.username.trim();
  if (profile.birthDate && profile.birthDate !== original.value.birthDate) data.birthDate = inputToApiDate(profile.birthDate);
  return data;
});

const dirty = computed(() => Object.keys(changes.value).length > 0);

const fillProfile = () => {
  Object.assign(profile, original.value);
  profileErrors.value = {};
  profileError.value = undefined;
  profileForm.value?.resetValidation();
};

const saveProfile = async () => {
  if (!profileForm.value || !auth.userId) return;
  profileErrors.value = {};
  profileError.value = undefined;

  const { valid } = await profileForm.value.validate();
  if (!valid || !dirty.value) return;

  savingProfile.value = true;
  try {
    const response = await userService.update(auth.userId, changes.value);
    if (isError(response)) {
      const { fields, general } = splitApiErrors(response);
      profileErrors.value = fields;
      profileError.value = general;
      return;
    }
    await auth.loadUser();
    fillProfile();
    notify.success("Dados atualizados com sucesso.");
  } finally {
    savingProfile.value = false;
  }
};

const savePassword = async () => {
  if (!passwordForm.value || !auth.userId) return;
  passwordErrors.value = {};
  passwordError.value = undefined;

  const { valid } = await passwordForm.value.validate();
  if (!valid) return;

  savingPassword.value = true;
  try {
    const response = await userService.updatePassword(auth.userId, passwords.old, passwords.new);
    if (isError(response)) {
      const { fields, general } = splitApiErrors(response);
      passwordErrors.value = fields;
      passwordError.value = general;
      return;
    }
    passwords.old = "";
    passwords.new = "";
    passwords.confirm = "";
    passwordForm.value.resetValidation();
    notify.success("Senha alterada com sucesso.");
  } finally {
    savingPassword.value = false;
  }
};

const deleteAccount = async () => {
  if (!auth.userId) return;
  const ok = await confirm.ask({
    title: "Excluir conta",
    message: "Tem certeza? Sua conta será desativada e todo o seu conteúdo deixará de estar disponível.",
    confirmText: "Excluir conta",
  });
  if (!ok) return;

  deleting.value = true;
  try {
    const response = await userService.remove(auth.userId);
    if (isError(response)) {
      notify.error(firstErrorMessage(response));
      return;
    }
    auth.clearSession();
    structure.clear();
    notify.info("Sua conta foi excluída.");
    router.push({ name: routeProps.login.name });
  } finally {
    deleting.value = false;
  }
};

watch(profile, () => {
  profileErrors.value = {};
  profileError.value = undefined;
});

watch(() => auth.user, fillProfile);

onMounted(fillProfile);
</script>
