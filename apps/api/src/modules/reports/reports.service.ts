import type { DateRangeQuery, EndOfDayQuery, SalesSummaryQuery } from './reports.schemas.js';
import * as repo from './reports.repository.js';

export const getSalesSummary = async (tenantId: string, query: SalesSummaryQuery): Promise<Record<string, unknown>> =>
  repo.getSalesSummary(tenantId, query);

export const getEndOfDay = async (tenantId: string, query: EndOfDayQuery): Promise<Record<string, unknown>> =>
  repo.getEndOfDay(tenantId, query);

export const getProductPerformance = async (tenantId: string, query: DateRangeQuery & { limit?: number }): Promise<Record<string, unknown>[]> =>
  repo.getProductPerformance(tenantId, query);

export const getCashierPerformance = async (tenantId: string, query: DateRangeQuery): Promise<Record<string, unknown>[]> =>
  repo.getCashierPerformance(tenantId, query);
