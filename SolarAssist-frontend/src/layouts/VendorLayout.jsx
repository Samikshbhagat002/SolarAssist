import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, User, Package, ClipboardList, BarChart3, LogOut, Sun, MessageSquare, UserRound, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

// name is a real i18n key now, matched against en.json / hi.json / mr.json
const navItems = [
  { name: 'nav_dashboard', path: '/vendor/dashboard', icon: LayoutDashboard },
  { name: 'nav_my_products_services', path: '/vendor/services', icon: Package },
  { name: 'nav_customer_requests', path: '/vendor/requests', icon: ClipboardList },
  { name: 'nav_reports', path: '/vendor/reports', icon: BarChart3 },
  { name: 'nav_business_profile', path: '/vendor/profile', icon: User },
  { name: 'messages', path: '/vendor/messages', icon: MessageSquare },
  { name: 'profile_settings_title', path: '/vendor/profile-settings', icon: UserRound },
  { name: 'nav_about_us', path: '/about', icon: Info },
  { name: 'nav_feedback', path: '/feedback', icon: MessageSquare },
];

export default function VendorLayout() {
  const { logout, user } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const portalPrefix = user?.role === 'SERVICE_PROVIDER' ? '/service-provider' : '/vendor';
  const portalLabel = user?.role === 'SERVICE_PROVIDER' ? t('repair_provider_role') : t('vendor_partner');

  return (
    <div className="flex min-h-screen bg-sky-50">
      <aside className="w-64 bg-white text-slate-800 flex flex-col shrink-0 border-r border-sky-100 shadow-lg">
        <div className="px-6 py-5 border-b border-blue-900/60 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-lg shadow-sky-500/20 font-bold shrink-0">
            <Sun size={24} />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-blue-700">SolarAssist</span>
            <div className="text-[10px] uppercase tracking-widest text-sky-600 font-bold">{portalLabel}</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
          <div className="px-3 text-[10px] font-bold text-sky-600 uppercase tracking-widest mb-2">{t('vendor_navigation_label')}</div>
          {navItems.map(({ name, path, icon: Icon }) => {
            const portalPath = path.startsWith('/about') || path.startsWith('/feedback')
              ? path
              : path.replace('/vendor', portalPrefix);
            const active = location.pathname === portalPath;
            return (
              <Link
                key={path}
                to={portalPath}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active ? 'bg-sky-100 text-blue-800 shadow-sm font-bold' : 'text-slate-600 hover:bg-sky-50 hover:text-blue-700'
                }`}
              >
                <Icon size={19} className={active ? 'text-blue-700' : 'text-sky-500'} /> {t(name)}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-blue-900/60 bg-blue-950/80">
          <div className="mb-3 px-3 py-2 bg-sky-50 rounded-xl border border-sky-100">
            <div className="text-xs font-bold text-slate-800 truncate">{user?.business_name || user?.full_name || t('default_solar_partner')}</div>
            <div className="text-[11px] text-blue-600 font-semibold">{t('status_prefix')} {user?.vendor_status || t('status_approved')}</div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-rose-500/20 hover:text-rose-300 transition"
          >
            <LogOut size={16} /> {t('logout')}
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