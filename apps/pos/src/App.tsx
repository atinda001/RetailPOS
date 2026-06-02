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
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/pin-login" element={<PinLoginPage />} />
      <Route
        path="/"
        element={
          <AuthGuard>
            <PosLayout />
          </AuthGuard>
        }
      >
        <Route index element={<Navigate to="/pos" replace />} />
        <Route path="pos" element={<PosTerminalPage />} />
        <Route path="sales" element={<SalesHistoryPage />} />
        <Route path="shifts" element={<ShiftManagementPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="suppliers" element={<SuppliersPage />} />
        <Route path="purchases" element={<PurchasesPage />} />
        <Route path="reports" element={<ReportsPage />} />
      </Route>
    </Routes>
  );
}