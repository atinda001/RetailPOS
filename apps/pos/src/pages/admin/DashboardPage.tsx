import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { apiClient } from '../../lib/api';
import { DollarSign, ShoppingCart, Package, Users, Clock, TrendingUp, AlertTriangle, Store } from 'lucide-react';

const formatKES = (cents: number) => `KES ${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
const today = () => new Date().toISOString().split('T')[0]!;

export function DashboardPage() {
  const [storeId, setStoreId] = useState('');

  const { data: storesData } = useQuery({
    queryKey: ['stores-list'],
    queryFn: () => apiClient.get('/stores'),
  });
  const stores = (storesData as any)?.data ?? [];

  const params = new URLSearchParams({ from: today(), to: today() });
  if (storeId) params.set('storeId', storeId);
  const qs = params.toString();

  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ['report-sales-today', storeId],
    queryFn: () => apiClient.get(`/reports/sales-summary?${qs}`),
    enabled: !!storeId,
  });

  const { data: lowStockData, isLoading: lowStockLoading } = useQuery({
    queryKey: ['low-stock-dashboard', storeId],
    queryFn: () => apiClient.get('/inventory/low-stock?storeId=' + storeId),
    enabled: !!storeId,
  });

  const { data: shiftsData, isLoading: shiftsLoading } = useQuery({
    queryKey: ['shifts-active', storeId],
    queryFn: () => apiClient.get('/shifts?storeId=' + storeId + '&status=OPEN'),
    enabled: !!storeId,
  });

  const salesSummary = (salesData as any)?.data ?? {};
  const lowStockItems: any[] = (lowStockData as any)?.data ?? [];
  const activeShifts: any[] = (shiftsData as any)?.data ?? [];

  const todayRevenue = salesSummary.totalRevenue ?? 0;
  const todaySalesCount = salesSummary.totalSales ?? 0;
  const todayAvgOrder = salesSummary.averageOrderValue ?? 0;
  const lowStockCount = lowStockItems.length;
  const activeCashiersCount = activeShifts.length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <select value={storeId} onChange={(e) => setStoreId(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background text-sm min-w-[200px]">
          <option value="">Select a store…</option>
          {stores.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {!storeId ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Store className="h-16 w-16 mb-4 opacity-30" />
          <p className="text-lg">Select a store to view dashboard</p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              label="Today's Revenue"
              value={formatKES(todayRevenue)}
              icon={<DollarSign className="h-5 w-5 text-blue-600" />}
              bg="bg-blue-50"
              loading={salesLoading}
            />
            <KPICard
              label="Today's Sales"
              value={todaySalesCount}
              icon={<ShoppingCart className="h-5 w-5 text-green-600" />}
              bg="bg-green-50"
              loading={salesLoading}
            />
            <KPICard
              label="Avg Order Value"
              value={formatKES(todayAvgOrder)}
              icon={<TrendingUp className="h-5 w-5 text-purple-600" />}
              bg="bg-purple-50"
              loading={salesLoading}
            />
            <KPICard
              label="Active Cashiers"
              value={activeCashiersCount}
              icon={<Users className="h-5 w-5 text-orange-600" />}
              bg="bg-orange-50"
              loading={shiftsLoading}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Low Stock Alert */}
            <div className="p-5 border rounded-lg bg-card">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className={`h-5 w-5 ${lowStockCount > 0 ? 'text-amber-600' : 'text-muted-foreground'}`} />
                Low Stock Alert
              </h2>
              {lowStockLoading ? (
                <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-muted animate-pulse rounded-md" />)}</div>
              ) : lowStockCount > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {lowStockItems.slice(0, 10).map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center p-2 bg-muted/40 rounded text-sm">
                      <span className="font-medium">{item.productName ?? item.product?.name}</span>
                      <span className="font-bold text-amber-600">{item.quantityOnHand} / {item.reorderPoint}</span>
                    </div>
                  ))}
                  {lowStockItems.length > 10 && (
                    <p className="text-xs text-muted-foreground text-center pt-1">+{lowStockItems.length - 10} more items</p>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p>All stock levels are healthy</p>
                </div>
              )}
            </div>

            {/* Active Shifts */}
            <div className="p-5 border rounded-lg bg-card">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-green-600" />
                Active Shifts
              </h2>
              {shiftsLoading ? (
                <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-muted animate-pulse rounded-md" />)}</div>
              ) : activeCashiersCount > 0 ? (
                <div className="space-y-2">
                  {activeShifts.map((shift: any) => (
                    <div key={shift.id} className="flex justify-between items-center p-3 bg-green-50/50 border border-green-200 rounded text-sm">
                      <div>
                        <p className="font-medium">{shift.cashier?.firstName} {shift.cashier?.lastName}</p>
                        <p className="text-xs text-muted-foreground">Opened: {new Date(shift.openedAt).toLocaleTimeString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-700">{shift.salesCount ?? 0} sales</p>
                        <p className="text-xs text-muted-foreground">{formatKES(shift.totalSales ?? 0)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p>No active shifts</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-5 border rounded-lg bg-card">
            <h2 className="font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button className="p-3 border rounded-lg hover:bg-muted transition-colors text-sm font-medium">
                <ShoppingCart className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                New Sale
              </button>
              <button className="p-3 border rounded-lg hover:bg-muted transition-colors text-sm font-medium">
                <Package className="h-5 w-5 mx-auto mb-1 text-green-600" />
                Inventory
              </button>
              <button className="p-3 border rounded-lg hover:bg-muted transition-colors text-sm font-medium">
                <Users className="h-5 w-5 mx-auto mb-1 text-purple-600" />
                Staff
              </button>
              <button className="p-3 border rounded-lg hover:bg-muted transition-colors text-sm font-medium">
                <TrendingUp className="h-5 w-5 mx-auto mb-1 text-amber-600" />
                Reports
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function KPICard({ label, value, icon, bg, loading }: { label: string; value: string | number; icon: React.ReactNode; bg: string; loading: boolean }) {
  return (
    <div className="p-4 border rounded-lg bg-card">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${bg}`}>{icon}</div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">{label}</p>
          {loading ? (
            <div className="h-6 w-20 bg-muted animate-pulse rounded mt-1" />
          ) : (
            <p className="text-lg font-bold">{value}</p>
          )}
        </div>
      </div>
    </div>
  );
}
