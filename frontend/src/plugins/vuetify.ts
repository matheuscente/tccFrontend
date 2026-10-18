import "vuetify/styles";
import "@mdi/font/css/materialdesignicons.css";

import { createVuetify } from "vuetify";
import { aliases, mdi } from "vuetify/iconsets/mdi";
import { pt } from "vuetify/locale";

const readTheme = (): "light" | "dark" => {
  try {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    // storage indisponível
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export const vuetify = createVuetify({
  locale: { locale: "pt", messages: { pt } },
  icons: {
    defaultSet: "mdi",
    aliases,
    sets: {
      mdi,
    },
  },
  theme: {
    defaultTheme: readTheme(),
    themes: {
      light: {
        colors: {
          primary: "#3949AB",
          secondary: "#00897B",
          background: "#F5F6FA",
          surface: "#FFFFFF",
          info: "#1E88E5",
          success: "#2E7D32",
          warning: "#EF6C00",
          error: "#D32F2F",
        },
      },
      dark: {
        colors: {
          primary: "#8C9EFF",
          secondary: "#4DB6AC",
          background: "#12131A",
          surface: "#1C1E27",
        },
      },
    },
  },
  defaults: {
    VTextField: { variant: "outlined", density: "comfortable", color: "primary" },
    VTextarea: { variant: "outlined", density: "comfortable", color: "primary" },
    VSelect: { variant: "outlined", density: "comfortable", color: "primary" },
    VAutocomplete: { variant: "outlined", density: "comfortable", color: "primary" },
    VFileInput: { variant: "outlined", density: "comfortable", color: "primary" },
    VCard: { rounded: "lg" },
    VBtn: { rounded: "lg" },
  },
});
