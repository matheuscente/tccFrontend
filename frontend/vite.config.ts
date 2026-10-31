import vue from '@vitejs/plugin-vue'
import { readdirSync } from 'fs'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'
import vuetify from "vite-plugin-vuetify"

// pré-otimiza todos os componentes do Vuetify: sem isso o Vite descobre componentes novos a cada tela
// e recarrega a página no meio da navegação (clique "perdido")
const vuetifyComponents = readdirSync(fileURLToPath(new URL("./node_modules/vuetify/lib/components", import.meta.url)), { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name.startsWith("V"))
  .map((entry) => `vuetify/components/${entry.name}`)

export default defineConfig({
  plugins: [vue(),
    vuetify({
      autoImport: true
    })
  ],
  optimizeDeps: {
    entries: ["index.html", "./src/**/*.vue"],
    include: [...vuetifyComponents, "vuetify/directives", "vuetify/iconsets/mdi", "vuetify/locale"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  }
})
