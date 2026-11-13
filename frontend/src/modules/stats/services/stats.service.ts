import { api } from "@/services/api/http";
import type { Service } from "@/services/abstract/service.abstract";
import { cleanParams } from "@/utils/params";
import type { PerformanceDTO } from "../models/DTO/PerformanceDto";
import type { StatsQueryDTO } from "../models/DTO/StatsQueryDto";
import type { StudySummaryDTO } from "../models/DTO/StudySummaryDto";
import type { StatsServiceInterface } from "../models/interfaces/StatsService.interface";

export class StatsService implements StatsServiceInterface {
  private readonly api: Service;

  constructor(api: Service) {
    this.api = api;
  }

  summary(query: StatsQueryDTO = {}) {
    return this.api.get<StudySummaryDTO>("/stats/summary", { params: cleanParams(query) });
  }

  performance(query: StatsQueryDTO = {}) {
    return this.api.get<PerformanceDTO>("/stats/performance", { params: cleanParams(query) });
  }
}

export const statsService = new StatsService(api);
