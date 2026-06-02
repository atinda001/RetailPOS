import { create } from 'zustand';

export interface CartItem {
  productId: string;
  productName: string;
  barcode: string | null;
  unitPriceAmount: number;
  quantity: number;
  discountAmount: number;
}

interface CartState {
  items: CartItem[];
  customerId: string | null;
  customerName: string | null;
  discountAmount: number;
  addItem: (item: Omit<CartItem, 'quantity' | 'discountAmount'>) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateDiscount: (productId: string, discountAmount: number) => void;
  setCustomer: (id: string | null, name: string | null) => void;
  setGlobalDiscount: (amount: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customerId: null,
  customerName: null,
  discountAmount: 0,

  addItem: (item) => {
    const existing = get().items.find((i) => i.productId === item.productId);
    if (existing) {
      set({
        items: get().items.map((i) =>
          i.productId === item.productId ? { ...i, quantity: i.quantity + 1 } : i
        )
      });
    } else {
      set({ items: [...get().items, { ...item, quantity: 1, discountAmount: 0 }] });
    }
  },

  removeItem: (productId) => {
    set({ items: get().items.filter((i) => i.productId !== productId) });
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    set({
      items: get().items.map((i) =>
        i.productId === productId ? { ...i, quantity } : i
      )
    });
  },

  updateDiscount: (productId, discountAmount) => {
    set({
      items: get().items.map((i) =>
        i.productId === productId ? { ...i, discountAmount } : i
      )
    });
  },

  setCustomer: (id, name) => {
    set({ customerId: id, customerName: name });
  },

  setGlobalDiscount: (amount) => {
    set({ discountAmount: amount });
  },

  clearCart: () => {
    set({ items: [], customerId: null, customerName: null, discountAmount: 0 });
  },

  getSubtotal: () => {
    return get().items.reduce((sum, i) => sum + i.unitPriceAmount * i.quantity, 0);
  },

  getTotal: () => {
    const subtotal = get().getSubtotal();
    const itemDiscounts = get().items.reduce((sum, i) => sum + i.discountAmount, 0);
    return subtotal - itemDiscounts - get().discountAmount;
  },

  getItemCount: () => {
    return get().items.reduce((sum, i) => sum + i.quantity, 0);
  }
}));
