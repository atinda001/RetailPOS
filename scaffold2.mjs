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

// ── PosLayout ──
w('components/layout/PosLayout.tsx', `
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import { ShoppingCart, History, Clock, Package, Boxes, Users, UserCircle, Truck, Receipt, BarChart3, LogOut, Menu, Store } from 'lucide-react';
import { useState } from 'react';

const cashierLinks = [
  { to: '/pos', icon: ShoppingCart, label: 'POS' },
  { to: '/sales', icon: History, label: 'Sales' },
  { to: '/shifts', icon: Clock, label: 'Shifts' },
  { to: '/inventory', icon: Package, label: 'Inventory' },
];

const adminLinks = [
  { to: '/products', icon: Boxes, label: 'Products' },
  { to: '/users', icon: Users, label: 'Users' },
  { to: '/customers', icon: UserCircle, label: 'Customers' },
  { to: '/suppliers', icon: Truck, label: 'Suppliers' },
  { to: '/purchases', icon: Receipt, label: 'Purchases' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
];

export function PosLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'SUPER_ADMIN';

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ' +
    (isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground');

  const Sidebar = () => (
    ${L}div className=${Q}flex flex-col h-full${Q}${G}
      ${L}div className=${Q}p-4 border-b${Q}${G}
        ${L}div className=${Q}flex items-center gap-2${Q}${G}
          ${L}Store className=${Q}h-6 w-6 text-primary${Q} /${G}
          ${L}span className=${Q}font-bold text-lg${Q}${G}RetailPOS${L}/span${G}
        ${L}/div${G}
        {user && ${L}p className=${Q}text-xs text-muted-foreground mt-1${Q}${G}{user.firstName} {user.lastName} ({user.role})${L}/p${G}}
      ${L}/div${G}
      ${L}nav className=${Q}flex-1 p-2 space-y-1 overflow-y-auto${Q}${G}
        ${L}p className=${Q}px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider${Q}${G}Cashier${L}/p${G}
        {cashierLinks.map((l) => (
          ${L}NavLink key={l.to} to={l.to} className={linkClass} onClick={() => setSidebarOpen(false)}${G}
            ${L}l.icon className=${Q}h-4 w-4${Q} /${G}{l.label}
          ${L}/NavLink${G}
        ))}
        {isAdmin && (
          ${L}${G}
            ${L}p className=${Q}px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-4${Q}${G}Admin${L}/p${G}
            {adminLinks.map((l) => (
              ${L}NavLink key={l.to} to={l.to} className={linkClass} onClick={() => setSidebarOpen(false)}${G}
                ${L}l.icon className=${Q}h-4 w-4${Q} /${G}{l.label}
              ${L}/NavLink${G}
            ))}
          ${L}/${G}
        )}
      ${L}/nav${G}
      ${L}div className=${Q}p-2 border-t${Q}${G}
        ${L}button onClick={handleLogout} className=${Q}flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors${Q}${G}
          ${L}LogOut className=${Q}h-4 w-4${Q} /${G}Logout
        ${L}/button${G}
      ${L}/div${G}
    ${L}/div${G}
  );

  return (
    ${L}div className=${Q}flex h-screen overflow-hidden bg-background${Q}${G}
      {sidebarOpen && ${L}div className=${Q}fixed inset-0 z-40 bg-black/50 lg:hidden${Q} onClick={() => setSidebarOpen(false)} /${G}}
      ${L}aside className={${B}fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform duration-200 lg:relative lg:translate-x-0 \${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}${B}}${G}
        ${L}Sidebar /${G}
      ${L}/aside${G}
      ${L}main className=${Q}flex-1 flex flex-col min-w-0 overflow-hidden${Q}${G}
        ${L}header className=${Q}flex items-center justify-between h-14 px-4 border-b bg-card shrink-0${Q}${G}
          ${L}button onClick={() => setSidebarOpen(true)} className=${Q}lg:hidden p-2 -ml-2 rounded-md hover:bg-accent${Q}${G}
            ${L}Menu className=${Q}h-5 w-5${Q} /${G}
          ${L}/button${G}
          ${L}div className=${Q}flex-1${Q} /${G}
          ${L}span className=${Q}text-sm text-muted-foreground${Q}${G}{user?.firstName} {user?.lastName}${L}/span${G}
        ${L}/header${G}
        ${L}div className=${Q}flex-1 overflow-auto${Q}${G}
          ${L}Outlet /${G}
        ${L}/div${G}
      ${L}/main${G}
    ${L}/div${G}
  );
}
`.trim());

// ── PosTerminalPage ──
w('pages/pos/PosTerminalPage.tsx', `
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Trash2, CreditCard, Banknote, Smartphone, Ticket, Minus, Plus } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { useCartStore } from '../../stores/cart.store';
import { useAuthStore } from '../../stores/auth.store';
import { db } from '../../lib/db';

interface Product { id: string; name: string; barcode: string | null; priceAmount: number; imageUrl: string | null; }

export function PosTerminalPage() {
  const [search, setSearch] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [cashAmount, setCashAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [processing, setProcessing] = useState(false);
  const [saleResult, setSaleResult] = useState(null);

  const cart = useCartStore();
  const user = useAuthStore((s) => s.user);
  const shiftId = localStorage.getItem('shiftId') ?? '';
  const terminalId = localStorage.getItem('terminalId') ?? '';

  const { data: productsData } = useQuery({
    queryKey: ['products', search],
    queryFn: () => apiClient.get('/products?search=' + encodeURIComponent(search) + '&limit=50'),
    enabled: search.length > 0
  });

  const handleBarcode = useCallback(async (barcode: string) => {
    if (!barcode) return; setBarcodeInput('');
    try {
      const res = await apiClient.get('/products/barcode/' + barcode);
      cart.addItem({ productId: res.data.id, productName: res.data.name, barcode: res.data.barcode, unitPriceAmount: res.data.priceAmount });
    } catch { alert('Product not found'); }
  }, [cart]);

  const addProduct = (p: Product) => { cart.addItem({ productId: p.id, productName: p.name, barcode: p.barcode, unitPriceAmount: p.priceAmount }); setSearch(''); };

  const handleCheckout = async () => {
    if (!shiftId) { alert('No open shift.'); return; }
    setProcessing(true);
    try {
      const total = cart.getTotal();
      const payload = {
        terminalId, shiftId,
        lineItems: cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity, unitPriceAmount: i.unitPriceAmount, discountAmount: i.discountAmount })),
        payments: [{ method: paymentMethod, amount: total }],
        discountAmount: cart.discountAmount, customerId: cart.customerId
      };
      const res = await apiClient.post('/sales', payload);
      setSaleResult({ receiptNumber: res.data.receiptNumber, total, change: paymentMethod === 'CASH' ? parseInt(cashAmount || '0', 10) - total : 0 });
      cart.clearCart();
    } catch {
      await db.offlineSales.add({
        offlineId: crypto.randomUUID(), tenantId: user?.tenantId ?? '', storeId: '', terminalId,
        shiftId, cashierId: user?.id ?? '', customerId: cart.customerId,
        lineItems: cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity, unitPriceAmount: i.unitPriceAmount, discountAmount: i.discountAmount })),
        payments: [{ method: paymentMethod, amount: cart.getTotal(), reference: null }],
        discountAmount: cart.discountAmount, notes: null, createdAt: new Date().toISOString(), synced: false
      });
      alert('Saved offline.');
      cart.clearCart();
    } finally { setProcessing(false); setShowCheckout(false); setCashAmount(''); }
  };

  if (saleResult) {
    return (
      ${L}div className=${Q}p-6 max-w-lg mx-auto text-center space-y-4${Q}${G}
        ${L}div className=${Q}text-5xl${Q}${G}✅${L}/div${G}
        ${L}h2 className=${Q}text-2xl font-bold${Q}${G}Sale Complete${L}/h2${G}
        ${L}p className=${Q}text-lg${Q}${G}Receipt: ${L}span className=${Q}font-mono font-bold${Q}${G}{saleResult.receiptNumber}${L}/span${G}${L}/p${G}
        ${L}p className=${Q}text-3xl font-bold${Q}${G}KES {saleResult.total.toLocaleString()}${L}/p${G}
        {saleResult.change ${G} 0 && ${L}p className=${Q}text-lg text-muted-foreground${Q}${G}Change: KES {saleResult.change.toLocaleString()}${L}/p${G}}
        ${L}button onClick={() => setSaleResult(null)} className=${Q}px-6 py-2 bg-primary text-primary-foreground rounded-md font-medium${Q}${G}New Sale${L}/button${G}
      ${L}/div${G}
    );
  }

  return (
    ${L}div className=${Q}flex h-full${Q}${G}
      ${L}div className=${Q}flex-1 flex flex-col min-w-0 border-r${Q}${G}
        ${L}div className=${Q}p-4 border-b space-y-3${Q}${G}
          ${L}div className=${Q}relative${Q}${G}
            ${L}Search className=${Q}absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground${Q} /${G}
            ${L}input type=${Q}text${Q} placeholder=${Q}Search products...${Q} value={search} onChange={(e) => setSearch(e.target.value)}
              className=${Q}w-full pl-9 pr-3 py-2 border rounded-md bg-background${Q} autoFocus /${G}
          ${L}/div${G}
          ${L}form onSubmit={(e) => { e.preventDefault(); handleBarcode(barcodeInput); }}${G}
            ${L}input type=${Q}text${Q} placeholder=${Q}Scan barcode...${Q} value={barcodeInput} onChange={(e) => setBarcodeInput(e.target.value)}
              className=${Q}w-full px-3 py-2 border rounded-md bg-background font-mono${Q} /${G}
          ${L}/form${G}
        ${L}/div${G}
        ${L}div className=${Q}flex-1 overflow-auto p-4${Q}${G}
          {search && productsData?.data ? (
            ${L}div className=${Q}grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3${Q}${G}
              {productsData.data.map((p) => (
                ${L}button key={p.id} onClick={() => addProduct(p)}
                  className=${Q}p-3 border rounded-lg hover:border-primary hover:bg-accent transition-colors text-left${Q}${G}
                  ${L}div className=${Q}font-medium text-sm truncate${Q}${G}{p.name}${L}/div${G}
                  ${L}div className=${Q}text-sm font-bold text-primary mt-1${Q}${G}KES {p.priceAmount.toLocaleString()}${L}/div${G}
                ${L}/button${G}
              ))}
            ${L}/div${G}
          ) : (
            ${L}div className=${Q}flex items-center justify-center h-full text-muted-foreground${Q}${G}
              Search for products or scan a barcode
            ${L}/div${G}
          )}
        ${L}/div${G}
      ${L}/div${G}
      ${L}div className=${Q}w-96 flex flex-col bg-card${Q}${G}
        ${L}div className=${Q}p-4 border-b font-semibold${Q}${G}Cart ({cart.getItemCount()} items)${L}/div${G}
        ${L}div className=${Q}flex-1 overflow-auto p-4 space-y-2${Q}${G}
          {cart.items.length === 0 ? (
            ${L}p className=${Q}text-center text-muted-foreground py-8${Q}${G}Cart is empty${L}/p${G}
          ) : (
            cart.items.map((item) => (
              ${L}div key={item.productId} className=${Q}flex items-center justify-between py-2 border-b${Q}${G}
                ${L}div className=${Q}flex-1 min-w-0${Q}${G}
                  ${L}p className=${Q}text-sm font-medium truncate${Q}${G}{item.productName}${L}/p${G}
                  ${L}div className=${Q}flex items-center gap-2 mt-1${Q}${G}
                    ${L}button onClick={() => cart.updateQuantity(item.productId, item.quantity - 1)} className=${Q}p-0.5 rounded hover:bg-accent${Q}${G}${L}Minus className=${Q}h-3 w-3${Q} /${G}${L}/button${G}
                    ${L}span className=${Q}text-sm w-6 text-center${Q}${G}{item.quantity}${L}/span${G}
                    ${L}button onClick={() => cart.updateQuantity(item.productId, item.quantity + 1)} className=${Q}p-0.5 rounded hover:bg-accent${Q}${G}${L}Plus className=${Q}h-3 w-3${Q} /${G}${L}/button${G}
                  ${L}/div${G}
                ${L}/div${G}
                ${L}div className=${Q}text-right${Q}${G}
                  ${L}p className=${Q}text-sm font-bold${Q}${G}KES {(item.unitPriceAmount * item.quantity).toLocaleString()}${L}/p${G}
                  ${L}button onClick={() => cart.removeItem(item.productId)} className=${Q}text-destructive hover:bg-destructive/10 p-1 rounded${Q}${G}${L}Trash2 className=${Q}h-3 w-3${Q} /${G}${L}/button${G}
                ${L}/div${G}
              ${L}/div${G}
            ))
          )}
        ${L}/div${G}
        ${L}div className=${Q}p-4 border-t space-y-3${Q}${G}
          ${L}div className=${Q}flex justify-between text-sm${Q}${G}${L}span${G}Subtotal${L}/span${G}${L}span className=${Q}font-bold${Q}${G}KES {cart.getSubtotal().toLocaleString()}${L}/span${G}${L}/div${G}
          ${L}div className=${Q}flex justify-between text-lg font-bold${Q}${G}${L}span${G}Total${L}/span${G}${L}span${G}KES {cart.getTotal().toLocaleString()}${L}/span${G}${L}/div${G}
          {!showCheckout ? (
            ${L}button onClick={() => setShowCheckout(true)} disabled={cart.items.length === 0}
              className=${Q}w-full py-2.5 bg-primary text-primary-foreground rounded-md font-medium disabled:opacity-50${Q}${G}
              Checkout
            ${L}/button${G}
          ) : (
            ${L}div className=${Q}space-y-2${Q}${G}
              ${L}div className=${Q}flex gap-2${Q}${G}
                {['CASH','CARD','MPESA'].map((m) => (
                  ${L}button key={m} onClick={() => setPaymentMethod(m)}
                    className={${B}flex-1 py-1.5 text-xs rounded-md border \${paymentMethod === m ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent'}${B}}${G}{m}${L}/button${G}
                ))}
              ${L}/div${G}
              {paymentMethod === 'CASH' && ${L}input type=${Q}number${Q} placeholder=${Q}Cash amount${Q} value={cashAmount} onChange={(e) => setCashAmount(e.target.value)}
                className=${Q}w-full px-3 py-2 border rounded-md bg-background${Q} /${G}}
              ${L}button onClick={handleCheckout} disabled={processing}
                className=${Q}w-full py-2.5 bg-green-600 text-white rounded-md font-medium disabled:opacity-50${Q}${G}
                {processing ? 'Processing...' : 'Complete Sale'}
              ${L}/button${G}
            ${L}/div${G}
          )}
        ${L}/div${G}
      ${L}/div${G}
    ${L}/div${G}
  );
}
`.trim());

console.log('Layout and POS terminal done. Run scaffold3.mjs next.');
