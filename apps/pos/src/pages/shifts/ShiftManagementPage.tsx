import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, DollarSign, ShoppingCart, TrendingUp, AlertCircle } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { useAuthStore } from '../../stores/auth.store';

const formatKES = (cents: number) =>
  `KES ${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

export function ShiftManagementPage() {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const terminalId = user?.terminalId ?? '';
  const storeId = user?.storeId ?? '';

  const [openingFloat, setOpeningFloat] = useState('');
  const [closingFloat, setClosingFloat] = useState('');
  const [notes, setNotes] = useState('');

  const { data: activeShiftData } = useQuery({
    queryKey: ['active-shift'],
    queryFn: () => apiClient.get('/shifts?storeId=' + storeId + '&status=OPEN&limit=1'),
    enabled: !!storeId,
    refetchInterval: 30000,
  });

  const { data: shiftsData, isLoading } = useQuery({
    queryKey: ['shifts', storeId],
    queryFn: () => apiClient.get('/shifts?storeId=' + storeId + '&limit=20'),
    enabled: !!storeId,
  });

  const openMutation = useMutation({
    mutationFn: () =>
      apiClient.post('/shifts/open', {
        terminalId,
        openingFloat: parseInt(openingFloat || '0', 10),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shifts'] });
      qc.invalidateQueries({ queryKey: ['active-shift'] });
    },
  });

  const closeMutation = useMutation({
    mutationFn: (shiftId: string) =>
      apiClient.post('/shifts/' + shiftId + '/close', {
        closingFloat: parseInt(closingFloat || '0', 10),
        notes: notes || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shifts'] });
      qc.invalidateQueries({ queryKey: ['active-shift'] });
      setClosingFloat('');
      setNotes('');
    },
  });

  const shifts = (shiftsData as any)?.data ?? [];
  const activeShift = (activeShiftData as any)?.data?.[0] ?? null;

  const computeShiftSummary = (shift: any) => {
    const sales = shift.sales ?? [];
    const totalRevenue = sales.reduce((sum: number, s: any) => sum + s.totalAmount, 0);
    const cashSales = sales
      .filter((s: any) => s.payments?.some((p: any) => p.method === 'CASH'))
      .reduce((sum: number, s: any) => sum + s.totalAmount, 0);
    const expectedCash = (shift.openingFloat ?? 0) + cashSales;
    return { totalRevenue, cashSales, expectedCash, salesCount: sales.length };
  };

  if (!terminalId) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-yellow-900">No Terminal Detected</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Please log in via PIN login on a registered terminal to use shift management.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const summary = activeShift ? computeShiftSummary(activeShift) : null;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Clock className="h-6 w-6" />
          Shift Management
        </h1>
        {activeShift && (
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            Shift Open
          </span>
        )}
      </div>

      {activeShift && summary && (
        <div className="bg-white rounded-lg border shadow-sm p-6 space-y-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Current Shift Summary
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <ShoppingCart className="h-4 w-4" />
                <span className="text-sm font-medium">Sales</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">{summary.salesCount}</p>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-600 mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm font-medium">Revenue</span>
              </div>
              <p className="text-2xl font-bold text-green-900">{formatKES(summary.totalRevenue)}</p>
            </div>

            <div className="bg-amber-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-amber-600 mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm font-medium">Cash Sales</span>
              </div>
              <p className="text-2xl font-bold text-amber-900">{formatKES(summary.cashSales)}</p>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-purple-600 mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm font-medium">Expected Cash</span>
              </div>
              <p className="text-2xl font-bold text-purple-900">{formatKES(summary.expectedCash)}</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium mb-3">Close Shift</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Closing Float (KES)</label>
                <input
                  type="number"
                  value={closingFloat}
                  onChange={(e) => setClosingFloat(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes..."
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>
            <button
              onClick={() => closeMutation.mutate(activeShift.id)}
              disabled={closeMutation.isPending}
              className="mt-4 w-full py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 disabled:opacity-50"
            >
              {closeMutation.isPending ? 'Closing...' : 'Close Shift'}
            </button>
          </div>
        </div>
      )}

      {!activeShift && (
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Open New Shift</h2>
          <div className="max-w-sm">
            <label className="block text-sm font-medium mb-1">Opening Float (KES)</label>
            <input
              type="number"
              value={openingFloat}
              onChange={(e) => setOpeningFloat(e.target.value)}
              placeholder="e.g. 1000"
              className="w-full px-3 py-2 border rounded-md mb-4"
            />
            <button
              onClick={() => openMutation.mutate()}
              disabled={openMutation.isPending || !terminalId}
              className="w-full py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {openMutation.isPending ? 'Opening...' : 'Open Shift'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Shifts</h2>
        {shifts.length === 0 ? (
          <p className="text-muted-foreground">No shifts found.</p>
        ) : (
          <div className="space-y-2">
            {shifts.map((shift: any) => (
              <div
                key={shift.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
              >
                <div>
                  <p className="font-medium">
                    {new Date(shift.openedAt).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Status: {shift.status} | Float: {formatKES(shift.openingFloat)}
                  </p>
                </div>
                {shift.status === 'OPEN' && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                    Active
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
