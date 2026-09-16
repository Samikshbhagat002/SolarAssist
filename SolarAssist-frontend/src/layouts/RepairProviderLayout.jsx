import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, User, Wrench, ClipboardList, MessageSquare, LogOut, Sun, UserRound, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

const navItems = [
  { name: 'nav_dashboard', path: '/repair/dashboard', icon: LayoutDashboard },
  { name: 'nav_my_profile', path: '/repair/profile', icon: User },
  { name: 'nav_services', path: '/repair/services', icon: Wrench },
  { name: 'nav_repair_requests', path: '/repair/requests', icon: ClipboardList },
  { name: 'messages', path: '/repair/messages', icon: MessageSquare },
  { name: 'profile_settings_title', path: '/repair/profile-settings', icon: UserRound },
  { name: 'nav_about_us', path: '/about', icon: Info },
  { name: 'nav_feedback', path: '/feedback', icon: MessageSquare },
];

export default function RepairProviderLayout() {
  const { logout } = useAuth();
  const { t } = useTranslation();
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
              <Icon size={18} /> {t(name)}
            </Link>
          ))}
        </nav>
        <button onClick={logout} className="flex items-center gap-3 px-6 py-4 border-t border-blue-800 text-sm hover:bg-blue-800">
          <LogOut size={18} /> {t('logout')}
        </button>
      </aside>
      <main className="flex-1 bg-blue-50/40 p-8 overflow-y-auto">
        <div className="flex justify-end mb-4"><LanguageSwitcher /></div>
        <Outlet />
      </main>
    </div>
  );
}