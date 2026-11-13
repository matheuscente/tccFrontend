import type { ApiResult } from "@/services/abstract/service.abstract";
import type { PerformanceDTO } from "../DTO/PerformanceDto";
import type { StatsQueryDTO } from "../DTO/StatsQueryDto";
import type { StudySummaryDTO } from "../DTO/StudySummaryDto";

export interface StatsServiceInterface {
  summary(query?: StatsQueryDTO): Promise<ApiResult<StudySummaryDTO>>
  performance(query?: StatsQueryDTO): Promise<ApiResult<PerformanceDTO>>
}
