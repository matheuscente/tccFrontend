<template>
  <div>
    <PageHeader :title="ticket?.subject ?? 'Chamado'" :back="{ name: adminMode ? routeProps.adminTickets.name : routeProps.tickets.name }">
      <template #actions>
        <template v-if="ticket">
          <v-select
            v-if="adminMode"
            :model-value="ticket.status"
            :items="statusItems"
            label="Status"
            density="compact"
            hide-details
            style="min-width: 200px"
            :loading="changingStatus"
            @update:model-value="(value: TicketStatus) => changeStatus(value)"
          />
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
          <span v-if="ticket.closedAt" class="text-body-medium text-medium-emphasis">· Encerrado em {{ formatDateTime(ticket.closedAt) }}</span>
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
          <div
            v-for="message in ticket.messages"
            :key="message.id"
            class="message-row"
            :class="{ 'message-row--own': isOwn(message) }"
          >
            <div class="message" :class="isSupport(message) ? 'message--support' : 'message--user'">
              <div class="d-flex align-center ga-2 mb-1">
                <v-icon :icon="isSupport(message) ? 'mdi-headset' : 'mdi-account-outline'" size="16" />
                <span class="text-label-large">{{ isSupport(message) ? `Suporte · ${message.author.name}` : message.author.name }}</span>
                <span class="text-body-small text-medium-emphasis">{{ formatDateTime(message.createdAt) }}</span>
              </div>
              <div class="text-body-medium pre-wrap">{{ message.content }}</div>
              <div v-if="message.attachments.length" class="d-flex flex-wrap ga-2 mt-3">
                <v-img
                  v-for="attachment in message.attachments"
                  :key="attachment.id"
                  :src="attachment.url"
                  :alt="attachment.originalName"
                  width="96"
                  height="96"
                  cover
                  class="rounded-lg cursor-pointer attachment"
                  @click="preview = attachment"
                />
              </div>
            </div>
          </div>
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
            <div class="d-flex flex-wrap align-start ga-3">
              <ImagePicker v-model="images" class="flex-grow-1" />
              <v-btn color="primary" type="submit" prepend-icon="mdi-send" :loading="sending">Enviar</v-btn>
            </div>
          </v-form>
        </v-card-text>
      </v-card>
    </template>

    <EmptyState v-else-if="!loading" title="Chamado não encontrado" icon="mdi-alert-circle-outline" />

    <v-dialog :model-value="!!preview" max-width="900" @update:model-value="preview = null">
      <v-card v-if="preview">
        <v-card-title class="d-flex align-center">
          <span class="text-title-medium text-truncate">{{ preview.originalName }}</span>
          <v-spacer />
          <v-btn icon="mdi-open-in-new" variant="text" :href="preview.url" target="_blank" rel="noopener" aria-label="Abrir em nova aba" />
          <v-btn icon="mdi-close" variant="text" aria-label="Fechar" @click="preview = null" />
        </v-card-title>
        <v-img :src="preview.url" max-height="75vh" contain />
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
import { useApi } from "@/composables/useApi";
import { useAuthStore } from "@/modules/auth/stores/auth.store";
import { useConfirmStore } from "@/stores/confirm.store";
import { routeProps } from "@/router/RouteProps";
import { formatDateTime } from "@/utils/date";
import { maxLength, minLength, required } from "@/utils/rules";
import ImagePicker from "../components/ImagePicker.vue";
import { ticketService } from "../services/ticket.service";
import {
  ticketCategoryLabels, ticketStatusInfo,
  type TicketAttachment, type TicketDetail, type TicketMessage, type TicketStatus,
} from "../models/ticket.model";

const route = useRoute();
const auth = useAuthStore();
const confirm = useConfirmStore();
const { runOne } = useApi();

const adminMode = computed(() => route.meta.adminMode === true);
const ticketId = computed(() => String(route.params.id));

const ticket = ref<TicketDetail | null>(null);
const loading = ref(false);
const changingStatus = ref(false);
const sending = ref(false);
const reply = ref("");
const images = ref<File[]>([]);
const form = ref<VForm | null>(null);
const preview = ref<TicketAttachment | null>(null);

const statusItems = (Object.keys(ticketStatusInfo) as TicketStatus[]).map((value) => ({ value, title: ticketStatusInfo[value].label }));

const isSupport = (message: TicketMessage) => message.author.role === "ADMIN" && message.author.id !== ticket.value?.user.id;
const isOwn = (message: TicketMessage) => message.author.id === auth.userId;

const load = async () => {
  loading.value = true;
  try {
    ticket.value = await runOne(ticketService.findById(ticketId.value));
  } finally {
    loading.value = false;
  }
};

const changeStatus = async (status: TicketStatus) => {
  if (!ticket.value || status === ticket.value.status) return;
  changingStatus.value = true;
  try {
    const updated = await runOne(ticketService.updateStatus(ticket.value.id, status), "Status atualizado.");
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
    const updated = await runOne(ticketService.reply(ticket.value.id, reply.value.trim(), images.value), "Mensagem enviada.");
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

onMounted(load);
</script>

<style scoped>
.messages {
  display: flex;
  flex-direction: column;
  gap: 12px;
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
</style>
