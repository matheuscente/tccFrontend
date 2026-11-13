<template>
  <div class="chart-box" :style="{ height: `${height}px` }">
    <Doughnut :data="chartData" :options="options" />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Doughnut } from "vue-chartjs";
import { useTheme } from "vuetify";
import type { ChartOptions } from "chart.js";
import { chartPalette } from "./chartSetup";

const props = withDefaults(defineProps<{
  labels: string[]
  values: number[]
  height?: number
  valueFormatter?: (value: number) => string
}>(), { height: 260, valueFormatter: undefined });

const theme = useTheme();

const chartData = computed(() => ({
  labels: props.labels,
  datasets: [{
    data: props.values,
    backgroundColor: props.values.map((_, index) => chartPalette[index % chartPalette.length]),
    borderColor: String(theme.global.current.value.colors.surface),
    borderWidth: 2,
  }],
}));

const options = computed<ChartOptions<"doughnut">>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: "62%",
  plugins: {
    legend: {
      position: "bottom",
      labels: { color: theme.global.current.value.dark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.7)", boxWidth: 12 },
    },
    tooltip: {
      callbacks: {
        label: (context) => {
          const value = Number(context.raw ?? 0);
          return ` ${context.label}: ${props.valueFormatter ? props.valueFormatter(value) : value}`;
        },
      },
    },
  },
}));
</script>

<style scoped>
.chart-box {
  position: relative;
  width: 100%;
}
</style>
