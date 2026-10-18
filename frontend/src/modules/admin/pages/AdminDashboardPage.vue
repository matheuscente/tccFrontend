<template>
  <div>
    <PageHeader title="Painel administrativo" subtitle="Visão geral do uso do sistema">
      <template #actions>
        <v-btn variant="tonal" prepend-icon="mdi-refresh" :loading="loading" @click="load">Atualizar</v-btn>
      </template>
    </PageHeader>

    <v-progress-linear v-if="loading && !data" indeterminate color="primary" class="mb-4" />

    <template v-if="data">
      <v-row class="mb-2">
        <v-col cols="12" sm="6" lg="4" xl="2">
          <StatCard label="Usuários" :value="data.users.total" :caption="`${data.users.admins} administrador(es)`" icon="mdi-account-group-outline" :to="{ name: routeProps.adminUsers.name }" />
        </v-col>
        <v-col cols="12" sm="6" lg="4" xl="2">
          <StatCard label="Novos (30 dias)" :value="data.users.newLast30Days" icon="mdi-account-plus-outline" color="secondary" />
        </v-col>
        <v-col cols="12" sm="6" lg="4" xl="2">
          <StatCard label="Ativos (7 dias)" :value="data.users.activeLast7Days" caption="com sessões de estudo" icon="mdi-account-check-outline" color="success" />
        </v-col>
        <v-col cols="12" sm="6" lg="4" xl="2">
          <StatCard label="Estudo (30 dias)" :value="formatMinutes(data.study.minutesLast30Days)" :caption="`${data.study.sessionsLast30Days} sessões`" icon="mdi-clock-outline" color="info" />
        </v-col>
        <v-col cols="12" sm="6" lg="4" xl="2">
          <StatCard
            label="Tentativas (30 dias)"
            :value="data.activities.attemptsLast30Days"
            :caption="data.activities.averageScoreLast30Days !== null ? `média ${data.activities.averageScoreLast30Days}%` : 'sem tentativas'"
            icon="mdi-clipboard-check-outline"
            color="warning"
          />
        </v-col>
        <v-col cols="12" sm="6" lg="4" xl="2">
          <StatCard
            label="Chamados abertos"
            :value="data.tickets.OPEN + data.tickets.IN_PROGRESS"
            :caption="`${data.tickets.OPEN} aguardando resposta`"
            icon="mdi-headset"
            color="error"
            :to="{ name: routeProps.adminTickets.name }"
          />
        </v-col>
      </v-row>

      <v-row class="mb-2">
        <v-col cols="12" lg="8">
          <v-card class="h-100">
            <v-card-title class="text-title-medium">Minutos estudados por dia (todos os usuários)</v-card-title>
            <v-card-text>
              <BarChart
                v-if="data.study.minutesLast30Days > 0"
                :labels="data.study.perDay.map(day => shortDay(day.date))"
                :values="data.study.perDay.map(day => day.minutes)"
                :value-formatter="formatMinutes"
              />
              <EmptyState v-else title="Nenhum estudo registrado nos últimos 30 dias" icon="mdi-chart-bar" />
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" lg="4">
          <v-card class="h-100">
            <v-card-title class="text-title-medium">Chamados por status</v-card-title>
            <v-card-text class="d-flex flex-column ga-2">
              <v-chip
                v-for="key in statusKeys"
                :key="key"
                :color="ticketStatusInfo[key].color"
                :prepend-icon="ticketStatusInfo[key].icon"
                variant="tonal"
                :to="{ name: routeProps.adminTickets.name }"
                class="justify-space-between"
              >
                {{ ticketStatusInfo[key].label }}
                <template #append><strong class="ml-2">{{ data.tickets[key] }}</strong></template>
              </v-chip>
              <div class="text-body-small text-medium-emphasis mt-2">Tempo total estudado na plataforma: {{ formatMinutes(data.study.totalMinutes) }}</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" lg="7">
          <v-card class="h-100">
            <v-card-title class="text-title-medium">Conteúdo cadastrado</v-card-title>
            <v-card-text>
              <v-row density="compact">
                <v-col v-for="item in contentItems" :key="item.label" cols="6" sm="3">
                  <v-sheet rounded="lg" class="pa-3 text-center" color="surface-variant" variant="tonal">
                    <v-icon :icon="item.icon" class="mb-1" />
                    <div class="text-title-large font-weight-bold">{{ item.value }}</div>
                    <div class="text-body-small text-medium-emphasis">{{ item.label }}</div>
                  </v-sheet>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" lg="5">
          <v-card class="h-100">
            <v-card-title class="text-title-medium">Usuários recentes</v-card-title>
            <v-list v-if="data.recentUsers.length" lines="two">
              <v-list-item
                v-for="user in data.recentUsers"
                :key="user.id"
                :title="user.name"
                :subtitle="`@${user.username} · ${formatDateTime(user.createdAt)}`"
                prepend-icon="mdi-account-circle-outline"
                append-icon="mdi-chevron-right"
                :to="{ name: routeProps.adminUserDetail.name, params: { id: user.id } }"
              />
            </v-list>
            <v-card-text v-else class="text-medium-emphasis">Nenhum usuário cadastrado.</v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import PageHeader from "@/components/PageHeader.vue";
import StatCard from "@/components/StatCard.vue";
import EmptyState from "@/components/EmptyState.vue";
import BarChart from "@/components/charts/BarChart.vue";
import { useApi } from "@/composables/useApi";
import { routeProps } from "@/router/RouteProps";
import { formatDateTime, formatMinutes, shortDay } from "@/utils/date";
import { ticketStatusInfo, type TicketStatus } from "@/modules/tickets/models/ticket.model";
import { adminService } from "../services/admin.service";
import type { AdminDashboard } from "../models/admin.model";

const { runOne } = useApi();

const data = ref<AdminDashboard | null>(null);
const loading = ref(false);

const statusKeys = Object.keys(ticketStatusInfo) as TicketStatus[];

const contentItems = computed(() => {
  if (!data.value) return [];
  const content = data.value.content;
  return [
    { label: "Cursos", value: content.courses, icon: "mdi-school-outline" },
    { label: "Módulos", value: content.modules, icon: "mdi-folder-outline" },
    { label: "Disciplinas", value: content.disciplines, icon: "mdi-book-open-variant" },
    { label: "Metas", value: content.goals, icon: "mdi-flag-checkered" },
    { label: "Questões", value: content.questions, icon: "mdi-help-box-multiple-outline" },
    { label: "Atividades", value: content.activities, icon: "mdi-clipboard-check-outline" },
    { label: "Notas", value: content.notes, icon: "mdi-notebook-outline" },
    { label: "Arquivos", value: content.files, icon: "mdi-cloud-outline" },
  ];
});

const load = async () => {
  loading.value = true;
  try {
    data.value = await runOne(adminService.dashboard());
  } finally {
    loading.value = false;
  }
};

onMounted(load);
</script>
