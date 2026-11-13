<template>
  <div>
    <PageHeader :title="ticket?.subject ?? 'Chamado'" :back="{ name: adminMode ? routeProps.adminTickets.name : routeProps.tickets.name }">
      <template #actions>
        <template v-if="ticket">
          <template v-if="supportView">
            <v-btn
              v-if="ticket.status === 'CLOSED'"
              variant="tonal"
              prepend-icon="mdi-lock-open-variant-outline"
              :loading="changingStatus"
              @click="changeStatus('OPEN')"
            >
              Reabrir
            </v-btn>
            <v-btn
              v-else-if="ticket.status !== 'IN_PROGRESS'"
              color="primary"
              variant="flat"
              prepend-icon="mdi-account-check-outline"
              :loading="changingStatus"
              @click="changeStatus('IN_PROGRESS')"
            >
              Atender
            </v-btn>
            <v-btn v-else variant="tonal" prepend-icon="mdi-account-switch-outline" @click="transferOpen = true">Transferir</v-btn>
            <v-menu v-if="ticket.status !== 'CLOSED'" location="bottom end">
              <template #activator="{ props: menuProps }">
                <v-btn v-bind="menuProps" variant="tonal" append-icon="mdi-menu-down" :loading="changingStatus">Alterar status</v-btn>
              </template>
              <v-list density="compact">
                <v-list-item
                  v-for="item in statusOptions"
                  :key="item.value"
                  :prepend-icon="ticketStatusInfo[item.value].icon"
                  :title="item.title"
                  :subtitle="item.hint"
                  :base-color="item.value === 'CLOSED' ? 'error' : undefined"
                  @click="item.value === 'CLOSED' ? closeTicket() : changeStatus(item.value)"
                />
              </v-list>
            </v-menu>
          </template>
          <v-btn
            v-else-if="ticket.status !== 'CLOSED'"
            color="error"
            variant="tonal"
            prepend-icon="mdi-lock-outline"
            :loading="changingStatus"
            @click="closeTicket"
          >
            Encerrar chamado
          </v-btn>
        </template>
      </template>
    </PageHeader>

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />

    <template v-if="ticket">
      <v-card class="mb-4">
        <v-card-text class="d-flex flex-wrap align-center ga-3">
          <v-chip :color="ticketStatusInfo[ticket.status].color" :prepend-icon="ticketStatusInfo[ticket.status].icon" variant="tonal">
            {{ ticketStatusInfo[ticket.status].label }}
          </v-chip>
          <v-chip variant="outlined" prepend-icon="mdi-tag-outline">{{ ticketCategoryLabels[ticket.category] }}</v-chip>
          <span class="text-body-medium text-medium-emphasis">Aberto em {{ formatDateTime(ticket.createdAt) }}</span>
          <v-chip v-if="ticket.status === 'IN_PROGRESS' && ticket.assignedTo" variant="outlined" prepend-icon="mdi-headset" color="info">
            {{ ticket.assignedTo.id === auth.userId ? "Em atendimento por você" : `Em atendimento por ${ticket.assignedTo.name}` }}
          </v-chip>
          <span v-if="ticket.closedAt" class="text-body-medium text-medium-emphasis">· {{ closedLabel }}</span>
          <v-spacer />
          <div v-if="adminMode" class="d-flex align-center ga-2">
            <v-icon icon="mdi-account-outline" />
            <router-link :to="{ name: routeProps.adminUserDetail.name, params: { id: ticket.user.id } }" class="text-primary">
              {{ ticket.user.name }}
            </router-link>
            <span class="text-medium-emphasis">@{{ ticket.user.username }}</span>
          </div>
        </v-card-text>
      </v-card>

      <v-card class="mb-4">
        <v-card-text class="messages">
          <template v-for="entry in timeline" :key="entry.id">
            <div v-if="entry.kind === 'event'" class="event-row text-body-small text-medium-emphasis">
              <v-icon :icon="entry.icon" size="16" class="mr-1" />{{ entry.text }} · {{ formatDateTime(entry.createdAt) }}
            </div>
            <div
              v-else
              class="message-row"
              :class="{ 'message-row--own': isOwn(entry.message) }"
            >
              <div class="message" :class="isSupport(entry.message) ? 'message--support' : 'message--user'">
                <div class="d-flex align-center ga-2 mb-1">
                  <v-icon :icon="isSupport(entry.message) ? 'mdi-headset' : 'mdi-account-outline'" size="16" />
                  <span class="text-label-large">{{ isSupport(entry.message) ? `Suporte · ${entry.message.author.name}` : entry.message.author.name }}</span>
                  <span class="text-body-small text-medium-emphasis">{{ formatDateTime(entry.message.createdAt) }}</span>
                </div>
                <div class="text-body-medium pre-wrap">{{ entry.message.content }}</div>
                <div v-if="entry.message.attachments.length" class="d-flex flex-wrap ga-2 mt-3">
                  <button
                    v-for="attachment in entry.message.attachments"
                    :key="attachment.id"
                    type="button"
                    class="attachment-button"
                    :aria-label="`Ampliar imagem ${attachment.originalName}`"
                    @click="preview = attachment"
                  >
                    <v-img :src="attachment.url" :alt="attachment.originalName" width="96" height="96" cover class="rounded-lg attachment" />
                  </button>
                </div>
              </div>
            </div>
          </template>
        </v-card-text>
      </v-card>

      <v-card>
        <v-card-title class="text-title-medium">Responder</v-card-title>
        <v-card-text>
          <v-alert v-if="ticket.status === 'CLOSED'" type="info" variant="tonal" density="compact">
            Este chamado está encerrado. {{ adminMode ? '' : 'Abra um novo chamado se precisar de mais ajuda.' }}
          </v-alert>
          <v-form v-else ref="form" @submit.prevent="sendReply">
            <v-textarea
              v-model="reply"
              label="Sua mensagem"
              rows="3"
              auto-grow
              counter="5000"
              :rules="[required('Mensagem'), minLength(2, 'Mensagem'), maxLength(5000, 'Mensagem')]"
              class="mb-2"
            />
            <v-checkbox
              v-if="attendingByMe"
              v-model="keepInProgress"
              label="Continuar em atendimento comigo (desmarque para enviar como Respondido e liberar o chamado)"
              density="compact"
              hide-details
              class="mb-2"
            />
            <v-alert v-else-if="supportView && ticket.status !== 'IN_PROGRESS'" type="info" variant="tonal" density="compact" class="mb-3">
              Ao enviar, o chamado fica como <b>Respondido</b>. Use <b>Atender</b> para assumir o chamado só para você.
            </v-alert>
            <div class="d-flex flex-wrap align-start ga-3">
              <ImagePicker v-model="images" class="flex-grow-1" />
              <v-btn color="primary" type="submit" prepend-icon="mdi-send" :loading="sending">Enviar</v-btn>
            </div>
          </v-form>
        </v-card-text>
      </v-card>
    </template>

    <EmptyState
      v-else-if="!loading"
      :title="loadError ?? 'Chamado não encontrado'"
      icon="mdi-alert-circle-outline"
      :text="adminMode ? 'Chamados em atendimento ficam visíveis só para o administrador responsável.' : ''"
    />

    <TransferTicketDialog
      v-if="ticket && supportView"
      v-model="transferOpen"
      :ticket="ticket"
      :current-admin-id="auth.userId"
      @transferred="onTransferred"
    />

    <v-dialog :model-value="!!preview" max-width="900" @update:model-value="preview = null">
      <v-card v-if="preview">
        <v-card-title class="d-flex align-center">
          <span class="text-title-medium text-truncate">{{ preview.originalName }}</span>
          <v-spacer />
          <v-btn icon="mdi-open-in-new" variant="text" :href="preview.url" target="_blank" rel="noopener" aria-label="Abrir em nova aba" />
          <v-btn icon="mdi-close" variant="text" aria-label="Fechar" @click="preview = null" />
        </v-card-title>
        <v-img :src="preview.url" :alt="preview.originalName" max-height="75vh" />
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import type { VForm } from "vuetify/components";
import PageHeader from "@/components/PageHeader.vue";
import EmptyState from "@/components/EmptyState.vue";
import { useRouter } from "vue-router";
import { useApi } from "@/composables/useApi";
import { useNotifyStore } from "@/stores/notify.store";
import { isError } from "@/services/api/isError.typeGuard";
import { firstErrorMessage } from "@/utils/apiErrors";
import { useAuthStore } from "@/modules/auth/stores/auth.store";
import { useConfirmStore } from "@/stores/confirm.store";
import { routeProps } from "@/router/RouteProps";
import { formatDateTime } from "@/utils/date";
import { maxLength, minLength, required } from "@/utils/rules";
import ImagePicker from "../components/ImagePicker.vue";
import TransferTicketDialog from "../components/TransferTicketDialog.vue";
import { describeTicketEvent } from "../utils/ticketEvents";
import { ticketService } from "../services/ticket.service";
import { ticketCategoryLabels, ticketStatusInfo } from "../models/constants/ticket.constants";
import type { TicketAttachmentDTO, TicketDetailDTO, TicketMessageDTO } from "../models/DTO/TicketDetailDto";
import type { TicketStatus } from "../models/Types/TicketStatus";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const confirm = useConfirmStore();
const notify = useNotifyStore();
const { runOne } = useApi();

const adminMode = computed(() => route.meta.adminMode === true);
const ticketId = computed(() => String(route.params.id));

const ticket = ref<TicketDetailDTO | null>(null);
const loading = ref(false);
const changingStatus = ref(false);
const sending = ref(false);
const reply = ref("");
const images = ref<File[]>([]);
const form = ref<VForm | null>(null);
const preview = ref<TicketAttachmentDTO | null>(null);
const transferOpen = ref(false);
const keepInProgress = ref(true);
const loadError = ref<string | null>(null);

// visão do suporte: tela de administração e o chamado não é do próprio administrador
const supportView = computed(() => adminMode.value && !!ticket.value && ticket.value.user.id !== auth.userId);
const attendingByMe = computed(() => supportView.value && ticket.value?.status === "IN_PROGRESS" && ticket.value.assignedTo?.id === auth.userId);

const statusHints: Partial<Record<TicketStatus, string>> = {
  OPEN: "Libera o chamado para qualquer administrador",
  ANSWERED: "Aguardando o usuário; libera o chamado",
  IN_PROGRESS: "Você assume o chamado",
  CLOSED: "Encerra a conversa",
};

const statusOptions = computed(() => (Object.keys(ticketStatusInfo) as TicketStatus[])
  .filter((value) => value !== ticket.value?.status)
  .map((value) => ({ value, title: value === "IN_PROGRESS" ? "Atender (Em atendimento)" : ticketStatusInfo[value].label, hint: statusHints[value] })));

const closedLabel = computed(() => {
  const current = ticket.value;
  if (!current?.closedAt) return "";
  const who = !current.closedBy ? "" : current.closedBy.bySupport ? ` pelo administrador ${current.closedBy.name}` : " pelo usuário";
  return `Encerrado em ${formatDateTime(current.closedAt)}${who}`;
});

type TimelineEntry =
  | { kind: "message", id: string, createdAt: string, message: TicketMessageDTO }
  | { kind: "event", id: string, createdAt: string, text: string, icon: string };

const timeline = computed<TimelineEntry[]>(() => {
  if (!ticket.value) return [];
  const ownerId = ticket.value.user.id;
  return [
    ...ticket.value.messages.map((message) => ({ kind: "message" as const, id: message.id, createdAt: message.createdAt, message })),
    ...ticket.value.events.map((event) => ({ kind: "event" as const, id: event.id, createdAt: event.createdAt, ...describeTicketEvent(event, ownerId) })),
  ].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
});

const isSupport = (message: TicketMessageDTO) => message.author.role === "ADMIN" && message.author.id !== ticket.value?.user.id;
const isOwn = (message: TicketMessageDTO) => message.author.id === auth.userId;

const load = async () => {
  loading.value = true;
  try {
    const response = await ticketService.findById(ticketId.value);
    if (isError(response)) {
      loadError.value = firstErrorMessage(response);
      notify.error(loadError.value);
      ticket.value = null;
      return;
    }
    ticket.value = response.data[0] ?? null;
    keepInProgress.value = true;
  } finally {
    loading.value = false;
  }
};

const changeStatus = async (status: TicketStatus) => {
  if (!ticket.value || status === ticket.value.status) return;
  changingStatus.value = true;
  try {
    const updated = await runOne(ticketService.updateStatus(ticket.value.id, status), status === "IN_PROGRESS" ? "Você está atendendo este chamado." : "Status atualizado.");
    if (updated) ticket.value = updated;
  } finally {
    changingStatus.value = false;
  }
};

const closeTicket = async () => {
  const ok = await confirm.ask({
    title: "Encerrar chamado",
    message: "Depois de encerrado, não será possível enviar novas mensagens neste chamado. Deseja continuar?",
    confirmText: "Encerrar",
  });
  if (ok) await changeStatus("CLOSED");
};

const sendReply = async () => {
  if (!ticket.value || !form.value) return;
  const { valid } = await form.value.validate();
  if (!valid) return;

  sending.value = true;
  try {
    const updated = await runOne(ticketService.reply(ticket.value.id, reply.value.trim(), images.value, attendingByMe.value && keepInProgress.value), "Mensagem enviada.");
    if (updated) {
      ticket.value = updated;
      reply.value = "";
      images.value = [];
      form.value.resetValidation();
    }
  } finally {
    sending.value = false;
  }
};

// depois de transferir, o chamado fica visível só para o novo responsável
const onTransferred = (updated: TicketDetailDTO) => {
  ticket.value = updated;
  router.push({ name: routeProps.adminTickets.name });
};

onMounted(load);
</script>

<style scoped>
.messages {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.event-row {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2px 0;
}

.message-row {
  display: flex;
  justify-content: flex-start;
}

.message-row--own {
  justify-content: flex-end;
}

.message {
  max-width: min(720px, 90%);
  padding: 12px 16px;
  border-radius: 12px;
}

.message--user {
  background: rgba(var(--v-theme-primary), 0.08);
}

.message--support {
  background: rgba(var(--v-theme-secondary), 0.12);
  border-left: 3px solid rgb(var(--v-theme-secondary));
}

.attachment {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.attachment-button {
  padding: 0;
  border: 0;
  background: none;
  border-radius: 8px;
  cursor: pointer;
}
</style>
