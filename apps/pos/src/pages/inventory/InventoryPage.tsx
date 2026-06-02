import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiClient } from '../../lib/api';
import { AlertTriangle, Package, TrendingDown, CheckCircle, Sliders, X } from 'lucide-react';

type StockStatus = 'OUT' | 'LOW' | 'OK';

const getStatus = (qty: number, reorder: number): StockStatus => {
  if (qty <= 0) return 'OUT';
  if (qty <= reorder) return 'LOW';
  return 'OK';
};

const STATUS_BADGE: Record<StockStatus, string> = {
  OUT: 'bg-destructive/10 text-destructive',
  LOW: 'bg-amber-100 text-amber-700',
  OK: 'bg-green-100 text-green-700',
};

function AdjustModal({ item, storeId, onClose }: { item: any; storeId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [delta, setDelta] = useState('');
  const [type, setType] = useState('ADJUSTMENT_IN');
  const [reason, setReason] = useState('');

  const mutation = useMutation({
    mutationFn: () => apiClient.post(`/inventory/${item.id}/adjust`, {
      quantityDelta: Number(delta),
      type,
      reason: reason || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory', storeId] });
      qc.invalidateQueries({ queryKey: ['lowStock', storeId] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background rounded-xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-bold">Adjust Stock — {item.product?.name}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex justify-between text-sm p-3 bg-muted/40 rounded-md">
            <span className="text-muted-foreground">Current Stock</span>
            <span className="font-bold text-lg">{item.quantityOnHand}</span>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Adjustment Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background text-sm">
              <option value="ADJUSTMENT_IN">Add Stock (In)</option>
              <option value="ADJUSTMENT_OUT">Remove Stock (Out)</option>
              <option value="WASTE">Waste / Damage</option>
              <option value="OPENING_STOCK">Opening Stock</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Quantity Delta</label>
            <input type="number" value={delta} onChange={(e) => setDelta(e.target.value)}
              placeholder="e.g. 50 or -10"
              className="w-full px-3 py-2 border rounded-md bg-background text-sm" />
            <p className="text-xs text-muted-foreground mt-1">
              Use positive numbers to add, negative to remove
            </p>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Reason (optional)</label>
            <input type="text" value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Received from supplier"
              className="w-full px-3 py-2 border rounded-md bg-background text-sm" />
          </div>
          {mutation.isError && (
            <p className="text-sm text-destructive">Failed to adjust stock. Please try again.</p>
          )}
          <div className="flex gap-2 pt-1">
            <button onClick={() => mutation.mutate()} disabled={!delta || mutation.isPending}
              className="flex-1 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50">
              {mutation.isPending ? 'Saving…' : 'Apply Adjustment'}
            </button>
            <button onClick={onClose} className="px-4 py-2 border rounded-md text-sm">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function InventoryPage() {
  const [storeId, setStoreId] = useState('');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [adjustItem, setAdjustItem] = useState<any>(null);

  const { data: storesData } = useQuery({
    queryKey: ['stores-list'],
    queryFn: () => apiClient.get('/stores'),
  });
  const stores = (storesData as any)?.data ?? [];

  const { data, isLoading } = useQuery({
    queryKey: ['inventory', storeId, page, search],
    queryFn: () => {
      const p = new URLSearchParams({ storeId, page: String(page), limit: '20' });
      if (search) p.set('search', search);
      return apiClient.get('/inventory?' + p.toString());
    },
    enabled: !!storeId,
  });

  const { data: lowStock } = useQuery({
    queryKey: ['lowStock', storeId],
    queryFn: () => apiClient.get('/inventory/low-stock?storeId=' + storeId),
    enabled: !!storeId,
  });

  const items: any[] = (data as any)?.data ?? [];
  const meta = (data as any)?.meta ?? { total: 0 };
  const totalPages = Math.ceil(meta.total / 20) || 1;
  const lowStockItems: any[] = (lowStock as any)?.data ?? [];

  const outCount = lowStockItems.filter((s) => s.quantityOnHand <= 0).length;
  const lowCount = lowStockItems.filter((s) => s.quantityOnHand > 0 && s.quantityOnHand <= s.reorderPoint).length;
  const okCount = items.filter((s) => s.quantityOnHand > s.reorderPoint).length;

  return (
    <div className="p-6 space-y-5">
      <h1 className="text-2xl font-bold">Inventory</h1>

      {/* Store selector */}
      <div className="flex flex-wrap gap-3 items-center">
        <select value={storeId} onChange={(e) => { setStoreId(e.target.value); setPage(1); }}
          className="px-3 py-2 border rounded-md bg-background text-sm min-w-[200px]">
          <option value="">Select a store…</option>
          {stores.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input type="text" placeholder="Search product…" value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="px-3 py-2 border rounded-md bg-background text-sm w-56" />
      </div>

      {storeId && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg bg-card flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg"><TrendingDown className="h-5 w-5 text-destructive" /></div>
              <div><p className="text-xs text-muted-foreground">Out of Stock</p><p className="text-xl font-bold text-destructive">{outCount}</p></div>
            </div>
            <div className="p-4 border rounded-lg bg-card flex items-center gap-3">
              <div className="p-2 bg-amber-50 rounded-lg"><AlertTriangle className="h-5 w-5 text-amber-600" /></div>
              <div><p className="text-xs text-muted-foreground">Low Stock</p><p className="text-xl font-bold text-amber-600">{lowCount}</p></div>
            </div>
            <div className="p-4 border rounded-lg bg-card flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg"><CheckCircle className="h-5 w-5 text-green-600" /></div>
              <div><p className="text-xs text-muted-foreground">Adequately Stocked</p><p className="text-xl font-bold text-green-600">{okCount}</p></div>
            </div>
          </div>

          {/* Low stock alert banner */}
          {lowStockItems.length > 0 && (
            <div className="p-4 border border-amber-300 bg-amber-50/50 rounded-lg">
              <h2 className="font-semibold text-amber-700 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" /> Low / Out of Stock ({lowStockItems.length} items)
              </h2>
              <div className="flex flex-wrap gap-2">
                {lowStockItems.slice(0, 8).map((si: any) => (
                  <span key={si.id} className="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded-full">
                    {si.productName ?? si.product?.name} ({si.quantityOnHand})
                  </span>
                ))}
                {lowStockItems.length > 8 && <span className="text-xs px-2 py-1 bg-muted rounded-full">+{lowStockItems.length - 8} more</span>}
              </div>
            </div>
          )}

          {/* Main table */}
          {isLoading ? (
            <div className="space-y-2">{[...Array(8)].map((_, i) => <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />)}</div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Product</th>
                    <th className="text-left p-3 font-medium">Category</th>
                    <th className="text-center p-3 font-medium">On Hand</th>
                    <th className="text-center p-3 font-medium">Reorder Point</th>
                    <th className="text-center p-3 font-medium">Status</th>
                    <th className="text-right p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((si: any) => {
                    const status = getStatus(si.quantityOnHand, si.reorderPoint);
                    return (
                      <tr key={si.id} className="border-t hover:bg-muted/20 transition-colors">
                        <td className="p-3">
                          <p className="font-medium">{si.product?.name}</p>
                          {si.product?.sku && <p className="text-xs text-muted-foreground">SKU: {si.product.sku}</p>}
                        </td>
                        <td className="p-3 text-muted-foreground">{si.product?.category?.name ?? '—'}</td>
                        <td className="p-3 text-center font-bold">{si.quantityOnHand}</td>
                        <td className="p-3 text-center text-muted-foreground">{si.reorderPoint}</td>
                        <td className="p-3 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[status]}`}>
                            {status === 'OUT' ? 'Out of Stock' : status === 'LOW' ? 'Low Stock' : 'OK'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button onClick={() => setAdjustItem(si)}
                            className="flex items-center gap-1 ml-auto px-2.5 py-1.5 border rounded-md text-xs hover:bg-muted">
                            <Sliders className="h-3.5 w-3.5" /> Adjust
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {items.length === 0 && (
                    <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      No inventory items found
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-center gap-2 mt-4">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1 border rounded-md disabled:opacity-50 text-sm">Prev</button>
            <span className="px-3 py-1 text-sm">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="px-3 py-1 border rounded-md disabled:opacity-50 text-sm">Next</button>
          </div>
        </>
      )}

      {!storeId && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Package className="h-12 w-12 mb-3 opacity-30" />
          <p>Select a store to view inventory</p>
        </div>
      )}

      {adjustItem && (
        <AdjustModal item={adjustItem} storeId={storeId} onClose={() => setAdjustItem(null)} />
      )}
    </div>
  );
}