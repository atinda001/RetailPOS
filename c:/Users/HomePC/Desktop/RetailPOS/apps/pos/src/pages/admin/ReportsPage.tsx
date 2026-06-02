import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { apiClient } from '../../lib/api';

export function ReportsPage() {
  const [storeId, setStoreId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const { data: salesSummary, isLoading: loadingSales } = useQuery({
    queryKey: ['report-sales', storeId, from, to],
    queryFn: () => apiClient.get('/reports/sales-summary?storeId=' + storeId + '&from=' + from + '&to=' + to)
  });

  const { data: endOfDay } = useQuery({
    queryKey: ['report-eod', storeId],
    queryFn: () => apiClient.get('/reports/end-of-day?storeId=' + storeId),
    enabled: !!storeId
  });

  const summary = salesSummary?.data ?? {};
  const eod = endOfDay?.data ?? {};

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Reports</h1>
      <div className="flex gap-3 mb-6 flex-wrap">
        <input type="text" placeholder="Store ID" value={storeId} onChange={(e) => setStoreId(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background" />
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="p-6 border rounded-lg bg-card">
          <h2 className="text-lg font-semibold mb-4">Sales Summary</h2>
          {loadingSales ? <p>Loading...</p> : (
            <div className="space-y-3">
              <div className="flex justify-between"><span>Total Sales</span><span className="font-bold">{summary.totalSales ?? 0}</span></div>
              <div className="flex justify-between"><span>Total Revenue</span><span className="font-bold text-lg">KES {(summary.totalRevenue ?? 0).toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Total Tax</span><span>KES {(summary.totalTax ?? 0).toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Total Discount</span><span>KES {(summary.totalDiscount ?? 0).toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Avg Order Value</span><span className="font-bold">KES {(summary.averageOrderValue ?? 0).toLocaleString()}</span></div>
            </div>
          )}
        </div>
        <div className="p-6 border rounded-lg bg-card">
          <h2 className="text-lg font-semibold mb-4">End of Day</h2>
          <div className="space-y-3">
            <div className="flex justify-between"><span>Date</span><span>{eod.date ?? 'N/A'}</span></div>
            <div className="flex justify-between"><span>Total Revenue</span><span className="font-bold">KES {(eod.totalRevenue ?? 0).toLocaleString()}</span></div>
            <div className="flex justify-between"><span>Total Sales</span><span>{eod.totalSales ?? 0}</span></div>
            <div className="flex justify-between"><span>Total Voids</span><span className="text-destructive">{eod.totalVoids ?? 0}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}