import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiClient } from '../../lib/api';
import { Plus } from 'lucide-react';

export function SuppliersPage() {
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['suppliers', page],
    queryFn: () => apiClient.get('/suppliers?page=' + page + '&limit=20')
  });

  const createMutation = useMutation({
    mutationFn: () => apiClient.post('/suppliers', { name, phone: phone || null, email: email || null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['suppliers'] }); setShowForm(false); }
  });

  const suppliers = data?.data ?? [];
  const meta = data?.meta ?? { total: 0 };
  const totalPages = Math.ceil(meta.total / meta.limit);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Suppliers</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md">
          <Plus className="h-4 w-4" />Add Supplier
        </button>
      </div>
      {showForm && (
        <div className="mb-6 p-4 border rounded-lg bg-card space-y-3">
          <h3 className="font-semibold">New Supplier</h3>
          <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border rounded-md bg-background" />
          <input type="text" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2 border rounded-md bg-background" />
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded-md bg-background" />
          <div className="flex gap-2">
            <button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50">Create</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-md">Cancel</button>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {suppliers.map((s: any) => (
          <div key={s.id} className="p-3 border rounded-lg">
            <p className="font-medium">{s.name}</p>
            <p className="text-sm text-muted-foreground">{s.phone ?? 'No phone'} | {s.email ?? 'No email'}</p>
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