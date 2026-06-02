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
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <Store className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">RetailPOS</span>
        </div>
        {user && <p className="text-xs text-muted-foreground mt-1">{user.firstName} {user.lastName} ({user.role})</p>}
      </div>
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        <p className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cashier</p>
        {cashierLinks.map((l) => (
          <NavLink key={l.to} to={l.to} className={linkClass} onClick={() => setSidebarOpen(false)}>
            <l.icon className="h-4 w-4" />{l.label}
          </NavLink>
        ))}
        {isAdmin && (
          <>
            <p className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-4">Admin</p>
            {adminLinks.map((l) => (
              <NavLink key={l.to} to={l.to} className={linkClass} onClick={() => setSidebarOpen(false)}>
                <l.icon className="h-4 w-4" />{l.label}
              </NavLink>
            ))}
          </>
        )}
      </nav>
      <div className="p-2 border-t">
        <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
          <LogOut className="h-4 w-4" />Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform duration-200 lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar />
      </aside>
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center justify-between h-14 px-4 border-b bg-card shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 rounded-md hover:bg-accent">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <span className="text-sm text-muted-foreground">{user?.firstName} {user?.lastName}</span>
        </header>
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}