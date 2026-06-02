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

// ── App.tsx (proper JSX) ──
w('App.tsx', `
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/auth.store';
import { LoginPage } from './pages/auth/LoginPage';
import { PinLoginPage } from './pages/auth/PinLoginPage';
import { PosLayout } from './components/layout/PosLayout';
import { PosTerminalPage } from './pages/pos/PosTerminalPage';
import { SalesHistoryPage } from './pages/sales/SalesHistoryPage';
import { ShiftManagementPage } from './pages/shifts/ShiftManagementPage';
import { InventoryPage } from './pages/inventory/InventoryPage';
import { ProductsPage } from './pages/admin/ProductsPage';
import { UsersPage } from './pages/admin/UsersPage';
import { CustomersPage } from './pages/admin/CustomersPage';
import { SuppliersPage } from './pages/admin/SuppliersPage';
import { PurchasesPage } from './pages/admin/PurchasesPage';
import { ReportsPage } from './pages/admin/ReportsPage';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.accessToken);
  if (!token) return ${L}Navigate to=${Q}/login${Q} replace /${G};
  return ${L}${G}{children}${L}/${G};
}

export default function App() {
  return (
    ${L}Routes${G}
      ${L}Route path=${Q}/login${Q} element={${L}LoginPage /${G}} /${G}
      ${L}Route path=${Q}/pin-login${Q} element={${L}PinLoginPage /${G}} /${G}
      ${L}Route
        path=${Q}/${Q}
        element={
          ${L}AuthGuard${G}
            ${L}PosLayout /${G}
          ${L}/AuthGuard${G}
        }
      ${G}
        ${L}Route index element={${L}Navigate to=${Q}/pos${Q} replace /${G}} /${G}
        ${L}Route path=${Q}pos${Q} element={${L}PosTerminalPage /${G}} /${G}
        ${L}Route path=${Q}sales${Q} element={${L}SalesHistoryPage /${G}} /${G}
        ${L}Route path=${Q}shifts${Q} element={${L}ShiftManagementPage /${G}} /${G}
        ${L}Route path=${Q}inventory${Q} element={${L}InventoryPage /${G}} /${G}
        ${L}Route path=${Q}products${Q} element={${L}ProductsPage /${G}} /${G}
        ${L}Route path=${Q}users${Q} element={${L}UsersPage /${G}} /${G}
        ${L}Route path=${Q}customers${Q} element={${L}CustomersPage /${G}} /${G}
        ${L}Route path=${Q}suppliers${Q} element={${L}SuppliersPage /${G}} /${G}
        ${L}Route path=${Q}purchases${Q} element={${L}PurchasesPage /${G}} /${G}
        ${L}Route path=${Q}reports${Q} element={${L}ReportsPage /${G}} /${G}
      ${L}/Route${G}
    ${L}/Routes${G}
  );
}
`.trim());

console.log('App.tsx fixed with proper JSX!');
console.log('All scaffold scripts complete. Run: node scaffold5.mjs');
