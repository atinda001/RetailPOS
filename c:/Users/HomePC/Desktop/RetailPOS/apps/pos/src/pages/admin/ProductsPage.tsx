import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiClient } from '../../lib/api';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export function ProductsPage() {
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [barcode, setBarcode] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', page],
    queryFn: () => apiClient.get('/products?page=' + page + '&limit=20')
  });

  const saveMutation = useMutation({
    mutationFn: (body: any) => editing
      ? apiClient.put('/products/' + editing.id, body)
      : apiClient.post('/products', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-products'] }); setShowForm(false); setEditing(null); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete('/products/' + id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-products'] })
  });

  const openEdit = (p: any) => {
    setEditing(p); setName(p.name); setPrice(String(p.priceAmount)); setCost(String(p.costAmount)); setBarcode(p.barcode ?? ''); setShowForm(true);
  };

  const openNew = () => {
    setEditing(null); setName(''); setPrice(''); setCost(''); setBarcode(''); setShowForm(true);
  };

  const handleSave = () => {
    saveMutation.mutate({ name, priceAmount: parseInt(price, 10), costAmount: parseInt(cost, 10), barcode: barcode || undefined });
  };

  const products = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, limit: 20 };
  const totalPages = Math.ceil(meta.total / meta.limit);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md">
          <Plus className="h-4 w-4" />Add Product
        </button>
      </div>
      {showForm && (
        <div className="mb-6 p-4 border rounded-lg bg-card space-y-3">
          <h3 className="font-semibold">{editing ? 'Edit Product' : 'New Product'}</h3>
          <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border rounded-md bg-background" />
          <input type="number" placeholder="Price (KES)" value={price} onChange={(e) => setPrice(e.target.value)}
            className="w-full px-3 py-2 border rounded-md bg-background" />
          <input type="number" placeholder="Cost (KES)" value={cost} onChange={(e) => setCost(e.target.value)}
            className="w-full px-3 py-2 border rounded-md bg-background" />
          <input type="text" placeholder="Barcode (optional)" value={barcode} onChange={(e) => setBarcode(e.target.value)}
            className="w-full px-3 py-2 border rounded-md bg-background" />
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saveMutation.isPending}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-md">Cancel</button>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {products.map((p: any) => (
          <div key={p.id} className="p-3 border rounded-lg flex justify-between items-center">
            <div>
              <p className="font-medium">{p.name}</p>
              <p className="text-sm text-muted-foreground">KES {p.priceAmount} | Barcode: {p.barcode ?? 'N/A'}</p>
            </div>
            <div className="flex gap-1">
              <button onClick={() => openEdit(p)} className="p-2 rounded hover:bg-accent"><Pencil className="h-4 w-4" /></button>
              <button onClick={() => deleteMutation.mutate(p.id)} className="p-2 rounded hover:bg-destructive/10 text-destructive"><Trash2 className="h-4 w-4" /></button>
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