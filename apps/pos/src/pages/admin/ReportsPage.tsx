import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { TrendingUp, DollarSign, ShoppingCart, Percent, AlertTriangle, Calendar } from 'lucide-react';
import { apiClient } from '../../lib/api';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
const formatKES = (cents: number) => `KES ${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

const today = () => new Date().toISOString().split('T')[0]!;
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString().split('T')[0]!;

const PRESETS = [
  { label: 'Today', from: today(), to: today() },
  { label: 'Yesterday', from: daysAgo(1), to: daysAgo(1) },
  { label: 'This Week', from: daysAgo(6), to: today() },
  { label: 'This Month', from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]!, to: today() },
  { label: 'Last 30 Days', from: daysAgo(29), to: today() },
];

export function ReportsPage() {
  const [storeId, setStoreId] = useState('');
  const [from, setFrom] = useState(daysAgo(29));
  const [to, setTo] = useState(today());
  const [activePreset, setActivePreset] = useState('Last 30 Days');

  const { data: storesData } = useQuery({
    queryKey: ['stores-list'],
    queryFn: () => apiClient.get('/stores'),
  });
  const stores = (storesData as any)?.data ?? [];

  const params = new URLSearchParams();
  if (storeId) params.set('storeId', storeId);
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const qs = params.toString();

  const { data: salesSummary, isLoading } = useQuery({
    queryKey: ['report-sales', storeId, from, to],
    queryFn: () => apiClient.get(`/reports/sales-summary?${qs}`),
  });

  const { data: cashierData } = useQuery({
    queryKey: ['report-cashier', storeId, from, to],
    queryFn: () => apiClient.get(`/reports/cashier-performance?${qs}`),
  });

  const { data: endOfDay } = useQuery({
    queryKey: ['report-eod', storeId],
    queryFn: () => apiClient.get(`/reports/end-of-day?storeId=${storeId}&date=${today()}`),
    enabled: !!storeId,
  });

  const summary = (salesSummary as any)?.data ?? {};
  const eod = (endOfDay as any)?.data ?? {};
  const cashiers: any[] = (cashierData as any)?.data ?? [];

  const paymentData = Object.entries(summary.paymentBreakdown ?? {}).map(([name, value]) => ({
    name: name.charAt(0) + name.slice(1).toLowerCase(),
    value: Number(value),
  }));

  const topProducts = (summary.topProducts ?? []).map((p: any) => ({
    name: p.name?.length > 22 ? p.name.slice(0, 22) + '…' : p.name,
    revenue: Number(p.revenue),
  }));

  const salesByHour = (summary.salesByHour ?? []).map((h: any) => ({
    hour: `${String(h.hour).padStart(2, '0')}:00`,
    revenue: Number(h.revenue),
    count: Number(h.salesCount),
  }));

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setFrom(preset.from);
    setTo(preset.to);
    setActivePreset(preset.label);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Reports &amp; Analytics</h1>

      {/* Filters */}
      <div className="bg-card border rounded-lg p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button key={p.label} onClick={() => applyPreset(p)}
              className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${activePreset === p.label ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'}`}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setActivePreset(''); }}
              className="px-2 py-1.5 border rounded-md bg-background text-sm" />
            <span>to</span>
            <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setActivePreset(''); }}
              className="px-2 py-1.5 border rounded-md bg-background text-sm" />
          </div>
          <select value={storeId} onChange={(e) => setStoreId(e.target.value)}
            className="px-3 py-1.5 border rounded-md bg-background text-sm min-w-[160px]">
            <option value="">All Stores</option>
            {stores.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: formatKES(summary.totalRevenue ?? 0), icon: <DollarSign className="h-5 w-5 text-blue-600" />, bg: 'bg-blue-50' },
          { label: 'Total Sales', value: summary.totalSales ?? 0, icon: <ShoppingCart className="h-5 w-5 text-green-600" />, bg: 'bg-green-50' },
          { label: 'Avg Order Value', value: formatKES(summary.averageOrderValue ?? 0), icon: <TrendingUp className="h-5 w-5 text-purple-600" />, bg: 'bg-purple-50' },
          { label: 'Total Tax (VAT)', value: formatKES(summary.totalTax ?? 0), icon: <Percent className="h-5 w-5 text-amber-600" />, bg: 'bg-amber-50' },
        ].map((card) => (
          <div key={card.label} className="p-4 border rounded-lg bg-card">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${card.bg}`}>{card.icon}</div>
              <div>
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className="text-lg font-bold">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mr-3" />
          Loading reports...
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Sales by Hour */}
          <div className="p-6 border rounded-lg bg-card">
            <h2 className="text-lg font-semibold mb-4">Sales by Hour (Nairobi Time)</h2>
            {salesByHour.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={salesByHour}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: any, name: string) => [name === 'revenue' ? formatKES(Number(value)) : value, name === 'revenue' ? 'Revenue' : 'Sales']} />
                  <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground py-10">No sales data for this period</p>}
          </div>

          {/* Payment Methods */}
          <div className="p-6 border rounded-lg bg-card">
            <h2 className="text-lg font-semibold mb-4">Payment Methods</h2>
            {paymentData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={paymentData} cx="50%" cy="50%" outerRadius={90} dataKey="value"
                    label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                    {paymentData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatKES(Number(value))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground py-10">No payment data</p>}
          </div>

          {/* Top Products */}
          <div className="p-6 border rounded-lg bg-card">
            <h2 className="text-lg font-semibold mb-4">Top Products by Revenue</h2>
            {topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 100).toFixed(0)}`} />
                  <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: any) => formatKES(Number(value))} />
                  <Bar dataKey="revenue" fill="#10B981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground py-10">No product sales data</p>}
          </div>

          {/* Cashier Performance */}
          <div className="p-6 border rounded-lg bg-card">
            <h2 className="text-lg font-semibold mb-4">Cashier Performance</h2>
            {cashiers.length > 0 ? (
              <div className="space-y-2">
                {cashiers.map((c: any) => (
                  <div key={c.cashierId} className="flex justify-between items-center p-3 bg-muted/40 rounded-md">
                    <div>
                      <p className="font-medium text-sm">{c.cashierName}</p>
                      <p className="text-xs text-muted-foreground">{c.salesCount} sales</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">{formatKES(c.totalRevenue)}</p>
                      <p className="text-xs text-muted-foreground">Avg: {formatKES(c.averageOrderValue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-center text-muted-foreground py-10">No cashier data</p>}
          </div>

          {/* End of Day Summary */}
          <div className="p-6 border rounded-lg bg-card lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" /> Today's End-of-Day Summary
              {!storeId && <span className="text-sm font-normal text-muted-foreground">(Select a store to view)</span>}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Date', value: eod.date ?? 'N/A' },
                { label: 'Total Revenue', value: formatKES(eod.totalRevenue ?? 0) },
                { label: 'Transactions', value: eod.totalSales ?? 0 },
                { label: 'Voids', value: eod.totalVoids ?? 0 },
              ].map((item) => (
                <div key={item.label} className="p-3 bg-muted/40 rounded-md">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="font-bold mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>
            {(eod.salesPerCashier ?? []).length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Per Cashier</p>
                {(eod.salesPerCashier ?? []).map((c: any) => (
                  <div key={c.cashierId} className="flex justify-between text-sm p-2 bg-muted/30 rounded">
                    <span>{c.name}</span>
                    <span className="font-medium">{c.count} sales — {formatKES(c.revenue)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
