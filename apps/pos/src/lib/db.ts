import Dexie, { type Table } from 'dexie';

export interface OfflineSale {
  id?: number;
  offlineId: string;
  tenantId: string;
  storeId: string;
  terminalId: string;
  shiftId: string;
  cashierId: string;
  customerId: string | null;
  lineItems: Array<{
    productId: string;
    quantity: number;
    unitPriceAmount: number;
    discountAmount: number;
  }>;
  payments: Array<{
    method: string;
    amount: number;
    reference: string | null;
  }>;
  discountAmount: number;
  notes: string | null;
  createdAt: string;
  synced: boolean;
}

export interface OfflineProduct {
  id: string;
  tenantId: string;
  name: string;
  barcode: string | null;
  sku: string | null;
  priceAmount: number;
  costAmount: number;
  imageUrl: string | null;
  categoryId: string | null;
  categoryName: string | null;
  isActive: boolean;
  trackStock: boolean;
  updatedAt: string;
}

class PosDatabase extends Dexie {
  offlineSales!: Table<OfflineSale, number>;
  offlineProducts!: Table<OfflineProduct, string>;

  constructor() {
    super('RetailPOS');
    this.version(1).stores({
      offlineSales: '++id, offlineId, synced, createdAt',
      offlineProducts: 'id, barcode, name'
    });
  }
}

export const db = new PosDatabase();
