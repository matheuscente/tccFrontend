<template>
  <div>
    <PageHeader title="Usuários" subtitle="Gerencie os usuários e acompanhe o progresso de cada um" />

    <v-card>
      <v-card-text>
        <v-text-field
          v-model="search"
          label="Buscar por nome, usuário ou e-mail"
          prepend-inner-icon="mdi-magnify"
          clearable
          hide-details
          density="compact"
          style="max-width: 420px"
        />
      </v-card-text>

      <v-data-table-server
        v-model:items-per-page="pageSize"
        v-model:page="page"
        :headers="headers"
        :items="users"
        :items-length="total"
        :loading="loading"
        :items-per-page-options="[10, 20, 50]"
        item-value="id"
        loading-text="Carregando usuários..."
        no-data-text="Nenhum usuário encontrado"
        @update:options="load"
      >
        <template #[`item.name`]="{ item }">
          <div class="py-2">
            <div class="font-weight-medium">{{ item.name }}</div>
            <div class="text-body-small text-medium-emphasis">@{{ item.username }}</div>
          </div>
        </template>
        <template #[`item.role`]="{ item }">
          <v-chip size="small" :color="item.role === 'ADMIN' ? 'primary' : undefined" variant="tonal" :prepend-icon="item.role === 'ADMIN' ? 'mdi-shield-crown-outline' : 'mdi-account-outline'">
            {{ item.role === "ADMIN" ? "Administrador" : "Usuário" }}
          </v-chip>
        </template>
        <template #[`item.createdAt`]="{ item }">{{ formatDateTime(item.createdAt) }}</template>
        <template #[`item.actions`]="{ item }">
          <div class="d-flex justify-end ga-1">
            <v-btn
              icon="mdi-chart-box-outline"
              size="small"
              variant="text"
              :to="{ name: routeProps.adminUserDetail.name, params: { id: item.id } }"
:aria-label="`Ver acompanhamento de ${item.name}`"
              v-tooltip="'Ver acompanhamento'"
            />
            <v-btn
              :icon="item.role === 'ADMIN' ? 'mdi-shield-remove-outline' : 'mdi-shield-plus-outline'"
              size="small"
              variant="text"
              :disabled="item.id === auth.userId"
              :loading="changingId === item.id"
              :aria-label="`${item.role === 'ADMIN' ? 'Remover administrador' : 'Tornar administrador'}: ${item.name}`"
              v-tooltip="item.id === auth.userId ? 'Você não pode alterar o próprio perfil' : (item.role === 'ADMIN' ? 'Remover administrador' : 'Tornar administrador')"
              @click="toggleRole(item)"
            />
          </div>
        </template>
      </v-data-table-server>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from "vue";
import PageHeader from "@/components/PageHeader.vue";
import { useApi } from "@/composables/useApi";
import { useLatest } from "@/composables/useLatest";
import { useAuthStore } from "@/modules/auth/stores/auth.store";
import { useConfirmStore } from "@/stores/confirm.store";
import { routeProps } from "@/router/RouteProps";
import { formatDateTime } from "@/utils/date";
import type { UserResponseDTO } from "@/modules/user/models/DTO/UserResponseDto";
import { adminService } from "../services/admin.service";

const auth = useAuthStore();
const confirm = useConfirmStore();
const { runOne } = useApi();
const latest = useLatest();

const headers = [
  { title: "Nome", key: "name", sortable: false },
  { title: "E-mail", key: "email", sortable: false },
  { title: "Perfil", key: "role", sortable: false },
  { title: "Cadastro", key: "createdAt", sortable: false },
  { title: "", key: "actions", sortable: false, align: "end" as const },
];

const users = ref<UserResponseDTO[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const search = ref<string | null>("");
const loading = ref(false);
const changingId = ref<string | null>(null);

const load = async () => {
  const request = latest.next();
  loading.value = true;
  try {
    const result = await runOne(adminService.listUsers({
      search: (search.value ?? "").trim() || undefined,
      page: page.value,
      pageSize: pageSize.value,
    }));
    if (!latest.isLatest(request)) return;
    users.value = result?.items ?? [];
    total.value = result?.total ?? 0;
  } finally {
    if (latest.isLatest(request)) loading.value = false;
  }
};

let debounce: ReturnType<typeof setTimeout> | undefined;
watch(search, () => {
  clearTimeout(debounce);
  debounce = setTimeout(() => {
    // voltar para a página 1 já dispara o load via update:options
    if (page.value !== 1) page.value = 1;
    else load();
  }, 400);
});

onBeforeUnmount(() => clearTimeout(debounce));

const toggleRole = async (user: UserResponseDTO) => {
  const toAdmin = user.role !== "ADMIN";
  const ok = await confirm.ask({
    title: toAdmin ? "Tornar administrador" : "Remover administrador",
    message: toAdmin
      ? `${user.name} terá acesso ao painel administrativo e aos chamados de todos os usuários.`
      : `${user.name} deixará de ter acesso ao painel administrativo.`,
    confirmText: toAdmin ? "Tornar administrador" : "Remover",
    color: toAdmin ? "primary" : "error",
  });
  if (!ok) return;

  changingId.value = user.id;
  try {
    const updated = await runOne(adminService.updateRole(user.id, toAdmin ? "ADMIN" : "USER"), "Perfil atualizado.");
    if (updated) users.value = users.value.map((item) => (item.id === updated.id ? updated : item));
  } finally {
    changingId.value = null;
  }
};
</script>
