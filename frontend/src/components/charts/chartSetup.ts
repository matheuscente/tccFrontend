import {
  ArcElement, BarElement, CategoryScale, Chart, Filler, Legend, LinearScale, LineElement, PointElement, Tooltip,
} from "chart.js";

Chart.register(ArcElement, BarElement, CategoryScale, Filler, Legend, LinearScale, LineElement, PointElement, Tooltip);

export const chartPalette = ["#3949AB", "#00897B", "#F4511E", "#8E24AA", "#FDD835", "#039BE5", "#6D4C41", "#C0CA33"];
