import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiClient } from '../../lib/api';
import { Plus, UserCheck, UserX } from 'lucide-react';

export function UsersPage() {
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('CASHIER');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['users', page],
    queryFn: () => apiClient.get('/users?page=' + page + '&limit=20')
  });

  const createMutation = useMutation({
    mutationFn: () => apiClient.post('/users', { email, password, firstName, lastName, role }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setShowForm(false); }
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => apiClient.put('/users/' + id, { isActive: !isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] })
  });

  const users = data?.data ?? [];
  const meta = data?.meta ?? { total: 0 };
  const totalPages = Math.ceil(meta.total / meta.limit);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md">
          <Plus className="h-4 w-4" />Add User
        </button>
      </div>
      {showForm && (
        <div className="mb-6 p-4 border rounded-lg bg-card space-y-3">
          <h3 className="font-semibold">New User</h3>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded-md bg-background" />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-md bg-background" />
          <input type="text" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)}
            className="w-full px-3 py-2 border rounded-md bg-background" />
          <input type="text" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)}
            className="w-full px-3 py-2 border rounded-md bg-background" />
          <select value={role} onChange={(e) => setRole(e.target.value)}
            className="w-full px-3 py-2 border rounded-md bg-background">
            <option value="CASHIER">Cashier</option>
            <option value="MANAGER">Manager</option>
            <option value="ADMIN">Admin</option>
          </select>
          <div className="flex gap-2">
            <button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50">Create</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-md">Cancel</button>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {users.map((u: any) => (
          <div key={u.id} className="p-3 border rounded-lg flex justify-between items-center">
            <div>
              <p className="font-medium">{u.firstName} {u.lastName}</p>
              <p className="text-sm text-muted-foreground">{u.email} | {u.role}</p>
            </div>
            <button onClick={() => toggleMutation.mutate({ id: u.id, isActive: u.isActive })}
              className={`p-2 rounded ${u.isActive ? 'text-green-600 hover:bg-green-50' : 'text-destructive hover:bg-destructive/10'}`}>
              {u.isActive ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
            </button>
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