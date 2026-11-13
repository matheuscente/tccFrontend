import { defineStore } from "pinia";
import { isError } from "@/services/api/isError.typeGuard";
import type { ApiError } from "@/services/api/models/ApiError.interface";
import type { Scope } from "@/modules/courses/models/interfaces/Scope.interface";
import { studySessionService } from "../services/study-session.service";
import type { StudySessionDTO } from "../models/DTO/StudySessionDto";

let interval: ReturnType<typeof setInterval> | null = null;

export const useTimerStore = defineStore("timer", {
  state: () => ({
    active: null as StudySessionDTO | null,
    now: Date.now(),
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

    async finish(): Promise<StudySessionDTO | ApiError | null> {
      if (!this.active) return null;
      const response = await studySessionService.finish(this.active.id);
      if (isError(response)) return response;
      this.setActive(null);
      return response.data[0] ?? null;
    },

    setActive(session: StudySessionDTO | null) {
      this.active = session;
      if (session && !interval) {
        interval = setInterval(() => { this.now = Date.now(); }, 1000);
      }
      if (!session && interval) {
        clearInterval(interval);
        interval = null;
      }
      this.now = Date.now();
    },

    reset() {
      this.setActive(null);
    },
  },
});
