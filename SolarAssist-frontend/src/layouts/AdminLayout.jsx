import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Store, CheckSquare, Wrench, UserCheck, BarChart3, Settings, LogOut, ShieldCheck, UserRound, Info, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LanguageSwitcher from '../components/common/LanguageSwitcher';

const navItems = [
  { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'User Management', path: '/admin/users', icon: Users },
  { name: 'Vendor Management', path: '/admin/vendors', icon: Store },
  { name: 'Vendor Approvals', path: '/admin/approvals', icon: CheckSquare },
  { name: 'Repair Provider Management', path: '/admin/repair-providers', icon: Wrench },
  { name: 'Repair Provider Approvals', path: '/admin/repair-provider-approvals', icon: UserCheck },
  { name: 'Platform Reports', path: '/admin/analytics', icon: BarChart3 },
  { name: 'System Settings', path: '/admin/settings', icon: Settings },
  { name: 'Profile Settings', path: '/admin/profile-settings', icon: UserRound },
  { name: 'About Us', path: '/about', icon: Info },
  { name: 'Feedback', path: '/feedback', icon: MessageSquare },
];

export default function AdminLayout() {
  const { logout, user } = useAuth();
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-64 bg-gradient-to-b from-blue-950 via-slate-950 to-blue-950 text-white flex flex-col shrink-0 border-r border-blue-900/60 shadow-2xl">
        <div className="px-6 py-5 border-b border-blue-900/60 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 shrink-0">
            <ShieldCheck size={24} />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-blue-400 via-white to-cyan-200 bg-clip-text text-transparent">
              SolarAssist
            </span>
            <div className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold">Admin Panel</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
          <div className="px-3 text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-2">Admin Controls</div>
          {navItems.map(({ name, path, icon: Icon }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-bold' : 'text-slate-300 hover:bg-blue-900/60 hover:text-white'
                }`}
              >
                <Icon size={19} className={active ? 'text-white' : 'text-blue-400'} /> {name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-blue-900/60 bg-slate-950">
          <div className="mb-3 px-3 py-2 bg-slate-900 rounded-xl border border-blue-900/40">
            <div className="text-xs font-bold text-slate-100 truncate">{user?.full_name || 'System Admin'}</div>
            <div className="text-[11px] text-cyan-400 font-semibold">Administrator</div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-rose-500/20 hover:text-rose-300 transition"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-end mb-4"><LanguageSwitcher /></div>
        <Outlet />
      </main>
    </div>
  );
}