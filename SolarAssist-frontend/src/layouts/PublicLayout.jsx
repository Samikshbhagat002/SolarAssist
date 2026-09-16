import { Outlet } from 'react-router-dom';
import LanguageSwitcher from '../components/common/LanguageSwitcher';

export default function PublicLayout() {
  return (
    <div>
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>
      <Outlet />
    </div>
  );
}