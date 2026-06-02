import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { apiClient } from '../../lib/api';
import { Search } from 'lucide-react';

export function CustomersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['customers', page, search],
    queryFn: () => apiClient.get('/customers?page=' + page + '&limit=20&search=' + encodeURIComponent(search))
  });

  const customers = data?.data ?? [];
  const meta = data?.meta ?? { total: 0 };
  const totalPages = Math.ceil(meta.total / meta.limit);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Customers</h1>
      <div className="relative mb-4 w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input type="text" placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border rounded-md bg-background" />
      </div>
      <div className="space-y-2">
        {customers.map((c: any) => (
          <div key={c.id} className="p-3 border rounded-lg">
            <p className="font-medium">{c.firstName} {c.lastName ?? ''}</p>
            <p className="text-sm text-muted-foreground">{c.phone ?? 'No phone'} | {c.email ?? 'No email'}</p>
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