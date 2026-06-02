import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

const BASE = 'c:/Users/HomePC/Desktop/RetailPOS/apps/pos/src';
const w = (rel, content) => {
  const p = join(BASE, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content, 'utf8');
  console.log('OK:', rel);
};

const L = '\u003C';
const G = '\u003E';
const Q = '\u0022';
const B = '\u0060';

// ── SalesHistoryPage ──
w('pages/sales/SalesHistoryPage.tsx', `
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

  if (isLoading) return ${L}div className=${Q}p-6${Q}${G}Loading...${L}/div${G};

  const sales = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, limit: 20 };
  const totalPages = Math.ceil(meta.total / meta.limit);

  return (
    ${L}div className=${Q}p-6${Q}${G}
      ${L}h1 className=${Q}text-2xl font-bold mb-6${Q}${G}Sales History${L}/h1${G}
      ${L}div className=${Q}space-y-3${Q}${G}
        {sales.map((sale: any) => (
          ${L}div key={sale.id} className=${Q}p-4 border rounded-lg bg-card${Q}${G}
            ${L}div className=${Q}flex justify-between items-start${Q}${G}
              ${L}div${G}
                ${L}p className=${Q}font-mono font-bold${Q}${G}{sale.receiptNumber}${L}/p${G}
                ${L}p className=${Q}text-sm text-muted-foreground${Q}${G}{sale.cashier?.firstName} {sale.cashier?.lastName}${L}/p${G}
                ${L}p className=${Q}text-xs text-muted-foreground${Q}${G}{new Date(sale.createdAt).toLocaleString()}${L}/p${G}
              ${L}/div${G}
              ${L}div className=${Q}text-right${Q}${G}
                ${L}p className=${Q}text-lg font-bold${Q}${G}KES {sale.totalAmount.toLocaleString()}${L}/p${G}
                ${L}span className={${B}text-xs px-2 py-0.5 rounded-full \${sale.status === 'VOIDED' ? 'bg-destructive/10 text-destructive' : 'bg-green-100 text-green-700'}${B}}${G}{sale.status}${L}/span${G}
              ${L}/div${G}
            ${L}/div${G}
          ${L}/div${G}
        ))}
      ${L}/div${G}
      ${L}div className=${Q}flex justify-center gap-2 mt-6${Q}${G}
        ${L}button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
          className=${Q}px-3 py-1 border rounded-md disabled:opacity-50${Q}${G}Prev${L}/button${G}
        ${L}span className=${Q}px-3 py-1${Q}${G}Page {page} of {totalPages}${L}/span${G}
        ${L}button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
          className=${Q}px-3 py-1 border rounded-md disabled:opacity-50${Q}${G}Next${L}/button${G}
      ${L}/div${G}
    ${L}/div${G}
  );
}
`.trim());

// ── ShiftManagementPage ──
w('pages/shifts/ShiftManagementPage.tsx', `
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
    ${L}div className=${Q}p-6${Q}${G}
      ${L}h1 className=${Q}text-2xl font-bold mb-6${Q}${G}Shift Management${L}/h1${G}
      ${L}div className=${Q}grid gap-6 lg:grid-cols-2${Q}${G}
        ${L}div className=${Q}p-6 border rounded-lg bg-card${Q}${G}
          ${L}h2 className=${Q}text-lg font-semibold mb-4${Q}${G}Open Shift${L}/h2${G}
          ${L}div className=${Q}space-y-3${Q}${G}
            ${L}input type=${Q}text${Q} placeholder=${Q}Terminal ID${Q} value={terminalId} onChange={(e) => setTerminalId(e.target.value)}
              className=${Q}w-full px-3 py-2 border rounded-md bg-background${Q} /${G}
            ${L}input type=${Q}number${Q} placeholder=${Q}Opening float (KES)${Q} value={openingFloat} onChange={(e) => setOpeningFloat(e.target.value)}
              className=${Q}w-full px-3 py-2 border rounded-md bg-background${Q} /${G}
            ${L}button onClick={() => openMutation.mutate()} disabled={openMutation.isPending || !!activeShiftId}
              className=${Q}w-full py-2 bg-primary text-primary-foreground rounded-md font-medium disabled:opacity-50${Q}${G}
              {openMutation.isPending ? 'Opening...' : 'Open Shift'}
            ${L}/button${G}
          ${L}/div${G}
        ${L}/div${G}
        ${L}div className=${Q}p-6 border rounded-lg bg-card${Q}${G}
          ${L}h2 className=${Q}text-lg font-semibold mb-4${Q}${G}Close Shift${L}/h2${G}
          ${L}div className=${Q}space-y-3${Q}${G}
            ${L}input type=${Q}number${Q} placeholder=${Q}Closing float (KES)${Q} value={closingFloat} onChange={(e) => setClosingFloat(e.target.value)}
              className=${Q}w-full px-3 py-2 border rounded-md bg-background${Q} /${G}
            ${L}input type=${Q}text${Q} placeholder=${Q}Notes${Q} value={notes} onChange={(e) => setNotes(e.target.value)}
              className=${Q}w-full px-3 py-2 border rounded-md bg-background${Q} /${G}
            ${L}button onClick={() => activeShiftId && closeMutation.mutate(activeShiftId)} disabled={closeMutation.isPending || !activeShiftId}
              className=${Q}w-full py-2 bg-destructive text-destructive-foreground rounded-md font-medium disabled:opacity-50${Q}${G}
              {closeMutation.isPending ? 'Closing...' : 'Close Shift'}
            ${L}/button${G}
          ${L}/div${G}
        ${L}/div${G}
      ${L}/div${G}
      ${L}div className=${Q}mt-6${Q}${G}
        ${L}h2 className=${Q}text-lg font-semibold mb-3${Q}${G}Recent Shifts${L}/h2${G}
        ${L}div className=${Q}space-y-2${Q}${G}
          {shifts.map((s: any) => (
            ${L}div key={s.id} className=${Q}p-3 border rounded-lg flex justify-between items-center${Q}${G}
              ${L}div${G}
                ${L}p className=${Q}text-sm font-medium${Q}${G}{s.cashier?.firstName} {s.cashier?.lastName}${L}/p${G}
                ${L}p className=${Q}text-xs text-muted-foreground${Q}${G}{new Date(s.openedAt).toLocaleString()}${L}/p${G}
              ${L}/div${G}
              ${L}div className=${Q}text-right${Q}${G}
                ${L}span className={${B}text-xs px-2 py-0.5 rounded-full \${s.status === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}${B}}${G}{s.status}${L}/span${G}
                ${L}p className=${Q}text-sm mt-1${Q}${G}Float: KES {s.openingFloat}{s.closingFloat ? ' / ' + s.closingFloat : ''}${L}/p${G}
              ${L}/div${G}
            ${L}/div${G}
          ))}
        ${L}/div${G}
      ${L}/div${G}
    ${L}/div${G}
  );
}
`.trim());

// ── InventoryPage ──
w('pages/inventory/InventoryPage.tsx', `
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { apiClient } from '../../lib/api';

export function InventoryPage() {
  const [storeId, setStoreId] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['inventory', storeId, page],
    queryFn: () => apiClient.get('/inventory?storeId=' + storeId + '&page=' + page + '&limit=20'),
    enabled: !!storeId
  });

  const { data: lowStock } = useQuery({
    queryKey: ['lowStock', storeId],
    queryFn: () => apiClient.get('/inventory/low-stock?storeId=' + storeId),
    enabled: !!storeId
  });

  const items = data?.data ?? [];
  const lowStockItems = lowStock?.data ?? [];

  return (
    ${L}div className=${Q}p-6${Q}${G}
      ${L}h1 className=${Q}text-2xl font-bold mb-6${Q}${G}Inventory${L}/h1${G}
      ${L}div className=${Q}mb-4${Q}${G}
        ${L}input type=${Q}text${Q} placeholder=${Q}Store ID${Q} value={storeId} onChange={(e) => setStoreId(e.target.value)}
          className=${Q}px-3 py-2 border rounded-md bg-background w-80${Q} /${G}
      ${L}/div${G}
      {lowStockItems.length ${G} 0 && (
        ${L}div className=${Q}mb-6 p-4 border border-destructive/30 bg-destructive/5 rounded-lg${Q}${G}
          ${L}h2 className=${Q}font-semibold text-destructive mb-2${Q}${G}Low Stock Alert ({lowStockItems.length} items)${L}/h2${G}
          ${L}div className=${Q}space-y-1${Q}${G}
            {lowStockItems.map((si: any) => (
              ${L}div key={si.id} className=${Q}flex justify-between text-sm${Q}${G}
                ${L}span${G}{si.product?.name}${L}/span${G}
                ${L}span className=${Q}font-bold text-destructive${Q}${G}{si.quantityOnHand} / {si.reorderPoint}${L}/span${G}
              ${L}/div${G}
            ))}
          ${L}/div${G}
        ${L}/div${G}
      )}
      {isLoading ? ${L}p${G}Loading...${L}/p${G} : (
        ${L}div className=${Q}space-y-2${Q}${G}
          {items.map((si: any) => (
            ${L}div key={si.id} className=${Q}p-3 border rounded-lg flex justify-between items-center${Q}${G}
              ${L}div${G}
                ${L}p className=${Q}font-medium${Q}${G}{si.product?.name}${L}/p${G}
                ${L}p className=${Q}text-xs text-muted-foreground${Q}${G}{si.product?.category?.name}${L}/p${G}
              ${L}/div${G}
              ${L}div className=${Q}text-right${Q}${G}
                ${L}p className={${B}font-bold \${si.quantityOnHand <= si.reorderPoint ? 'text-destructive' : ''}${B}}${G}{si.quantityOnHand}${L}/p${G}
                ${L}p className=${Q}text-xs text-muted-foreground${Q}${G}Reorder: {si.reorderPoint}${L}/p${G}
              ${L}/div${G}
            ${L}/div${G}
          ))}
        ${L}/div${G}
      )}
    ${L}/div${G}
  );
}
`.trim());

console.log('Sales, Shifts, Inventory done. Run scaffold4.mjs next.');
