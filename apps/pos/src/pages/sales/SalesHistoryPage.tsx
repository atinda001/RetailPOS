import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { apiClient } from '../../lib/api';
import { Eye, Printer, X, Search } from 'lucide-react';

const formatKES = (cents: number) => `KES ${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

function SaleDetailModal({ saleId, onClose }: { saleId: string; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['sale-detail', saleId],
    queryFn: () => apiClient.get('/sales/' + saleId),
  });
  const sale = (data as any)?.data;

  const handlePrint = () => window.print();

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-background">
          <h2 className="text-lg font-bold">Sale Detail</h2>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 border rounded-md text-sm hover:bg-muted">
              <Printer className="h-4 w-4" /> Print
            </button>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-md"><X className="h-4 w-4" /></button>
          </div>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : !sale ? (
          <div className="p-8 text-center text-destructive">Sale not found</div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Header */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">Receipt #</span><p className="font-mono font-bold">{sale.receiptNumber}</p></div>
              <div><span className="text-muted-foreground">Status</span>
                <p><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sale.status === 'VOIDED' ? 'bg-destructive/10 text-destructive' : 'bg-green-100 text-green-700'}`}>{sale.status}</span></p>
              </div>
              <div><span className="text-muted-foreground">Date & Time</span><p className="font-medium">{new Date(sale.createdAt).toLocaleString()}</p></div>
              <div><span className="text-muted-foreground">Cashier</span><p className="font-medium">{sale.cashier?.firstName} {sale.cashier?.lastName}</p></div>
              <div><span className="text-muted-foreground">Store</span><p className="font-medium">{sale.store?.name}</p></div>
              {sale.customer && <div><span className="text-muted-foreground">Customer</span><p className="font-medium">{sale.customer.firstName} {sale.customer.lastName}</p></div>}
            </div>

            {/* Line Items */}
            <div>
              <h3 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">Items</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-2 font-medium">Product</th>
                      <th className="text-center p-2 font-medium">Qty</th>
                      <th className="text-right p-2 font-medium">Unit Price</th>
                      <th className="text-right p-2 font-medium">Discount</th>
                      <th className="text-right p-2 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(sale.lineItems ?? []).map((item: any) => (
                      <tr key={item.id} className="border-t">
                        <td className="p-2">
                          <p className="font-medium">{item.productName}</p>
                          {item.productBarcode && <p className="text-xs text-muted-foreground">{item.productBarcode}</p>}
                        </td>
                        <td className="p-2 text-center">{item.quantity}</td>
                        <td className="p-2 text-right">{formatKES(item.unitPriceAmount)}</td>
                        <td className="p-2 text-right">{item.discountAmount > 0 ? <span className="text-destructive">-{formatKES(item.discountAmount)}</span> : '—'}</td>
                        <td className="p-2 text-right font-medium">{formatKES(item.totalAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="border rounded-lg p-3 space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatKES(sale.subtotalAmount)}</span></div>
              {sale.discountAmount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span className="text-destructive">-{formatKES(sale.discountAmount)}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">VAT (16%)</span><span>{formatKES(sale.taxAmount)}</span></div>
              <div className="flex justify-between font-bold text-base border-t pt-1.5 mt-1.5"><span>Total</span><span>{formatKES(sale.totalAmount)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tendered</span><span>{formatKES(sale.amountTendered)}</span></div>
              {sale.changeAmount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Change</span><span>{formatKES(sale.changeAmount)}</span></div>}
            </div>

            {/* Payments */}
            <div>
              <h3 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">Payments</h3>
              <div className="space-y-1.5">
                {(sale.payments ?? []).map((p: any) => (
                  <div key={p.id} className="flex justify-between items-center text-sm p-2 bg-muted/40 rounded">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">{p.method}</span>
                      {p.reference && <span className="text-muted-foreground font-mono text-xs">Ref: {p.reference}</span>}
                    </div>
                    <span className="font-medium">{formatKES(p.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function SalesHistoryPage() {
  const [page, setPage] = useState(1);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const params = new URLSearchParams({ page: String(page), limit: '20' });
  if (statusFilter) params.set('status', statusFilter);

  const { data, isLoading } = useQuery({
    queryKey: ['sales', page, statusFilter],
    queryFn: () => apiClient.get('/sales?' + params.toString()),
  });

  const sales: any[] = (data as any)?.data ?? [];
  const meta = (data as any)?.meta ?? { total: 0, page: 1, limit: 20 };
  const totalPages = Math.ceil(meta.total / meta.limit) || 1;

  const filtered = search
    ? sales.filter((s) => s.receiptNumber?.toLowerCase().includes(search.toLowerCase()) ||
        `${s.cashier?.firstName} ${s.cashier?.lastName}`.toLowerCase().includes(search.toLowerCase()))
    : sales;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Sales History</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Search receipt or cashier..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 py-2 border rounded-md bg-background text-sm w-60" />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border rounded-md bg-background text-sm">
          <option value="">All Statuses</option>
          <option value="COMPLETED">Completed</option>
          <option value="VOIDED">Voided</option>
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />)}</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((sale) => (
            <div key={sale.id} className="p-4 border rounded-lg bg-card flex justify-between items-center hover:border-primary/30 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-mono font-bold text-sm">{sale.receiptNumber}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    sale.status === 'VOIDED' ? 'bg-destructive/10 text-destructive' : 'bg-green-100 text-green-700'
                  }`}>{sale.status}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {sale.cashier?.firstName} {sale.cashier?.lastName} · {new Date(sale.createdAt).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">{sale.lineItems?.length ?? 0} items</p>
              </div>
              <div className="text-right ml-4 flex items-center gap-3">
                <div>
                  <p className="text-lg font-bold">{formatKES(sale.totalAmount)}</p>
                  <p className="text-xs text-muted-foreground">
                    {(sale.payments ?? []).map((p: any) => p.method).join(', ')}
                  </p>
                </div>
                <button onClick={() => setSelectedSaleId(sale.id)}
                  className="p-2 hover:bg-muted rounded-md" title="View details">
                  <Eye className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No sales found</div>
          )}
        </div>
      )}

      <div className="flex justify-center gap-2 mt-6">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
          className="px-3 py-1 border rounded-md disabled:opacity-50">Prev</button>
        <span className="px-3 py-1 text-sm">Page {page} of {totalPages}</span>
        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
          className="px-3 py-1 border rounded-md disabled:opacity-50">Next</button>
      </div>

      {selectedSaleId && (
        <SaleDetailModal saleId={selectedSaleId} onClose={() => setSelectedSaleId(null)} />
      )}
    </div>
  );
}