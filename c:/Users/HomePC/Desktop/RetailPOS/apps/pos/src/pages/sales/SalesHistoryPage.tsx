import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { apiClient } from '../../lib/api';
import { format } from 'date-fns';

export function SalesHistoryPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['sales', page],
    queryFn: () => apiClient.get('/sales?page=' + page + '&limit=20')
  });

  if (isLoading) return <div className="p-6">Loading...</div>;

  const sales = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, limit: 20 };
  const totalPages = Math.ceil(meta.total / meta.limit);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Sales History</h1>
      <div className="space-y-3">
        {sales.map((sale: any) => (
          <div key={sale.id} className="p-4 border rounded-lg bg-card">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-mono font-bold">{sale.receiptNumber}</p>
                <p className="text-sm text-muted-foreground">{sale.cashier?.firstName} {sale.cashier?.lastName}</p>
                <p className="text-xs text-muted-foreground">{new Date(sale.createdAt).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">KES {sale.totalAmount.toLocaleString()}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${sale.status === 'VOIDED' ? 'bg-destructive/10 text-destructive' : 'bg-green-100 text-green-700'}`}>{sale.status}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-2 mt-6">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
          className="px-3 py-1 border rounded-md disabled:opacity-50">Prev</button>
        <span className="px-3 py-1">Page {page} of {totalPages}</span>
        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
          className="px-3 py-1 border rounded-md disabled:opacity-50">Next</button>
      </div>
    </div>
  );
}