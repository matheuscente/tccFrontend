# Organizador de Estudos — Frontend

Vue 3 + TypeScript + Vite + **Vuetify 4** + Pinia + Vue Router + Axios + Chart.js.

## Como rodar

```bash
npm install
# .env -> VITE_BASE_URL=http://localhost:3000/api/v1
npm run dev      # http://localhost:5173
npm run build    # vue-tsc + build de produção
```

O backend precisa liberar a origem do front em `CORS_ORIGINS` (padrão `http://localhost:5173`).

## Estrutura

- `src/modules/<módulo>/` — `models` (tipos da API), `services` (chamadas HTTP), `pages`, `components`, `stores`
- `src/services/api` — instância do axios, interceptors (access token + refresh automático) e `api` (Service)
- `src/stores` — estado global: estrutura de cursos (cache para os seletores), snackbar e diálogo de confirmação
- `src/components` — componentes compartilhados (seletor de escopo curso › módulo › disciplina, gráficos, cabeçalho de página etc.)
- `src/router` — rotas; `requiresAuth` para a área logada e `requiresAdmin` para o painel administrativo

## Telas

Login (usuário ou e-mail), cadastro, esqueci/redefinir senha, início (dashboard), cursos/módulos/disciplinas,
sessões de estudo (cronômetro + registro manual), metas, estatísticas, banco de questões, atividades
(montagem, resolução e correção), bloco de notas (autosave), arquivos (upload, download e visualização),
suporte (SAC), perfil e painel administrativo (indicadores, usuários, acompanhamento e chamados).
