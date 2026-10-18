import { api } from "@/services/api/http";
import { cleanParams } from "@/utils/params";
import type { Performance, StatsQuery, StudySummary } from "../models/stats.model";

export const statsService = {
  summary: (query: StatsQuery = {}) => api.get<StudySummary>("/stats/summary", { params: cleanParams(query) }),
  performance: (query: StatsQuery = {}) => api.get<Performance>("/stats/performance", { params: cleanParams(query) }),
};
