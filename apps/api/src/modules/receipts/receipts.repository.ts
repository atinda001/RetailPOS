import { prisma } from '../../lib/prisma.js';

export const findById = async (tenantId: string, id: string) => {
  return prisma.sale.findFirst({
    where: { id, tenantId },
    include: {
      lineItems: {
        include: {
          product: { select: { id: true, name: true, barcode: true, imageUrl: true } }
        }
      },
      payments: true,
      cashier: { select: { id: true, firstName: true, lastName: true } },
      customer: { select: { id: true, firstName: true, lastName: true, phone: true } },
      store: { select: { id: true, name: true, currency: true, address: true, phone: true, receiptFooter: true } },
      shift: { select: { id: true, openedAt: true } }
    }
  });
};

export const formatReceipt = (sale: any): string => {
  const store = sale.store;
  const cashier = sale.cashier;
  const customer = sale.customer;
  const lineItems = sale.lineItems;
  const payments = sale.payments;

  const formatMoney = (cents: number) => {
    return `${store.currency} ${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  let receipt = '';

  // Header
  receipt += `${store.name.toUpperCase()}\n`;
  if (store.address) receipt += `${store.address}\n`;
  if (store.phone) receipt += `Tel: ${store.phone}\n`;
  receipt += '----------------------------------------\n';

  // Receipt info
  receipt += `Receipt #: ${sale.receiptNumber}\n`;
  receipt += `Date: ${formatDate(sale.createdAt)}\n`;
  receipt += `Cashier: ${cashier.firstName} ${cashier.lastName}\n`;
  if (customer) {
    receipt += `Customer: ${customer.firstName} ${customer.lastName}\n`;
    if (customer.phone) receipt += `Phone: ${customer.phone}\n`;
  }
  receipt += '----------------------------------------\n';

  // Line items
  receipt += 'ITEMS\n';
  lineItems.forEach((item: any) => {
    const name = item.productName.length > 25 ? item.productName.substring(0, 25) : item.productName;
    const qty = item.quantity.toString().padStart(3);
    const price = formatMoney(item.unitPriceAmount).padStart(8);
    const total = formatMoney(item.totalAmount).padStart(8);
    receipt += `${name.padEnd(25)} ${qty} ${price} ${total}\n`;
    if (item.discountAmount > 0) {
      receipt += `  Discount: -${formatMoney(item.discountAmount)}\n`;
    }
  });
  receipt += '----------------------------------------\n';

  // Totals
  receipt += `SUBTOTAL: ${formatMoney(sale.subtotalAmount).padStart(30)}\n`;
  if (sale.discountAmount > 0) {
    receipt += `DISCOUNT: -${formatMoney(sale.discountAmount).padStart(29)}\n`;
  }
  receipt += `VAT (16%): ${formatMoney(sale.taxAmount).padStart(29)}\n`;
  receipt += `TOTAL: ${formatMoney(sale.totalAmount).padStart(32)}\n`;
  receipt += '----------------------------------------\n';

  // Payments
  receipt += 'PAYMENTS\n';
  payments.forEach((payment: any) => {
    receipt += `${payment.method.padEnd(15)} ${formatMoney(payment.amount).padStart(15)}\n`;
    if (payment.reference) {
      receipt += `  Ref: ${payment.reference}\n`;
    }
  });
  receipt += '----------------------------------------\n';

  // Change
  if (sale.changeAmount > 0) {
    receipt += `TENDERED: ${formatMoney(sale.amountTendered).padStart(29)}\n`;
    receipt += `CHANGE: ${formatMoney(sale.changeAmount).padStart(30)}\n`;
    receipt += '----------------------------------------\n';
  }

  // Footer
  if (store.receiptFooter) {
    receipt += `${store.receiptFooter}\n`;
  }
  receipt += 'Thank you for shopping with us!\n';

  return receipt;
};
