<template>
  <div>
    <PageHeader
      :title="adminMode ? 'Chamados' : 'Suporte (SAC)'"
      :subtitle="adminMode ? 'Atendimento das solicitações dos usuários' : 'Envie dúvidas, problemas técnicos ou sugestões'"
    >
      <template #actions>
        <v-btn v-if="!adminMode" color="primary" prepend-icon="mdi-plus" @click="dialog = true">Novo chamado</v-btn>
      </template>
    </PageHeader>

    <v-card class="mb-4">
      <v-card-text class="d-flex flex-wrap align-center ga-3">
        <v-chip-group v-model="status" selected-class="text-primary" class="flex-grow-1">
          <v-chip :value="null" variant="outlined" filter>Todos ({{ tickets.length }})</v-chip>
          <v-chip
            v-for="key in statusKeys"
            :key="key"
            :value="key"
            variant="outlined"
            filter
            :prepend-icon="ticketStatusInfo[key].icon"
          >
            {{ ticketStatusInfo[key].label }} ({{ counts[key] }})
          </v-chip>
        </v-chip-group>
        <v-text-field
          v-model="search"
          :label="adminMode ? 'Buscar por assunto ou usuário' : 'Buscar por assunto'"
          prepend-inner-icon="mdi-magnify"
          density="compact"
          hide-details
          clearable
          style="max-width: 320px; min-width: 220px"
        />
      </v-card-text>
    </v-card>

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-2" />

    <EmptyState
      v-if="!loading && filtered.length === 0"
      :title="tickets.length ? 'Nenhum chamado encontrado' : 'Nenhum chamado ainda'"
      :text="tickets.length ? 'Ajuste os filtros para ver outros chamados.' : (adminMode ? 'Os chamados abertos pelos usuários aparecerão aqui.' : 'Precisa de ajuda? Abra um chamado e responderemos por aqui.')"
      icon="mdi-lifebuoy"
    >
      <v-btn v-if="!adminMode && !tickets.length" color="primary" variant="tonal" @click="dialog = true">Abrir chamado</v-btn>
    </EmptyState>

    <v-card v-else-if="filtered.length">
      <v-data-table
        :headers="headers"
        :items="filtered"
        item-value="id"
        hover
        :items-per-page="15"
        :sort-by="[{ key: 'updatedAt', order: 'desc' }]"
        @click:row="(_: unknown, row: { item: TicketDTO }) => openTicket(row.item)"
        class="cursor-pointer"
      >
        <template #[`item.subject`]="{ item }">
          <div class="py-2">
            <div class="font-weight-medium">{{ item.subject }}</div>
            <v-chip v-if="badge(item)" size="x-small" :color="badge(item)!.color" variant="flat" class="mt-1">{{ badge(item)!.label }}</v-chip>
          </div>
        </template>
        <template #[`item.category`]="{ item }">{{ ticketCategoryLabels[item.category] }}</template>
        <template #[`item.status`]="{ item }">
          <v-chip size="small" :color="ticketStatusInfo[item.status].color" :prepend-icon="ticketStatusInfo[item.status].icon" variant="tonal">
            {{ ticketStatusInfo[item.status].label }}
          </v-chip>
        </template>
        <template #[`item.user`]="{ item }">
          <div>{{ item.user.name }}</div>
          <div class="text-body-small text-medium-emphasis">@{{ item.user.username }}</div>
        </template>
        <template #[`item.updatedAt`]="{ item }">{{ formatDateTime(item.lastMessageAt ?? item.updatedAt) }}</template>
      </v-data-table>
    </v-card>

    <NewTicketDialog v-if="!adminMode" v-model="dialog" @created="onCreated" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import PageHeader from "@/components/PageHeader.vue";
import EmptyState from "@/components/EmptyState.vue";
import { useApi } from "@/composables/useApi";
import { routeProps } from "@/router/RouteProps";
import { formatDateTime } from "@/utils/date";
import NewTicketDialog from "../components/NewTicketDialog.vue";
import { ticketService } from "../services/ticket.service";
import { useAuthStore } from "@/modules/auth/stores/auth.store";
import { ticketCategoryLabels, ticketStatusInfo } from "../models/constants/ticket.constants";
import type { TicketDetailDTO } from "../models/DTO/TicketDetailDto";
import type { TicketDTO } from "../models/DTO/TicketDto";
import type { TicketStatus } from "../models/Types/TicketStatus";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const { run } = useApi();

const adminMode = computed(() => route.meta.adminMode === true);

const statusKeys = Object.keys(ticketStatusInfo) as TicketStatus[];

const tickets = ref<TicketDTO[]>([]);
const loading = ref(false);
const status = ref<TicketStatus | null>(null);
const search = ref<string | null>("");
const dialog = ref(false);

const headers = computed(() => [
  { title: "Assunto", key: "subject", sortable: true },
  { title: "Categoria", key: "category", sortable: true },
  ...(adminMode.value ? [{ title: "Usuário", key: "user", sortable: false }] : []),
  { title: "Status", key: "status", sortable: true },
  { title: "Última interação", key: "updatedAt", sortable: true, value: (item: TicketDTO) => item.lastMessageAt ?? item.updatedAt },
]);

const counts = computed(() => {
  const result: Record<TicketStatus, number> = { OPEN: 0, IN_PROGRESS: 0, ANSWERED: 0, CLOSED: 0 };
  tickets.value.forEach((ticket) => { result[ticket.status]++; });
  return result;
});

const filtered = computed(() => {
  const term = (search.value ?? "").trim().toLowerCase();
  return tickets.value.filter((ticket) => {
    if (status.value && ticket.status !== status.value) return false;
    if (!term) return true;
    return ticket.subject.toLowerCase().includes(term)
      || ticket.user.name.toLowerCase().includes(term)
      || ticket.user.username.toLowerCase().includes(term);
  });
});

const badge = (ticket: TicketDTO) => {
  if (ticket.status === "CLOSED") return null;
  if (!adminMode.value && ticket.lastMessageByAdmin) return { label: "Nova resposta", color: "success" };
  if (adminMode.value && !ticket.lastMessageByAdmin && ticket.status === "OPEN") return { label: "Aguardando resposta", color: "warning" };
  return null;
};

const openTicket = (ticket: TicketDTO) => {
  router.push({
    name: adminMode.value ? routeProps.adminTicketDetail.name : routeProps.ticketDetail.name,
    params: { id: ticket.id },
  });
};

const onCreated = (ticket: TicketDetailDTO) => {
  router.push({ name: routeProps.ticketDetail.name, params: { id: ticket.id } });
};

const load = async () => {
  loading.value = true;
  try {
    const data = (await run(ticketService.list())) ?? [];
    // para administradores a API devolve os chamados de todos; na área de suporte mostra só os próprios
    tickets.value = adminMode.value ? data : data.filter((ticket) => ticket.user.id === auth.userId);
  } finally {
    loading.value = false;
  }
};

onMounted(load);
</script>
