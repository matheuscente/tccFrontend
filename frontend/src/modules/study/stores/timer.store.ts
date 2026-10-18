import { defineStore } from "pinia";
import { isError } from "@/services/api/isError.typeGuard";
import { studySessionService } from "../services/study-session.service";
import type { StudySession } from "../models/study-session.model";
import type { Scope } from "@/modules/courses/models/structure.model";
import type { ApiError } from "@/services/api/models/ApiError.interface";

/**
 * Sessão de estudo em andamento (cronômetro). Fica no store para aparecer no topo de todas as telas.
 */
export const useTimerStore = defineStore("timer", {
  state: () => ({
    active: null as StudySession | null,
    now: Date.now(),
    interval: null as ReturnType<typeof setInterval> | null,
  }),

  getters: {
    elapsedSeconds: (state) => state.active ? Math.max(0, Math.floor((state.now - new Date(state.active.startedAt).getTime()) / 1000)) : 0,
  },

  actions: {
    async load() {
      const response = await studySessionService.active();
      this.setActive(isError(response) ? null : response.data[0] ?? null);
    },

    async start(scope: Scope): Promise<ApiError | null> {
      const response = await studySessionService.start(scope);
      if (isError(response)) return response;
      this.setActive(response.data[0] ?? null);
      return null;
    },

    async finish(): Promise<StudySession | ApiError | null> {
      if (!this.active) return null;
      const response = await studySessionService.finish(this.active.id);
      if (isError(response)) return response;
      this.setActive(null);
      return response.data[0] ?? null;
    },

    setActive(session: StudySession | null) {
      this.active = session;
      if (session && !this.interval) {
        this.interval = setInterval(() => { this.now = Date.now(); }, 1000);
      }
      if (!session && this.interval) {
        clearInterval(this.interval);
        this.interval = null;
      }
      this.now = Date.now();
    },

    reset() {
      this.setActive(null);
    },
  },
});
