import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'default' },
    update: {},
    create: { name: 'Default Store', slug: 'default' },
  });

  const store = await prisma.store.upsert({
    where: { id: 'store-01' },
    update: {},
    create: { id: 'store-01', tenantId: tenant.id, name: 'Main Store' },
  });

  await prisma.terminal.upsert({
    where: { id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
    update: {},
    create: { id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', tenantId: tenant.id, storeId: store.id, name: 'Counter 1', isActive: true },
  });

  // ─── CATEGORIES ──────────────────────────────────────────────
  const categories = [
    { name: 'Dairy & Eggs', color: '#FEF3C7', iconName: 'milk' },
    { name: 'Bread & Bakery', color: '#FDE68A', iconName: 'croissant' },
    { name: 'Beverages', color: '#DBEAFE', iconName: 'coffee' },
    { name: 'Cereals & Grains', color: '#F3E8D7', iconName: 'wheat' },
    { name: 'Cooking Ingredients', color: '#FEE2E2', iconName: 'flame' },
    { name: 'Snacks & Sweets', color: '#FCE7F3', iconName: 'cookie' },
    { name: 'Household & Cleaning', color: '#D1FAE5', iconName: 'spray' },
    { name: 'Personal Care', color: '#E0E7FF', iconName: 'heart' },
    { name: 'Fresh Produce', color: '#DCFCE7', iconName: 'leaf' },
    { name: 'Meat & Fish', color: '#FECACA', iconName: 'drumstick' },
  ];

  const catMap: Record<string, string> = {};
  for (const c of categories) {
    const cat = await prisma.category.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: c.name } },
      update: {},
      create: { tenantId: tenant.id, ...c },
    });
    catMap[c.name] = cat.id;
  }

  // ─── PRODUCTS (prices in KES cents) ──────────────────────────
  const products = [
    { name: 'Brookside Fresh Milk 500ml', barcode: 'PROD001', priceAmount: 6500, costAmount: 5000, category: 'Dairy & Eggs' },
    { name: 'Brookside Fresh Milk 1L', barcode: 'PROD002', priceAmount: 11500, costAmount: 9000, category: 'Dairy & Eggs' },
    { name: 'Brookside Yoghurt Strawberry 500ml', barcode: 'PROD003', priceAmount: 8500, costAmount: 6500, category: 'Dairy & Eggs' },
    { name: 'KCC Butter 250g', barcode: 'PROD004', priceAmount: 22000, costAmount: 18000, category: 'Dairy & Eggs' },
    { name: 'Eggs Tray (30 pcs)', barcode: 'PROD005', priceAmount: 55000, costAmount: 45000, category: 'Dairy & Eggs' },
    { name: 'Blue Band Margarine 250g', barcode: 'PROD006', priceAmount: 18000, costAmount: 14000, category: 'Dairy & Eggs' },
    { name: 'Supaloaf White Bread 400g', barcode: 'PROD007', priceAmount: 6000, costAmount: 4500, category: 'Bread & Bakery' },
    { name: 'Supaloaf Brown Bread 400g', barcode: 'PROD008', priceAmount: 6500, costAmount: 5000, category: 'Bread & Bakery' },
    { name: 'Mandazi (4 pcs)', barcode: 'PROD009', priceAmount: 4000, costAmount: 2500, category: 'Bread & Bakery' },
    { name: 'Chapati (2 pcs)', barcode: 'PROD010', priceAmount: 5000, costAmount: 3000, category: 'Bread & Bakery' },
    { name: 'Kericho Gold Tea Bags (100 pcs)', barcode: 'PROD011', priceAmount: 28000, costAmount: 22000, category: 'Beverages' },
    { name: 'Dormans Coffee 250g', barcode: 'PROD012', priceAmount: 45000, costAmount: 35000, category: 'Beverages' },
    { name: 'Coca Cola 500ml', barcode: 'PROD013', priceAmount: 7000, costAmount: 5500, category: 'Beverages' },
    { name: 'Fanta Orange 500ml', barcode: 'PROD014', priceAmount: 7000, costAmount: 5500, category: 'Beverages' },
    { name: 'Dasani Water 1L', barcode: 'PROD015', priceAmount: 5000, costAmount: 3500, category: 'Beverages' },
    { name: 'Afia Juice Mango 1L', barcode: 'PROD016', priceAmount: 12000, costAmount: 9000, category: 'Beverages' },
    { name: 'Delmonte Juice 1L', barcode: 'PROD017', priceAmount: 18000, costAmount: 14000, category: 'Beverages' },
    { name: 'Drinking Water 20L', barcode: 'PROD018', priceAmount: 10000, costAmount: 6000, category: 'Beverages' },
    { name: 'Jogoo Maize Flour 2kg', barcode: 'PROD019', priceAmount: 16000, costAmount: 13000, category: 'Cereals & Grains' },
    { name: 'Ajab Maize Flour 2kg', barcode: 'PROD020', priceAmount: 15500, costAmount: 12500, category: 'Cereals & Grains' },
    { name: 'Pishori Rice 1kg', barcode: 'PROD021', priceAmount: 18000, costAmount: 14000, category: 'Cereals & Grains' },
    { name: 'Sindano Rice 1kg', barcode: 'PROD022', priceAmount: 14000, costAmount: 11000, category: 'Cereals & Grains' },
    { name: 'Ndengu (Green Grams) 1kg', barcode: 'PROD023', priceAmount: 16000, costAmount: 12000, category: 'Cereals & Grains' },
    { name: 'Beans Rosecoco 1kg', barcode: 'PROD024', priceAmount: 15000, costAmount: 11000, category: 'Cereals & Grains' },
    { name: 'Weetabix Cereal 450g', barcode: 'PROD025', priceAmount: 35000, costAmount: 28000, category: 'Cereals & Grains' },
    { name: 'Elianto Cooking Oil 1L', barcode: 'PROD026', priceAmount: 28000, costAmount: 23000, category: 'Cooking Ingredients' },
    { name: 'Rina Cooking Oil 1L', barcode: 'PROD027', priceAmount: 27000, costAmount: 22000, category: 'Cooking Ingredients' },
    { name: 'Kensalt Iodized Salt 1kg', barcode: 'PROD028', priceAmount: 3000, costAmount: 2000, category: 'Cooking Ingredients' },
    { name: 'Mumias Sugar 1kg', barcode: 'PROD029', priceAmount: 16000, costAmount: 13000, category: 'Cooking Ingredients' },
    { name: 'Royco Mchuzi Mix 50g', barcode: 'PROD030', priceAmount: 2500, costAmount: 1500, category: 'Cooking Ingredients' },
    { name: 'Tomato Paste Sachet 70g', barcode: 'PROD031', priceAmount: 3000, costAmount: 2000, category: 'Cooking Ingredients' },
    { name: 'Krackles Crisps 50g', barcode: 'PROD032', priceAmount: 5000, costAmount: 3500, category: 'Snacks & Sweets' },
    { name: 'Cadbury Dairy Milk 80g', barcode: 'PROD033', priceAmount: 18000, costAmount: 14000, category: 'Snacks & Sweets' },
    { name: 'Biscuits Digestive 200g', barcode: 'PROD034', priceAmount: 12000, costAmount: 9000, category: 'Snacks & Sweets' },
    { name: 'Peanuts Roasted 250g', barcode: 'PROD035', priceAmount: 8000, costAmount: 5500, category: 'Snacks & Sweets' },
    { name: 'Sunlight Dishwashing Liquid 500ml', barcode: 'PROD036', priceAmount: 12000, costAmount: 9000, category: 'Household & Cleaning' },
    { name: 'Omo Washing Powder 500g', barcode: 'PROD037', priceAmount: 15000, costAmount: 11000, category: 'Household & Cleaning' },
    { name: 'Jik Bleach 500ml', barcode: 'PROD038', priceAmount: 8000, costAmount: 5500, category: 'Household & Cleaning' },
    { name: 'Harpic Toilet Cleaner 500ml', barcode: 'PROD039', priceAmount: 18000, costAmount: 14000, category: 'Household & Cleaning' },
    { name: 'Tissue Paper (10 rolls)', barcode: 'PROD040', priceAmount: 35000, costAmount: 28000, category: 'Household & Cleaning' },
    { name: 'Matchboxes (pack of 10)', barcode: 'PROD041', priceAmount: 5000, costAmount: 3000, category: 'Household & Cleaning' },
    { name: 'Geisha Soap 175g', barcode: 'PROD042', priceAmount: 8000, costAmount: 5500, category: 'Personal Care' },
    { name: 'Colgate Toothpaste 100ml', barcode: 'PROD043', priceAmount: 12000, costAmount: 9000, category: 'Personal Care' },
    { name: 'Vaseline Lotion 400ml', barcode: 'PROD044', priceAmount: 35000, costAmount: 28000, category: 'Personal Care' },
    { name: 'Always Sanitary Pads (8 pcs)', barcode: 'PROD045', priceAmount: 12000, costAmount: 9000, category: 'Personal Care' },
    { name: 'Shower Gel 250ml', barcode: 'PROD046', priceAmount: 15000, costAmount: 11000, category: 'Personal Care' },
    { name: 'Tomatoes 1kg', barcode: 'PROD047', priceAmount: 10000, costAmount: 7000, category: 'Fresh Produce' },
    { name: 'Onions 1kg', barcode: 'PROD048', priceAmount: 8000, costAmount: 5500, category: 'Fresh Produce' },
    { name: 'Kales (Sukuma Wiki) bunch', barcode: 'PROD049', priceAmount: 3000, costAmount: 1500, category: 'Fresh Produce' },
    { name: 'Spinach bunch', barcode: 'PROD050', priceAmount: 3000, costAmount: 1500, category: 'Fresh Produce' },
    { name: 'Cabbage 1 head', barcode: 'PROD051', priceAmount: 5000, costAmount: 3000, category: 'Fresh Produce' },
    { name: 'Potatoes 1kg', barcode: 'PROD052', priceAmount: 8000, costAmount: 5500, category: 'Fresh Produce' },
    { name: 'Bananas (5 pcs)', barcode: 'PROD053', priceAmount: 5000, costAmount: 3000, category: 'Fresh Produce' },
    { name: 'Avocado (2 pcs)', barcode: 'PROD054', priceAmount: 4000, costAmount: 2500, category: 'Fresh Produce' },
    { name: 'Carrots 1kg', barcode: 'PROD055', priceAmount: 8000, costAmount: 5500, category: 'Fresh Produce' },
    { name: 'Green Pepper (2 pcs)', barcode: 'PROD056', priceAmount: 2000, costAmount: 1000, category: 'Fresh Produce' },
    { name: 'Beef 1kg', barcode: 'PROD057', priceAmount: 45000, costAmount: 38000, category: 'Meat & Fish' },
    { name: 'Chicken Whole 1.5kg', barcode: 'PROD058', priceAmount: 75000, costAmount: 60000, category: 'Meat & Fish' },
    { name: 'Tilapia Fish 1kg', barcode: 'PROD059', priceAmount: 50000, costAmount: 40000, category: 'Meat & Fish' },
    { name: 'Goat Meat 1kg', barcode: 'PROD060', priceAmount: 55000, costAmount: 45000, category: 'Meat & Fish' },
    { name: 'Smokies (pack of 10)', barcode: 'PROD061', priceAmount: 18000, costAmount: 14000, category: 'Meat & Fish' },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { tenantId_barcode: { tenantId: tenant.id, barcode: p.barcode } },
      update: {},
      create: {
        tenantId: tenant.id,
        categoryId: catMap[p.category],
        name: p.name,
        barcode: p.barcode,
        priceAmount: p.priceAmount,
        costAmount: p.costAmount,
        trackStock: true,
        allowNegativeStock: false,
      },
    });
  }

  // Create stock items with initial quantities
  for (const p of products) {
    const prod = await prisma.product.findUnique({
      where: { tenantId_barcode: { tenantId: tenant.id, barcode: p.barcode } },
    });
    if (!prod) continue;
    await prisma.stockItem.upsert({
      where: { storeId_productId: { storeId: store.id, productId: prod.id } },
      update: {},
      create: {
        tenantId: tenant.id,
        storeId: store.id,
        productId: prod.id,
        quantityOnHand: 50,
        reorderPoint: 10,
        reorderQuantity: 30,
      },
    });
  }

  // ─── USERS ────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('admin123', 10);
  const cashierPassword = await bcrypt.hash('cashier123', 10);
  const cashierPin = await bcrypt.hash('1234', 10);

  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'admin@retailpos.com' } },
    update: {},
    create: { tenantId: tenant.id, email: 'admin@retailpos.com', password: adminPassword, firstName: 'Admin', lastName: 'User', role: 'ADMIN' as Role },
  });

  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'cashier@retailpos.com' } },
    update: {},
    create: { tenantId: tenant.id, email: 'cashier@retailpos.com', password: cashierPassword, pin: cashierPin, firstName: 'Cashier', lastName: 'One', role: 'CASHIER' as Role },
  });

  console.log('Seed complete:');
  console.log(`  ${products.length} products across ${categories.length} categories`);
  console.log('  Admin:    admin@retailpos.com / admin123');
  console.log('  Cashier:  cashier@retailpos.com / cashier123 (PIN: 1234)');
  console.log('  Terminal: a1b2c3d4-e5f6-7890-abcd-ef1234567890');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
