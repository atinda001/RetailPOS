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

// ── ProductsPage ──
w('pages/admin/ProductsPage.tsx', `
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
    ${L}div className=${Q}p-6${Q}${G}
      ${L}div className=${Q}flex justify-between items-center mb-6${Q}${G}
        ${L}h1 className=${Q}text-2xl font-bold${Q}${G}Products${L}/h1${G}
        ${L}button onClick={openNew} className=${Q}flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md${Q}${G}
          ${L}Plus className=${Q}h-4 w-4${Q} /${G}Add Product
        ${L}/button${G}
      ${L}/div${G}
      {showForm && (
        ${L}div className=${Q}mb-6 p-4 border rounded-lg bg-card space-y-3${Q}${G}
          ${L}h3 className=${Q}font-semibold${Q}${G}{editing ? 'Edit Product' : 'New Product'}${L}/h3${G}
          ${L}input type=${Q}text${Q} placeholder=${Q}Name${Q} value={name} onChange={(e) => setName(e.target.value)}
            className=${Q}w-full px-3 py-2 border rounded-md bg-background${Q} /${G}
          ${L}input type=${Q}number${Q} placeholder=${Q}Price (KES)${Q} value={price} onChange={(e) => setPrice(e.target.value)}
            className=${Q}w-full px-3 py-2 border rounded-md bg-background${Q} /${G}
          ${L}input type=${Q}number${Q} placeholder=${Q}Cost (KES)${Q} value={cost} onChange={(e) => setCost(e.target.value)}
            className=${Q}w-full px-3 py-2 border rounded-md bg-background${Q} /${G}
          ${L}input type=${Q}text${Q} placeholder=${Q}Barcode (optional)${Q} value={barcode} onChange={(e) => setBarcode(e.target.value)}
            className=${Q}w-full px-3 py-2 border rounded-md bg-background${Q} /${G}
          ${L}div className=${Q}flex gap-2${Q}${G}
            ${L}button onClick={handleSave} disabled={saveMutation.isPending}
              className=${Q}px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50${Q}${G}Save${L}/button${G}
            ${L}button onClick={() => setShowForm(false)} className=${Q}px-4 py-2 border rounded-md${Q}${G}Cancel${L}/button${G}
          ${L}/div${G}
        ${L}/div${G}
      )}
      ${L}div className=${Q}space-y-2${Q}${G}
        {products.map((p: any) => (
          ${L}div key={p.id} className=${Q}p-3 border rounded-lg flex justify-between items-center${Q}${G}
            ${L}div${G}
              ${L}p className=${Q}font-medium${Q}${G}{p.name}${L}/p${G}
              ${L}p className=${Q}text-sm text-muted-foreground${Q}${G}KES {p.priceAmount} | Barcode: {p.barcode ?? 'N/A'}${L}/p${G}
            ${L}/div${G}
            ${L}div className=${Q}flex gap-1${Q}${G}
              ${L}button onClick={() => openEdit(p)} className=${Q}p-2 rounded hover:bg-accent${Q}${G}${L}Pencil className=${Q}h-4 w-4${Q} /${G}${L}/button${G}
              ${L}button onClick={() => deleteMutation.mutate(p.id)} className=${Q}p-2 rounded hover:bg-destructive/10 text-destructive${Q}${G}${L}Trash2 className=${Q}h-4 w-4${Q} /${G}${L}/button${G}
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

// ── UsersPage ──
w('pages/admin/UsersPage.tsx', `
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
    ${L}div className=${Q}p-6${Q}${G}
      ${L}div className=${Q}flex justify-between items-center mb-6${Q}${G}
        ${L}h1 className=${Q}text-2xl font-bold${Q}${G}Users${L}/h1${G}
        ${L}button onClick={() => setShowForm(true)} className=${Q}flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md${Q}${G}
          ${L}Plus className=${Q}h-4 w-4${Q} /${G}Add User
        ${L}/button${G}
      ${L}/div${G}
      {showForm && (
        ${L}div className=${Q}mb-6 p-4 border rounded-lg bg-card space-y-3${Q}${G}
          ${L}h3 className=${Q}font-semibold${Q}${G}New User${L}/h3${G}
          ${L}input type=${Q}email${Q} placeholder=${Q}Email${Q} value={email} onChange={(e) => setEmail(e.target.value)}
            className=${Q}w-full px-3 py-2 border rounded-md bg-background${Q} /${G}
          ${L}input type=${Q}password${Q} placeholder=${Q}Password${Q} value={password} onChange={(e) => setPassword(e.target.value)}
            className=${Q}w-full px-3 py-2 border rounded-md bg-background${Q} /${G}
          ${L}input type=${Q}text${Q} placeholder=${Q}First Name${Q} value={firstName} onChange={(e) => setFirstName(e.target.value)}
            className=${Q}w-full px-3 py-2 border rounded-md bg-background${Q} /${G}
          ${L}input type=${Q}text${Q} placeholder=${Q}Last Name${Q} value={lastName} onChange={(e) => setLastName(e.target.value)}
            className=${Q}w-full px-3 py-2 border rounded-md bg-background${Q} /${G}
          ${L}select value={role} onChange={(e) => setRole(e.target.value)}
            className=${Q}w-full px-3 py-2 border rounded-md bg-background${Q}${G}
            ${L}option value=${Q}CASHIER${Q}${G}Cashier${L}/option${G}
            ${L}option value=${Q}MANAGER${Q}${G}Manager${L}/option${G}
            ${L}option value=${Q}ADMIN${Q}${G}Admin${L}/option${G}
          ${L}/select${G}
          ${L}div className=${Q}flex gap-2${Q}${G}
            ${L}button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}
              className=${Q}px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50${Q}${G}Create${L}/button${G}
            ${L}button onClick={() => setShowForm(false)} className=${Q}px-4 py-2 border rounded-md${Q}${G}Cancel${L}/button${G}
          ${L}/div${G}
        ${L}/div${G}
      )}
      ${L}div className=${Q}space-y-2${Q}${G}
        {users.map((u: any) => (
          ${L}div key={u.id} className=${Q}p-3 border rounded-lg flex justify-between items-center${Q}${G}
            ${L}div${G}
              ${L}p className=${Q}font-medium${Q}${G}{u.firstName} {u.lastName}${L}/p${G}
              ${L}p className=${Q}text-sm text-muted-foreground${Q}${G}{u.email} | {u.role}${L}/p${G}
            ${L}/div${G}
            ${L}button onClick={() => toggleMutation.mutate({ id: u.id, isActive: u.isActive })}
              className={${B}p-2 rounded \${u.isActive ? 'text-green-600 hover:bg-green-50' : 'text-destructive hover:bg-destructive/10'}${B}}${G}
              {u.isActive ? ${L}UserCheck className=${Q}h-4 w-4${Q} /${G} : ${L}UserX className=${Q}h-4 w-4${Q} /${G}}
            ${L}/button${G}
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

// ── CustomersPage ──
w('pages/admin/CustomersPage.tsx', `
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
    ${L}div className=${Q}p-6${Q}${G}
      ${L}h1 className=${Q}text-2xl font-bold mb-6${Q}${G}Customers${L}/h1${G}
      ${L}div className=${Q}relative mb-4 w-80${Q}${G}
        ${L}Search className=${Q}absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground${Q} /${G}
        ${L}input type=${Q}text${Q} placeholder=${Q}Search customers...${Q} value={search} onChange={(e) => setSearch(e.target.value)}
          className=${Q}w-full pl-9 pr-3 py-2 border rounded-md bg-background${Q} /${G}
      ${L}/div${G}
      ${L}div className=${Q}space-y-2${Q}${G}
        {customers.map((c: any) => (
          ${L}div key={c.id} className=${Q}p-3 border rounded-lg${Q}${G}
            ${L}p className=${Q}font-medium${Q}${G}{c.firstName} {c.lastName ?? ''}${L}/p${G}
            ${L}p className=${Q}text-sm text-muted-foreground${Q}${G}{c.phone ?? 'No phone'} | {c.email ?? 'No email'}${L}/p${G}
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

// ── SuppliersPage ──
w('pages/admin/SuppliersPage.tsx', `
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
    ${L}div className=${Q}p-6${Q}${G}
      ${L}div className=${Q}flex justify-between items-center mb-6${Q}${G}
        ${L}h1 className=${Q}text-2xl font-bold${Q}${G}Suppliers${L}/h1${G}
        ${L}button onClick={() => setShowForm(true)} className=${Q}flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md${Q}${G}
          ${L}Plus className=${Q}h-4 w-4${Q} /${G}Add Supplier
        ${L}/button${G}
      ${L}/div${G}
      {showForm && (
        ${L}div className=${Q}mb-6 p-4 border rounded-lg bg-card space-y-3${Q}${G}
          ${L}h3 className=${Q}font-semibold${Q}${G}New Supplier${L}/h3${G}
          ${L}input type=${Q}text${Q} placeholder=${Q}Name${Q} value={name} onChange={(e) => setName(e.target.value)}
            className=${Q}w-full px-3 py-2 border rounded-md bg-background${Q} /${G}
          ${L}input type=${Q}text${Q} placeholder=${Q}Phone${Q} value={phone} onChange={(e) => setPhone(e.target.value)}
            className=${Q}w-full px-3 py-2 border rounded-md bg-background${Q} /${G}
          ${L}input type=${Q}email${Q} placeholder=${Q}Email${Q} value={email} onChange={(e) => setEmail(e.target.value)}
            className=${Q}w-full px-3 py-2 border rounded-md bg-background${Q} /${G}
          ${L}div className=${Q}flex gap-2${Q}${G}
            ${L}button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}
              className=${Q}px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50${Q}${G}Create${L}/button${G}
            ${L}button onClick={() => setShowForm(false)} className=${Q}px-4 py-2 border rounded-md${Q}${G}Cancel${L}/button${G}
          ${L}/div${G}
        ${L}/div${G}
      )}
      ${L}div className=${Q}space-y-2${Q}${G}
        {suppliers.map((s: any) => (
          ${L}div key={s.id} className=${Q}p-3 border rounded-lg${Q}${G}
            ${L}p className=${Q}font-medium${Q}${G}{s.name}${L}/p${G}
            ${L}p className=${Q}text-sm text-muted-foreground${Q}${G}{s.phone ?? 'No phone'} | {s.email ?? 'No email'}${L}/p${G}
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

// ── PurchasesPage ──
w('pages/admin/PurchasesPage.tsx', `
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
    ${L}div className=${Q}p-6${Q}${G}
      ${L}div className=${Q}flex justify-between items-center mb-6${Q}${G}
        ${L}h1 className=${Q}text-2xl font-bold${Q}${G}Purchases${L}/h1${G}
        ${L}button onClick={() => setShowForm(true)} className=${Q}flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md${Q}${G}
          ${L}Plus className=${Q}h-4 w-4${Q} /${G}New Purchase
        ${L}/button${G}
      ${L}/div${G}
      {showForm && (
        ${L}div className=${Q}mb-6 p-4 border rounded-lg bg-card space-y-3${Q}${G}
          ${L}h3 className=${Q}font-semibold${Q}${G}New Purchase Order${L}/h3${G}
          ${L}input type=${Q}text${Q} placeholder=${Q}Store ID${Q} value={storeId} onChange={(e) => setStoreId(e.target.value)}
            className=${Q}w-full px-3 py-2 border rounded-md bg-background${Q} /${G}
          ${L}input type=${Q}text${Q} placeholder=${Q}Supplier ID (optional)${Q} value={supplierId} onChange={(e) => setSupplierId(e.target.value)}
            className=${Q}w-full px-3 py-2 border rounded-md bg-background${Q} /${G}
          ${L}div className=${Q}flex gap-2${Q}${G}
            ${L}input type=${Q}text${Q} placeholder=${Q}Product ID${Q} value={productId} onChange={(e) => setProductId(e.target.value)}
              className=${Q}flex-1 px-3 py-2 border rounded-md bg-background${Q} /${G}
            ${L}input type=${Q}number${Q} placeholder=${Q}Qty${Q} value={quantity} onChange={(e) => setQuantity(e.target.value)}
              className=${Q}w-20 px-3 py-2 border rounded-md bg-background${Q} /${G}
            ${L}input type=${Q}number${Q} placeholder=${Q}Unit cost${Q} value={unitCost} onChange={(e) => setUnitCost(e.target.value)}
              className=${Q}w-32 px-3 py-2 border rounded-md bg-background${Q} /${G}
            ${L}button onClick={addLineItem} className=${Q}px-3 py-2 border rounded-md hover:bg-accent${Q}${G}Add${L}/button${G}
          ${L}/div${G}
          {lineItems.length ${G} 0 && (
            ${L}div className=${Q}space-y-1${Q}${G}
              {lineItems.map((li, i) => (
                ${L}div key={i} className=${Q}text-sm flex justify-between${Q}${G}
                  ${L}span${G}{li.productId} x{li.quantity}${L}/span${G}
                  ${L}span${G}KES {li.unitCostAmount}${L}/span${G}
                ${L}/div${G}
              ))}
            ${L}/div${G}
          )}
          ${L}div className=${Q}flex gap-2${Q}${G}
            ${L}button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || lineItems.length === 0}
              className=${Q}px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50${Q}${G}Create${L}/button${G}
            ${L}button onClick={() => setShowForm(false)} className=${Q}px-4 py-2 border rounded-md${Q}${G}Cancel${L}/button${G}
          ${L}/div${G}
        ${L}/div${G}
      )}
      ${L}div className=${Q}space-y-2${Q}${G}
        {purchases.map((p: any) => (
          ${L}div key={p.id} className=${Q}p-3 border rounded-lg flex justify-between items-center${Q}${G}
            ${L}div${G}
              ${L}p className=${Q}font-medium${Q}${G}PO-{p.id.slice(0,8)}${L}/p${G}
              ${L}p className=${Q}text-sm text-muted-foreground${Q}${G}KES {p.totalAmount} | {p.status}${L}/p${G}
            ${L}/div${G}
            {p.status !== 'RECEIVED' && (
              ${L}button onClick={() => receiveMutation.mutate(p.id)} disabled={receiveMutation.isPending}
                className=${Q}flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-md text-sm disabled:opacity-50${Q}${G}
                ${L}CheckCircle className=${Q}h-3 w-3${Q} /${G}Receive
              ${L}/button${G}
            )}
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

// ── ReportsPage ──
w('pages/admin/ReportsPage.tsx', `
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { apiClient } from '../../lib/api';

export function ReportsPage() {
  const [storeId, setStoreId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const { data: salesSummary, isLoading: loadingSales } = useQuery({
    queryKey: ['report-sales', storeId, from, to],
    queryFn: () => apiClient.get('/reports/sales-summary?storeId=' + storeId + '&from=' + from + '&to=' + to)
  });

  const { data: endOfDay } = useQuery({
    queryKey: ['report-eod', storeId],
    queryFn: () => apiClient.get('/reports/end-of-day?storeId=' + storeId),
    enabled: !!storeId
  });

  const summary = salesSummary?.data ?? {};
  const eod = endOfDay?.data ?? {};

  return (
    ${L}div className=${Q}p-6${Q}${G}
      ${L}h1 className=${Q}text-2xl font-bold mb-6${Q}${G}Reports${L}/h1${G}
      ${L}div className=${Q}flex gap-3 mb-6 flex-wrap${Q}${G}
        ${L}input type=${Q}text${Q} placeholder=${Q}Store ID${Q} value={storeId} onChange={(e) => setStoreId(e.target.value)}
          className=${Q}px-3 py-2 border rounded-md bg-background${Q} /${G}
        ${L}input type=${Q}date${Q} value={from} onChange={(e) => setFrom(e.target.value)}
          className=${Q}px-3 py-2 border rounded-md bg-background${Q} /${G}
        ${L}input type=${Q}date${Q} value={to} onChange={(e) => setTo(e.target.value)}
          className=${Q}px-3 py-2 border rounded-md bg-background${Q} /${G}
      ${L}/div${G}
      ${L}div className=${Q}grid gap-6 lg:grid-cols-2${Q}${G}
        ${L}div className=${Q}p-6 border rounded-lg bg-card${Q}${G}
          ${L}h2 className=${Q}text-lg font-semibold mb-4${Q}${G}Sales Summary${L}/h2${G}
          {loadingSales ? ${L}p${G}Loading...${L}/p${G} : (
            ${L}div className=${Q}space-y-3${Q}${G}
              ${L}div className=${Q}flex justify-between${Q}${G}${L}span${G}Total Sales${L}/span${G}${L}span className=${Q}font-bold${Q}${G}{summary.totalSales ?? 0}${L}/span${G}${L}/div${G}
              ${L}div className=${Q}flex justify-between${Q}${G}${L}span${G}Total Revenue${L}/span${G}${L}span className=${Q}font-bold text-lg${Q}${G}KES {(summary.totalRevenue ?? 0).toLocaleString()}${L}/span${G}${L}/div${G}
              ${L}div className=${Q}flex justify-between${Q}${G}${L}span${G}Total Tax${L}/span${G}${L}span${G}KES {(summary.totalTax ?? 0).toLocaleString()}${L}/span${G}${L}/div${G}
              ${L}div className=${Q}flex justify-between${Q}${G}${L}span${G}Total Discount${L}/span${G}${L}span${G}KES {(summary.totalDiscount ?? 0).toLocaleString()}${L}/span${G}${L}/div${G}
              ${L}div className=${Q}flex justify-between${Q}${G}${L}span${G}Avg Order Value${L}/span${G}${L}span className=${Q}font-bold${Q}${G}KES {(summary.averageOrderValue ?? 0).toLocaleString()}${L}/span${G}${L}/div${G}
            ${L}/div${G}
          )}
        ${L}/div${G}
        ${L}div className=${Q}p-6 border rounded-lg bg-card${Q}${G}
          ${L}h2 className=${Q}text-lg font-semibold mb-4${Q}${G}End of Day${L}/h2${G}
          ${L}div className=${Q}space-y-3${Q}${G}
            ${L}div className=${Q}flex justify-between${Q}${G}${L}span${G}Date${L}/span${G}${L}span${G}{eod.date ?? 'N/A'}${L}/span${G}${L}/div${G}
            ${L}div className=${Q}flex justify-between${Q}${G}${L}span${G}Total Revenue${L}/span${G}${L}span className=${Q}font-bold${Q}${G}KES {(eod.totalRevenue ?? 0).toLocaleString()}${L}/span${G}${L}/div${G}
            ${L}div className=${Q}flex justify-between${Q}${G}${L}span${G}Total Sales${L}/span${G}${L}span${G}{eod.totalSales ?? 0}${L}/span${G}${L}/div${G}
            ${L}div className=${Q}flex justify-between${Q}${G}${L}span${G}Total Voids${L}/span${G}${L}span className=${Q}text-destructive${Q}${G}{eod.totalVoids ?? 0}${L}/span${G}${L}/div${G}
          ${L}/div${G}
        ${L}/div${G}
      ${L}/div${G}
    ${L}/div${G}
  );
}
`.trim());

console.log('All admin pages done!');
console.log('');
console.log('All scaffold scripts complete. Run them in order:');
console.log('  node scaffold1.mjs');
console.log('  node scaffold2.mjs');
console.log('  node scaffold3.mjs');
console.log('  node scaffold4.mjs');
