<template>
  <v-dialog :model-value="modelValue" max-width="480" @update:model-value="emit('update:modelValue', $event)">
    <v-card>
      <v-card-title class="text-title-large pt-5 px-6">Transferir atendimento</v-card-title>
      <v-card-text class="px-6">
        <p class="text-body-medium text-medium-emphasis mb-4">
          O chamado continua <b>Em atendimento</b>, agora com o administrador escolhido. Você deixa de ver o chamado enquanto ele estiver com outra pessoa.
        </p>
        <v-select
          v-model="adminId"
          :items="options"
          item-title="label"
          item-value="id"
          label="Administrador"
          :loading="loading"
          no-data-text="Nenhum outro administrador cadastrado"
          prepend-inner-icon="mdi-account-tie-outline"
        />
      </v-card-text>
      <v-card-actions class="px-6 pb-4">
        <v-spacer />
        <v-btn variant="text" @click="emit('update:modelValue', false)">Cancelar</v-btn>
        <v-btn color="primary" variant="flat" :disabled="!adminId" :loading="saving" @click="confirm">Transferir</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useApi } from "@/composables/useApi";
import { adminService } from "@/modules/admin/services/admin.service";
import type { AdminSummaryDTO } from "@/modules/admin/models/DTO/AdminSummaryDto";
import type { TicketDetailDTO } from "../models/DTO/TicketDetailDto";
import { ticketService } from "../services/ticket.service";

const props = defineProps<{ modelValue: boolean, ticket: TicketDetailDTO, currentAdminId: string }>();
const emit = defineEmits<{ "update:modelValue": [value: boolean], transferred: [ticket: TicketDetailDTO] }>();

const { run, runOne } = useApi();

const admins = ref<AdminSummaryDTO[]>([]);
const adminId = ref<string | null>(null);
const loading = ref(false);
const saving = ref(false);

// não oferece o próprio administrador nem quem abriu o chamado
const options = computed(() => admins.value
  .filter((admin) => admin.id !== props.currentAdminId && admin.id !== props.ticket.user.id)
  .map((admin) => ({ id: admin.id, label: `${admin.name} (@${admin.username})` })));

watch(() => props.modelValue, async (open) => {
  if (!open) return;
  adminId.value = null;
  loading.value = true;
  try {
    admins.value = (await run(adminService.listAdmins())) ?? [];
  } finally {
    loading.value = false;
  }
});

const confirm = async () => {
  if (!adminId.value) return;
  saving.value = true;
  try {
    const updated = await runOne(ticketService.transfer(props.ticket.id, adminId.value), "Chamado transferido.");
    if (updated) {
      emit("transferred", updated);
      emit("update:modelValue", false);
    }
  } finally {
    saving.value = false;
  }
};
</script>
