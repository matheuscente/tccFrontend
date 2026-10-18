<template>
  <div class="chart-box" :style="{ height: `${height}px` }">
    <Bar :data="chartData" :options="options" />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Bar } from "vue-chartjs";
import { useTheme } from "vuetify";
import type { ChartOptions } from "chart.js";
import "./chartSetup";

const props = withDefaults(defineProps<{
  labels: string[]
  values: number[]
  label?: string
  color?: string
  height?: number
  horizontal?: boolean
  valueFormatter?: (value: number) => string
}>(), { label: "", color: "", height: 280, horizontal: false, valueFormatter: undefined });

const theme = useTheme();

const textColor = computed(() => (theme.global.current.value.dark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)"));
const gridColor = computed(() => (theme.global.current.value.dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"));

const chartData = computed(() => ({
  labels: props.labels,
  datasets: [{
    label: props.label,
    data: props.values,
    backgroundColor: props.color || String(theme.global.current.value.colors.primary),
    borderRadius: 6,
    maxBarThickness: 36,
  }],
}));

const options = computed<ChartOptions<"bar">>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: props.horizontal ? "y" : "x",
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (context) => {
          const value = Number(context.raw ?? 0);
          return props.valueFormatter ? props.valueFormatter(value) : String(value);
        },
      },
    },
  },
  scales: {
    x: { ticks: { color: textColor.value, maxRotation: 0, autoSkip: true }, grid: { display: props.horizontal, color: gridColor.value } },
    y: { beginAtZero: true, ticks: { color: textColor.value, precision: 0 }, grid: { display: !props.horizontal, color: gridColor.value } },
  },
}));
</script>

<style scoped>
.chart-box {
  position: relative;
  width: 100%;
}
</style>
