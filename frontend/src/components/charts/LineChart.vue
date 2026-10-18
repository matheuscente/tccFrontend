<template>
  <div class="chart-box" :style="{ height: `${height}px` }">
    <Line :data="chartData" :options="options" />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Line } from "vue-chartjs";
import { useTheme } from "vuetify";
import type { ChartOptions } from "chart.js";
import "./chartSetup";

const props = withDefaults(defineProps<{
  labels: string[]
  values: number[]
  label?: string
  color?: string
  height?: number
  min?: number
  max?: number
  tooltipTitles?: string[]
  valueSuffix?: string
}>(), { label: "", color: "", height: 280, min: undefined, max: undefined, tooltipTitles: undefined, valueSuffix: "" });

const theme = useTheme();

const textColor = computed(() => (theme.global.current.value.dark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)"));
const gridColor = computed(() => (theme.global.current.value.dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"));
const lineColor = computed(() => props.color || String(theme.global.current.value.colors.secondary));

const chartData = computed(() => ({
  labels: props.labels,
  datasets: [{
    label: props.label,
    data: props.values,
    borderColor: lineColor.value,
    backgroundColor: `${lineColor.value}22`,
    fill: true,
    tension: 0.3,
    pointRadius: 4,
    pointHoverRadius: 6,
  }],
}));

const options = computed<ChartOptions<"line">>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        title: (items) => {
          const index = items[0]?.dataIndex ?? 0;
          return props.tooltipTitles?.[index] ?? props.labels[index] ?? "";
        },
        label: (context) => `${context.raw}${props.valueSuffix}`,
      },
    },
  },
  scales: {
    x: { ticks: { color: textColor.value, maxRotation: 0, autoSkip: true }, grid: { display: false } },
    y: { min: props.min, max: props.max, ticks: { color: textColor.value }, grid: { color: gridColor.value } },
  },
}));
</script>

<style scoped>
.chart-box {
  position: relative;
  width: 100%;
}
</style>
