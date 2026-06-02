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
    if (!shiftId) { alert('No open shift. Open a shift first.'); return; }
    setProcessing(true);
    try {
      const total = cart.getTotal();
      const tendered = paymentMethod === 'CASH' ? parseInt(cashAmount || '0', 10) : total;
      if (tendered < total) { alert('Insufficient payment.'); setProcessing(false); return; }
      const payload = {
        terminalId, shiftId,
        lineItems: cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity, unitPriceAmount: i.unitPriceAmount, discountAmount: i.discountAmount })),
        payments: [{ method: paymentMethod, amount: tendered }],
        discountAmount: cart.discountAmount, customerId: cart.customerId
      };
      const res = await apiClient.post('/sales', payload);
      setSaleResult({ receiptNumber: res.data.receiptNumber, total, change: res.data.changeAmount ?? (tendered - total) });
      cart.clearCart();
    } catch (err: any) {
      alert(err.message || 'Checkout failed. Saved offline.');
      await db.offlineSales.add({
        offlineId: crypto.randomUUID(), tenantId: user?.tenantId ?? '', storeId: '', terminalId,
        shiftId, cashierId: user?.id ?? '', customerId: cart.customerId,
        lineItems: cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity, unitPriceAmount: i.unitPriceAmount, discountAmount: i.discountAmount })),
        payments: [{ method: paymentMethod, amount: cart.getTotal(), reference: null }],
        discountAmount: cart.discountAmount, notes: null, createdAt: new Date().toISOString(), synced: false
      });
      cart.clearCart();
    } finally { setProcessing(false); setShowCheckout(false); setCashAmount(''); }
  };

  if (saleResult) {
    return (
      <div className="p-6 max-w-lg mx-auto text-center space-y-4">
        <div className="text-5xl">✅</div>
        <h2 className="text-2xl font-bold">Sale Complete</h2>
        <p className="text-lg">Receipt: <span className="font-mono font-bold">{saleResult.receiptNumber}</span></p>
        <p className="text-3xl font-bold">KES {saleResult.total.toLocaleString()}</p>
        {saleResult.change > 0 && <p className="text-lg text-muted-foreground">Change: KES {saleResult.change.toLocaleString()}</p>}
        <button onClick={() => setSaleResult(null)} className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-medium">New Sale</button>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col min-w-0 border-r">
        <div className="p-4 border-b space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border rounded-md bg-background" autoFocus />
          </div>
          <form onSubmit={(e) => { e.preventDefault(); handleBarcode(barcodeInput); }}>
            <input type="text" placeholder="Scan barcode..." value={barcodeInput} onChange={(e) => setBarcodeInput(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background font-mono" />
          </form>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {search && productsData?.data ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {productsData.data.map((p) => (
                <button key={p.id} onClick={() => addProduct(p)}
                  className="p-3 border rounded-lg hover:border-primary hover:bg-accent transition-colors text-left">
                  <div className="font-medium text-sm truncate">{p.name}</div>
                  <div className="text-sm font-bold text-primary mt-1">KES {p.priceAmount.toLocaleString()}</div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Search for products or scan a barcode
            </div>
          )}
        </div>
      </div>
      <div className="w-96 flex flex-col bg-card">
        <div className="p-4 border-b font-semibold">Cart ({cart.getItemCount()} items)</div>
        <div className="flex-1 overflow-auto p-4 space-y-2">
          {cart.items.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Cart is empty</p>
          ) : (
            cart.items.map((item) => (
              <div key={item.productId} className="flex items-center justify-between py-2 border-b">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.productName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <button onClick={() => cart.updateQuantity(item.productId, item.quantity - 1)} className="p-0.5 rounded hover:bg-accent"><Minus className="h-3 w-3" /></button>
                    <span className="text-sm w-6 text-center">{item.quantity}</span>
                    <button onClick={() => cart.updateQuantity(item.productId, item.quantity + 1)} className="p-0.5 rounded hover:bg-accent"><Plus className="h-3 w-3" /></button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">KES {(item.unitPriceAmount * item.quantity).toLocaleString()}</p>
                  <button onClick={() => cart.removeItem(item.productId)} className="text-destructive hover:bg-destructive/10 p-1 rounded"><Trash2 className="h-3 w-3" /></button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="p-4 border-t space-y-3">
          <div className="flex justify-between text-sm"><span>Subtotal</span><span className="font-bold">KES {cart.getSubtotal().toLocaleString()}</span></div>
          <div className="flex justify-between text-lg font-bold"><span>Total</span><span>KES {cart.getTotal().toLocaleString()}</span></div>
          {!showCheckout ? (
            <button onClick={() => setShowCheckout(true)} disabled={cart.items.length === 0}
              className="w-full py-2.5 bg-primary text-primary-foreground rounded-md font-medium disabled:opacity-50">
              Checkout
            </button>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                {['CASH','CARD','MPESA'].map((m) => (
                  <button key={m} onClick={() => setPaymentMethod(m)}
                    className={`flex-1 py-1.5 text-xs rounded-md border ${paymentMethod === m ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent'}`}>{m}</button>
                ))}
              </div>
              {paymentMethod === 'CASH' && <input type="number" placeholder="Cash amount" value={cashAmount} onChange={(e) => setCashAmount(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background" />}
              <button onClick={handleCheckout} disabled={processing}
                className="w-full py-2.5 bg-green-600 text-white rounded-md font-medium disabled:opacity-50">
                {processing ? 'Processing...' : 'Complete Sale'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}