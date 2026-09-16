import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Store, CheckSquare, BarChart3, LogOut, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Users', path: '/admin/users', icon: Users },
  { name: 'Vendors', path: '/admin/vendors', icon: Store },
  { name: 'Vendor Approvals', path: '/admin/approvals', icon: CheckSquare },
  { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
];

export default function AdminLayout() {
  const { logout } = useAuth();
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-white">
      <aside className="w-64 bg-blue-900 text-white flex flex-col shrink-0">
        <div className="px-6 py-5 text-xl font-bold border-b border-blue-800 flex items-center gap-2">
          <Sun className="text-yellow-300" size={22} /> SolarAssist
        </div>
        <nav className="flex-1 px-3 py-6 space-y-1">
          {navItems.map(({ name, path, icon: Icon }) => (
            <Link key={path} to={path} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${location.pathname === path ? 'bg-blue-700' : 'hover:bg-blue-800'}`}>
              <Icon size={18} /> {name}
            </Link>
          ))}
        </nav>
        <button onClick={logout} className="flex items-center gap-3 px-6 py-4 border-t border-blue-800 text-sm hover:bg-blue-800">
          <LogOut size={18} /> Logout
        </button>
      </aside>
      <main className="flex-1 bg-blue-50/40 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}