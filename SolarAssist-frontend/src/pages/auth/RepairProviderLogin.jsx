import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Wrench, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function RepairProviderLogin() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (!result.success) return setError(result.message);
    if (result.user.role !== 'REPAIR_PROVIDER') {
      return setError(t('not_repair_provider'));
    }
    navigate('/repair/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:flex flex-col justify-center bg-blue-900 text-white px-16">
        <div className="flex items-center gap-2 text-2xl font-bold mb-4">
          <Wrench className="text-yellow-300" /> {t('repair_provider_portal_title')}
        </div>
        <p className="text-blue-100 max-w-sm">{t('repair_manage_desc')}</p>
      </div>

      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <form onSubmit={handleSubmit}>
          <h2 className="text-2xl font-bold text-blue-900 mb-6">{t('repair_login_title')}</h2>

          {location.state?.justRegistered && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mb-4">
              {t('repair_registration_received')}
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>
          )}

          <label className="block text-sm font-medium text-slate-700 mb-1">{t('email_label')}</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 mb-4" required />

          <label className="block text-sm font-medium text-slate-700 mb-1">{t('password_label')}</label>
          <div className="relative mb-2">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 pr-10"
              required
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" tabIndex={-1}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="text-sm text-right mb-6">
            <Link to="/forgot-password" className="text-blue-700 hover:underline">{t('forgot_password_link_no_question')}</Link>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-blue-900 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-800 disabled:opacity-60">
            {loading ? t('logging_in') : t('login_button')}
          </button>

          <p className="text-sm text-center text-slate-500 mt-6">
            {t('not_a_repair_provider')} <Link to="/login" className="text-blue-700 hover:underline">{t('user_login')}</Link> ·{' '}
            <Link to="/vendor/login" className="text-blue-700 hover:underline">{t('vendor_login')}</Link>
          </p>
          </form>
        </div>
      </div>
    </div>
  );
}