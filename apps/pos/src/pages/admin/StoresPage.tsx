import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiClient } from '../../lib/api';
import { Plus, MapPin, Phone, DollarSign, Clock, Monitor, X, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';

function CreateStoreModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [currency, setCurrency] = useState('KES');
  const [timezone, setTimezone] = useState('Africa/Nairobi');
  const [receiptFooter, setReceiptFooter] = useState('');
  const [kraPin, setKraPin] = useState('');
  const [vatRegNumber, setVatRegNumber] = useState('');
  const [vatModel, setVatModel] = useState('INCLUSIVE');

  const mutation = useMutation({
    mutationFn: () => apiClient.post('/stores', {
      name, address, phone, currency, timezone, receiptFooter, kraPin, vatRegNumber, vatModel,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stores-list'] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background rounded-xl w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-bold">Create New Store</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="text-sm font-medium block mb-1">Store Name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Nairobi Main Branch"
              className="w-full px-3 py-2 border rounded-md bg-background text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Address</label>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)}
              placeholder="Physical address"
              className="w-full px-3 py-2 border rounded-md bg-background text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Phone</label>
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)}
              placeholder="+254..."
              className="w-full px-3 py-2 border rounded-md bg-background text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1">Currency</label>
              <input type="text" value={currency} onChange={(e) => setCurrency(e.target.value)}
                maxLength={3}
                className="w-full px-3 py-2 border rounded-md bg-background text-sm uppercase" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Timezone</label>
              <input type="text" value={timezone} onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background text-sm" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Receipt Footer</label>
            <input type="text" value={receiptFooter} onChange={(e) => setReceiptFooter(e.target.value)}
              placeholder="e.g. Thank you for shopping with us!"
              className="w-full px-3 py-2 border rounded-md bg-background text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1">KRA PIN</label>
              <input type="text" value={kraPin} onChange={(e) => setKraPin(e.target.value)}
                placeholder="P051234567X"
                className="w-full px-3 py-2 border rounded-md bg-background text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">VAT Reg Number</label>
              <input type="text" value={vatRegNumber} onChange={(e) => setVatRegNumber(e.target.value)}
                placeholder="VAT..."
                className="w-full px-3 py-2 border rounded-md bg-background text-sm" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">VAT Model</label>
            <select value={vatModel} onChange={(e) => setVatModel(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background text-sm">
              <option value="INCLUSIVE">Inclusive (prices include VAT)</option>
              <option value="EXCLUSIVE">Exclusive (prices exclude VAT)</option>
            </select>
          </div>
          {mutation.isError && (
            <p className="text-sm text-destructive">Failed to create store. Please try again.</p>
          )}
          <div className="flex gap-2 pt-1">
            <button onClick={() => mutation.mutate()} disabled={!name || mutation.isPending}
              className="flex-1 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50">
              {mutation.isPending ? 'Creating…' : 'Create Store'}
            </button>
            <button onClick={onClose} className="px-4 py-2 border rounded-md text-sm">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StoreDetailModal({ storeId, onClose }: { storeId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['store-detail', storeId],
    queryFn: () => apiClient.get('/stores/' + storeId),
  });
  const store = (data as any)?.data;

  const [newTerminalName, setNewTerminalName] = useState('');

  const deactivateMutation = useMutation({
    mutationFn: () => apiClient.patch(`/stores/${storeId}/deactivate`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stores-list'] });
      onClose();
    },
  });

  const addTerminalMutation = useMutation({
    mutationFn: () => apiClient.post(`/stores/${storeId}/terminals`, { name: newTerminalName }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['store-detail', storeId] });
      setNewTerminalName('');
    },
  });

  const deactivateTerminalMutation = useMutation({
    mutationFn: (terminalId: string) => apiClient.patch(`/stores/${storeId}/terminals/${terminalId}/deactivate`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['store-detail', storeId] }),
  });

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  if (!store) return <div className="p-8 text-center text-destructive">Store not found</div>;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-background">
          <h2 className="font-bold">{store.name}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-4 space-y-5">
          {/* Store Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" />{store.address || 'No address'}</div>
            <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />{store.phone || 'No phone'}</div>
            <div className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-muted-foreground" />{store.currency}</div>
            <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" />{store.timezone}</div>
            {store.kraPin && <div className="col-span-2 text-xs text-muted-foreground">KRA PIN: {store.kraPin}</div>}
            {store.vatRegNumber && <div className="col-span-2 text-xs text-muted-foreground">VAT Reg: {store.vatRegNumber}</div>}
            <div className="col-span-2 text-xs text-muted-foreground">VAT Model: {store.vatModel}</div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-muted/40 rounded text-center">
              <p className="text-2xl font-bold">{store._count?.terminals ?? 0}</p>
              <p className="text-xs text-muted-foreground">Terminals</p>
            </div>
            <div className="p-3 bg-muted/40 rounded text-center">
              <p className="text-2xl font-bold">{store._count?.users ?? 0}</p>
              <p className="text-xs text-muted-foreground">Users</p>
            </div>
            <div className="p-3 bg-muted/40 rounded text-center">
              <p className="text-2xl font-bold">{store._count?.sales ?? 0}</p>
              <p className="text-xs text-muted-foreground">Sales</p>
            </div>
          </div>

          {/* Terminals */}
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2"><Monitor className="h-4 w-4" /> Terminals</h3>
            <div className="space-y-2 mb-3">
              {(store.terminals ?? []).map((t: any) => (
                <div key={t.id} className="flex justify-between items-center p-2 bg-muted/40 rounded text-sm">
                  <span className="font-medium">{t.name}</span>
                  <div className="flex items-center gap-2">
                    {t.isActive ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-destructive" />}
                    {t.isActive && (
                      <button onClick={() => deactivateTerminalMutation.mutate(t.id)}
                        className="text-xs text-destructive hover:underline">Deactivate</button>
                    )}
                  </div>
                </div>
              ))}
              {(store.terminals ?? []).length === 0 && <p className="text-sm text-muted-foreground">No terminals configured</p>}
            </div>
            <div className="flex gap-2">
              <input type="text" value={newTerminalName} onChange={(e) => setNewTerminalName(e.target.value)}
                placeholder="New terminal name (e.g. Counter 2)"
                className="flex-1 px-3 py-1.5 border rounded-md bg-background text-sm" />
              <button onClick={() => addTerminalMutation.mutate()} disabled={!newTerminalName || addTerminalMutation.isPending}
                className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm disabled:opacity-50">
                Add
              </button>
            </div>
          </div>

          {/* Actions */}
          {store.isActive && (
            <div className="pt-3 border-t">
              <button onClick={() => deactivateMutation.mutate()} disabled={deactivateMutation.isPending}
                className="w-full py-2 border border-destructive text-destructive rounded-md text-sm hover:bg-destructive/10 disabled:opacity-50">
                {deactivateMutation.isPending ? 'Deactivating…' : 'Deactivate Store'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function StoresPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['stores-list'],
    queryFn: () => apiClient.get('/stores'),
  });
  const stores = (data as any)?.data ?? [];

  return (
    <div className="p-6 space-y-5">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Stores</h1>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">
          <Plus className="h-4 w-4" /> Add Store
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />)}</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stores.map((store: any) => (
            <div key={store.id} className="p-4 border rounded-lg bg-card hover:border-primary/30 transition-colors cursor-pointer"
              onClick={() => setSelectedStoreId(store.id)}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold">{store.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {store.address || 'No address'}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${store.isActive ? 'bg-green-100 text-green-700' : 'bg-destructive/10 text-destructive'}`}>
                  {store.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div className="p-2 bg-muted/40 rounded">
                  <p className="font-bold">{store._count?.terminals ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Terminals</p>
                </div>
                <div className="p-2 bg-muted/40 rounded">
                  <p className="font-bold">{store._count?.users ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Users</p>
                </div>
                <div className="p-2 bg-muted/40 rounded">
                  <p className="font-bold">{store._count?.sales ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Sales</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t text-xs text-muted-foreground flex justify-between">
                <span>{store.currency} · {store.timezone}</span>
                <span>VAT: {store.vatModel}</span>
              </div>
            </div>
          ))}
          {stores.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No stores configured yet</p>
            </div>
          )}
        </div>
      )}

      {showCreate && <CreateStoreModal onClose={() => setShowCreate(false)} />}
      {selectedStoreId && <StoreDetailModal storeId={selectedStoreId} onClose={() => setSelectedStoreId(null)} />}
    </div>
  );
}
