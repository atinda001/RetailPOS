import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiClient } from '../../lib/api';
import { Plus, CheckCircle } from 'lucide-react';

export function PurchasesPage() {
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [storeId, setStoreId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unitCost, setUnitCost] = useState('');
  const [lineItems, setLineItems] = useState<any[]>([]);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['purchases', page],
    queryFn: () => apiClient.get('/purchases?page=' + page + '&limit=20')
  });

  const createMutation = useMutation({
    mutationFn: () => apiClient.post('/purchases', { storeId, supplierId: supplierId || null, lineItems }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['purchases'] }); setShowForm(false); setLineItems([]); }
  });

  const receiveMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch('/purchases/' + id + '/receive', {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['purchases'] })
  });

  const addLineItem = () => {
    if (!productId || !unitCost) return;
    setLineItems([...lineItems, { productId, quantity: parseInt(quantity, 10), unitCostAmount: parseInt(unitCost, 10) }]);
    setProductId(''); setQuantity('1'); setUnitCost('');
  };

  const purchases = data?.data ?? [];
  const meta = data?.meta ?? { total: 0 };
  const totalPages = Math.ceil(meta.total / meta.limit);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Purchases</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md">
          <Plus className="h-4 w-4" />New Purchase
        </button>
      </div>
      {showForm && (
        <div className="mb-6 p-4 border rounded-lg bg-card space-y-3">
          <h3 className="font-semibold">New Purchase Order</h3>
          <input type="text" placeholder="Store ID" value={storeId} onChange={(e) => setStoreId(e.target.value)}
            className="w-full px-3 py-2 border rounded-md bg-background" />
          <input type="text" placeholder="Supplier ID (optional)" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}
            className="w-full px-3 py-2 border rounded-md bg-background" />
          <div className="flex gap-2">
            <input type="text" placeholder="Product ID" value={productId} onChange={(e) => setProductId(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md bg-background" />
            <input type="number" placeholder="Qty" value={quantity} onChange={(e) => setQuantity(e.target.value)}
              className="w-20 px-3 py-2 border rounded-md bg-background" />
            <input type="number" placeholder="Unit cost" value={unitCost} onChange={(e) => setUnitCost(e.target.value)}
              className="w-32 px-3 py-2 border rounded-md bg-background" />
            <button onClick={addLineItem} className="px-3 py-2 border rounded-md hover:bg-accent">Add</button>
          </div>
          {lineItems.length > 0 && (
            <div className="space-y-1">
              {lineItems.map((li, i) => (
                <div key={i} className="text-sm flex justify-between">
                  <span>{li.productId} x{li.quantity}</span>
                  <span>KES {li.unitCostAmount}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || lineItems.length === 0}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50">Create</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-md">Cancel</button>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {purchases.map((p: any) => (
          <div key={p.id} className="p-3 border rounded-lg flex justify-between items-center">
            <div>
              <p className="font-medium">PO-{p.id.slice(0,8)}</p>
              <p className="text-sm text-muted-foreground">KES {p.totalAmount} | {p.status}</p>
            </div>
            {p.status !== 'RECEIVED' && (
              <button onClick={() => receiveMutation.mutate(p.id)} disabled={receiveMutation.isPending}
                className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-md text-sm disabled:opacity-50">
                <CheckCircle className="h-3 w-3" />Receive
              </button>
            )}
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