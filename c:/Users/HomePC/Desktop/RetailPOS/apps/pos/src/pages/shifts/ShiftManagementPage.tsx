import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { useAuthStore } from '../../stores/auth.store';

export function ShiftManagementPage() {
  const [terminalId, setTerminalId] = useState(localStorage.getItem('terminalId') ?? '');
  const [openingFloat, setOpeningFloat] = useState('0');
  const [closingFloat, setClosingFloat] = useState('0');
  const [notes, setNotes] = useState('');
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  const { data: shiftsData, isLoading } = useQuery({
    queryKey: ['shifts'],
    queryFn: () => apiClient.get('/shifts?storeId=&limit=10')
  });

  const openMutation = useMutation({
    mutationFn: () => apiClient.post('/shifts/open', { terminalId, openingFloat: parseInt(openingFloat, 10) }),
    onSuccess: (res: any) => { localStorage.setItem('shiftId', res.data.id); qc.invalidateQueries({ queryKey: ['shifts'] }); }
  });

  const closeMutation = useMutation({
    mutationFn: (shiftId: string) => apiClient.post('/shifts/' + shiftId + '/close', { closingFloat: parseInt(closingFloat, 10), notes: notes || undefined }),
    onSuccess: () => { localStorage.removeItem('shiftId'); qc.invalidateQueries({ queryKey: ['shifts'] }); }
  });

  const shifts = shiftsData?.data ?? [];
  const activeShiftId = localStorage.getItem('shiftId');

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Shift Management</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="p-6 border rounded-lg bg-card">
          <h2 className="text-lg font-semibold mb-4">Open Shift</h2>
          <div className="space-y-3">
            <input type="text" placeholder="Terminal ID" value={terminalId} onChange={(e) => setTerminalId(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background" />
            <input type="number" placeholder="Opening float (KES)" value={openingFloat} onChange={(e) => setOpeningFloat(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background" />
            <button onClick={() => openMutation.mutate()} disabled={openMutation.isPending || !!activeShiftId}
              className="w-full py-2 bg-primary text-primary-foreground rounded-md font-medium disabled:opacity-50">
              {openMutation.isPending ? 'Opening...' : 'Open Shift'}
            </button>
          </div>
        </div>
        <div className="p-6 border rounded-lg bg-card">
          <h2 className="text-lg font-semibold mb-4">Close Shift</h2>
          <div className="space-y-3">
            <input type="number" placeholder="Closing float (KES)" value={closingFloat} onChange={(e) => setClosingFloat(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background" />
            <input type="text" placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background" />
            <button onClick={() => activeShiftId && closeMutation.mutate(activeShiftId)} disabled={closeMutation.isPending || !activeShiftId}
              className="w-full py-2 bg-destructive text-destructive-foreground rounded-md font-medium disabled:opacity-50">
              {closeMutation.isPending ? 'Closing...' : 'Close Shift'}
            </button>
          </div>
        </div>
      </div>
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-3">Recent Shifts</h2>
        <div className="space-y-2">
          {shifts.map((s: any) => (
            <div key={s.id} className="p-3 border rounded-lg flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">{s.cashier?.firstName} {s.cashier?.lastName}</p>
                <p className="text-xs text-muted-foreground">{new Date(s.openedAt).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <span className={`text-xs px-2 py-0.5 rounded-full ${s.status === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>{s.status}</span>
                <p className="text-sm mt-1">Float: KES {s.openingFloat}{s.closingFloat ? ' / ' + s.closingFloat : ''}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}