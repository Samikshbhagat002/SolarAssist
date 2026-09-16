import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Sun, FileText, DollarSign, MapPin, ClipboardList, LogOut, Wrench, UserRound, Info, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

// name here is now a real i18n KEY, not display text — every one of these
// must exist in en.json / hi.json / mr.json for t(name) to translate it.
const navItems = [
  { name: 'nav_dashboard', path: '/user/dashboard', icon: LayoutDashboard },
  { name: 'nav_planner', path: '/user/planner', icon: Sun },
  { name: 'recommendation', path: '/user/recommendation', icon: FileText },
  { name: 'nav_financial', path: '/user/financial', icon: DollarSign },
  { name: 'nav_vendors', path: '/user/vendors', icon: MapPin },
  { name: 'existingSolarSupport', path: '/user/existing-solar-support', icon: Wrench },
  { name: 'nav_reports', path: '/user/reports', icon: ClipboardList },
  { name: 'profile_settings_title', path: '/user/profile-settings', icon: UserRound },
  { name: 'nav_about_us', path: '/about', icon: Info },
  { name: 'nav_feedback', path: '/feedback', icon: MessageSquare },
];

export default function UserLayout() {
  const { logout, user } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-sky-50">
      <aside className="w-64 bg-white text-slate-800 flex flex-col shrink-0 border-r border-sky-100 shadow-lg">
        <div className="px-6 py-5 border-b border-blue-900/60 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-lg shadow-sky-500/20 font-bold shrink-0">
            <Sun size={24} />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-blue-700">SolarAssist</span>
            <div className="text-[10px] uppercase tracking-widest text-sky-600 font-bold">{t('user_portal_label')}</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
          <div className="px-3 text-[10px] font-bold text-sky-600 uppercase tracking-widest mb-2">{t('main_menu')}</div>
          {navItems.map(({ name, path, icon: Icon }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active ? 'bg-sky-100 text-blue-800 shadow-sm font-bold' : 'text-slate-600 hover:bg-sky-50 hover:text-blue-700'
                }`}
              >
                <Icon size={19} className={active ? 'text-blue-700' : 'text-sky-500'} /> {t(name)}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sky-100 bg-white">
          <div className="mb-3 px-3 py-2 bg-sky-50 rounded-xl border border-sky-100">
            <div className="text-xs font-bold text-slate-800 truncate">{user?.full_name || t('default_solar_user')}</div>
            <div className="text-[11px] text-blue-600 truncate">{user?.email || t('your_account_default')}</div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-sky-50 hover:text-blue-700 transition"
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