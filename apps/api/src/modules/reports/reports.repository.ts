import { prisma } from '../../lib/prisma.js';
import type { DateRangeQuery, EndOfDayQuery, SalesSummaryQuery } from './reports.schemas.js';

export const getSalesSummary = async (tenantId: string, query: SalesSummaryQuery): Promise<Record<string, unknown>> => {
  const where: Record<string, unknown> = { tenantId, status: 'COMPLETED' };
  if (query.storeId) where.storeId = query.storeId;
  if (query.from || query.to) {
    where.createdAt = {};
    if (query.from) (where.createdAt as Record<string, unknown>).gte = new Date(query.from);
    if (query.to) (where.createdAt as Record<string, unknown>).lte = new Date(query.to);
  }

  // Enforce maximum date range to prevent memory issues (90 days default)
  if (!query.from && !query.to) {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    (where.createdAt as Record<string, unknown>).gte = ninetyDaysAgo;
  }

  // Use aggregation queries instead of loading all sales into memory
  const [aggregations, paymentAggs, topProductsAgg] = await Promise.all([
    prisma.sale.aggregate({
      where: where as import('@prisma/client').Prisma.SaleWhereInput,
      _count: { id: true },
      _sum: { totalAmount: true, taxAmount: true, discountAmount: true }
    }),
    prisma.payment.groupBy({
      by: ['method'],
      where: { sale: { ...(where as import('@prisma/client').Prisma.SaleWhereInput) } },
      _sum: { amount: true }
    }),
    prisma.saleLineItem.groupBy({
      by: ['productId', 'productName'],
      where: { sale: { ...(where as import('@prisma/client').Prisma.SaleWhereInput) } },
      _sum: { quantity: true, totalAmount: true },
      orderBy: { _sum: { totalAmount: 'desc' } },
      take: 10
    })
  ]);

  const totalSales = aggregations._count?.id ?? 0;
  const totalRevenue = aggregations._sum?.totalAmount ?? 0;
  const totalTax = aggregations._sum?.taxAmount ?? 0;
  const totalDiscount = aggregations._sum?.discountAmount ?? 0;

  const paymentBreakdown: Record<string, number> = {};
  for (const p of paymentAggs) {
    paymentBreakdown[p.method] = (p._sum?.amount ?? 0);
  }

  const topProducts = topProductsAgg.map((p) => ({
    productId: p.productId,
    name: p.productName,
    quantitySold: p._sum?.quantity ?? 0,
    revenue: p._sum?.totalAmount ?? 0
  }));

  // Sales by hour using raw SQL (Prisma cannot extract time parts without raw)
  const fromDate = query.from ? new Date(query.from) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const toDate = query.to ? new Date(query.to + 'T23:59:59Z') : new Date();
  const salesByHour = query.storeId
    ? await prisma.$queryRaw<Array<{ hour: number; sales_count: bigint; revenue: bigint }>>`
        SELECT EXTRACT(HOUR FROM "createdAt" AT TIME ZONE 'Africa/Nairobi')::int AS hour,
               COUNT(*)::bigint AS sales_count,
               SUM("totalAmount")::bigint AS revenue
        FROM "Sale"
        WHERE "tenantId" = ${tenantId}
          AND "storeId" = ${query.storeId}
          AND status = 'COMPLETED'
          AND "createdAt" BETWEEN ${fromDate} AND ${toDate}
        GROUP BY hour ORDER BY hour`
    : await prisma.$queryRaw<Array<{ hour: number; sales_count: bigint; revenue: bigint }>>`
        SELECT EXTRACT(HOUR FROM "createdAt" AT TIME ZONE 'Africa/Nairobi')::int AS hour,
               COUNT(*)::bigint AS sales_count,
               SUM("totalAmount")::bigint AS revenue
        FROM "Sale"
        WHERE "tenantId" = ${tenantId}
          AND status = 'COMPLETED'
          AND "createdAt" BETWEEN ${fromDate} AND ${toDate}
        GROUP BY hour ORDER BY hour`;

  return {
    period: { from: query.from ?? 'all', to: query.to ?? 'all' },
    totalSales,
    totalRevenue,
    totalTax,
    totalDiscount,
    averageOrderValue: totalSales > 0 ? Math.round(totalRevenue / totalSales) : 0,
    paymentBreakdown,
    topProducts,
    salesByHour: salesByHour.map((r) => ({
      hour: r.hour,
      salesCount: Number(r.sales_count),
      revenue: Number(r.revenue)
    }))
  };
};

export const getProductPerformance = async (tenantId: string, query: DateRangeQuery & { limit?: number }): Promise<Record<string, unknown>[]> => {
  const where: Record<string, unknown> = { tenantId, status: 'COMPLETED' };
  if (query.storeId) where.storeId = query.storeId;
  if (query.from || query.to) {
    where.createdAt = {};
    if (query.from) (where.createdAt as Record<string, unknown>).gte = new Date(query.from);
    if (query.to) (where.createdAt as Record<string, unknown>).lte = new Date(query.to + 'T23:59:59Z');
  }

  const results = await prisma.saleLineItem.groupBy({
    by: ['productId', 'productName'],
    where: { sale: where as import('@prisma/client').Prisma.SaleWhereInput },
    _sum: { quantity: true, totalAmount: true, discountAmount: true },
    orderBy: { _sum: { totalAmount: 'desc' } },
    take: query.limit ?? 20
  });

  return results.map((r) => ({
    productId: r.productId,
    productName: r.productName,
    quantitySold: r._sum?.quantity ?? 0,
    revenue: r._sum?.totalAmount ?? 0,
    discounts: r._sum?.discountAmount ?? 0
  }));
};

export const getCashierPerformance = async (tenantId: string, query: DateRangeQuery): Promise<Record<string, unknown>[]> => {
  const where: import('@prisma/client').Prisma.SaleWhereInput = { tenantId, status: 'COMPLETED' };
  if (query.storeId) where.storeId = query.storeId;
  if (query.from || query.to) {
    where.createdAt = {};
    if (query.from) (where.createdAt as Record<string, Date>).gte = new Date(query.from);
    if (query.to) (where.createdAt as Record<string, Date>).lte = new Date(query.to + 'T23:59:59Z');
  }

  const results = await prisma.sale.groupBy({
    by: ['cashierId'],
    where,
    _count: { id: true },
    _sum: { totalAmount: true },
    orderBy: { _sum: { totalAmount: 'desc' } }
  });

  const cashierIds = results.map((r) => r.cashierId);
  const cashiers = await prisma.user.findMany({
    where: { id: { in: cashierIds } },
    select: { id: true, firstName: true, lastName: true }
  });
  const cashierMap = new Map(cashiers.map((c) => [c.id, c]));

  return results.map((r) => {
    const cashier = cashierMap.get(r.cashierId);
    const count = r._count?.id ?? 0;
    const revenue = r._sum?.totalAmount ?? 0;
    return {
      cashierId: r.cashierId,
      cashierName: cashier ? `${cashier.firstName} ${cashier.lastName}` : 'Unknown',
      salesCount: count,
      totalRevenue: revenue,
      averageOrderValue: count > 0 ? Math.round(revenue / count) : 0
    };
  });
};

export const getEndOfDay = async (tenantId: string, query: EndOfDayQuery): Promise<Record<string, unknown>> => {
  const date = query.date ?? new Date().toISOString().split('T')[0];
  const startOfDay = new Date(`${date}T00:00:00.000Z`);
  const endOfDay = new Date(`${date}T23:59:59.999Z`);

  const shifts = await prisma.shift.findMany({
    where: { tenantId, storeId: query.storeId, openedAt: { gte: startOfDay, lte: endOfDay } },
    include: { sales: { include: { payments: true } }, cashier: { select: { id: true, firstName: true, lastName: true } } }
  });

  const sales = await prisma.sale.findMany({
    where: { tenantId, storeId: query.storeId, createdAt: { gte: startOfDay, lte: endOfDay } },
    include: { payments: true, cashier: { select: { id: true, firstName: true, lastName: true } } }
  });

  const totalRevenue = sales.reduce((s, sale) => s + sale.totalAmount, 0);
  const voidedSales = sales.filter((s) => s.status === 'VOIDED');

  const cashierSales: Record<string, { name: string; count: number; revenue: number }> = {};
  for (const sale of sales) {
    const cid = sale.cashierId;
    if (!cashierSales[cid]) cashierSales[cid] = { name: `${sale.cashier.firstName} ${sale.cashier.lastName}`, count: 0, revenue: 0 };
    cashierSales[cid]!.count++;
    cashierSales[cid]!.revenue += sale.totalAmount;
  }

  return {
    date,
    totalRevenue,
    totalSales: sales.length,
    totalVoids: voidedSales.length,
    shifts: shifts.map((s) => ({
      id: s.id, cashier: `${s.cashier.firstName} ${s.cashier.lastName}`,
      openingFloat: s.openingFloat, closingFloat: s.closingFloat,
      status: s.status, openedAt: s.openedAt, closedAt: s.closedAt
    })),
    salesPerCashier: Object.entries(cashierSales).map(([id, data]) => ({ cashierId: id, ...data }))
  };
};
