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
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Inventory</h1>
      <div className="mb-4">
        <input type="text" placeholder="Store ID" value={storeId} onChange={(e) => setStoreId(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background w-80" />
      </div>
      {lowStockItems.length > 0 && (
        <div className="mb-6 p-4 border border-destructive/30 bg-destructive/5 rounded-lg">
          <h2 className="font-semibold text-destructive mb-2">Low Stock Alert ({lowStockItems.length} items)</h2>
          <div className="space-y-1">
            {lowStockItems.map((si: any) => (
              <div key={si.id} className="flex justify-between text-sm">
                <span>{si.product?.name}</span>
                <span className="font-bold text-destructive">{si.quantityOnHand} / {si.reorderPoint}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {isLoading ? <p>Loading...</p> : (
        <div className="space-y-2">
          {items.map((si: any) => (
            <div key={si.id} className="p-3 border rounded-lg flex justify-between items-center">
              <div>
                <p className="font-medium">{si.product?.name}</p>
                <p className="text-xs text-muted-foreground">{si.product?.category?.name}</p>
              </div>
              <div className="text-right">
                <p className={`font-bold ${si.quantityOnHand <= si.reorderPoint ? 'text-destructive' : ''}`}>{si.quantityOnHand}</p>
                <p className="text-xs text-muted-foreground">Reorder: {si.reorderPoint}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}