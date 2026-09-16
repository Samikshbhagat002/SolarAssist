import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sun, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(() => localStorage.getItem('solarassist_last_email') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const redirectByRole = (role) => {
    if (role === 'USER') {
      navigate(location.pathname === '/existing-solar-support/login'
        ? '/user/existing-solar-support'
        : '/user/dashboard');
    } else if (role === 'VENDOR') navigate('/vendor/dashboard');
    else if (role === 'REPAIR_PROVIDER') navigate('/repair/dashboard');
    else if (role === 'ADMIN') navigate('/admin/dashboard');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email.trim(), password);
    setLoading(false);

    if (!result.success) {
      setError(result.message);
      return;
    }

    localStorage.setItem('solarassist_last_email', email.trim());
    redirectByRole(result.user.role);
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-sky-50">
      <div className="hidden md:flex flex-col justify-between bg-gradient-to-br from-blue-700 via-sky-600 to-sky-500 text-white p-12 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/15 rounded-full blur-3xl" />
        <div className="absolute left-10 bottom-10 w-64 h-64 bg-blue-600/20 rounded-full blur-2xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 text-2xl font-black mb-6">
            <div className="w-10 h-10 rounded-xl bg-white text-blue-700 flex items-center justify-center shadow-lg">
              <Sun size={24} />
            </div>
            <span>SolarAssist</span>
          </div>

          <div className="space-y-4 max-w-md">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-white border border-white/25">
              {t('auth_ai_planning')}
            </span>
            <h1 className="text-3xl font-extrabold leading-tight">
              {t('auth_plan_title')} <br />
              <span className="text-sky-100">{t('auth_go_solar')}</span>
            </h1>
            <p className="text-blue-200/90 text-sm leading-relaxed">
              {t('auth_login_promo')}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md bg-white border border-blue-100 rounded-3xl p-8 shadow-xl">
          <div className="flex items-center gap-2 mb-2 md:hidden">
            <Sun className="text-sky-600" size={24} />
            <span className="font-black text-xl text-blue-800">SolarAssist</span>
          </div>

          <h2 className="text-2xl font-black text-slate-900 mb-1">{t('login_title')}</h2>
          <p className="text-xs text-slate-500 mb-6">{t('login_description')}</p>

          {location.state?.justRegistered && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-xs rounded-xl px-4 py-3 mb-4">
              {t('registration_received')}
            </div>
          )}
          {location.state?.justReset && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-xs rounded-xl px-4 py-3 mb-4">
              {t('password_reset_success')}
            </div>
          )}
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl px-4 py-3 mb-4 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">{t('email_address_label')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('email_placeholder')}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase">{t('password_label')}</label>
                <Link to="/forgot-password" className="text-xs text-blue-700 hover:underline">{t('forgot_password_link')}</Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-950 text-white py-3 rounded-xl font-bold hover:bg-blue-900 transition disabled:opacity-60 shadow-md shadow-blue-950/20"
            >
              {loading ? t('signing_in') : t('sign_in')}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center space-y-2 text-xs text-slate-600">
            <p>
              {t('no_account')} <Link to="/register" className="text-blue-700 font-bold hover:underline">{t('register_now')}</Link>
            </p>
            <p>
              {t('are_you_vendor')} <Link to="/vendor/login" className="text-blue-700 font-bold hover:underline">{t('vendor_portal_login')}</Link>
            </p>
            <p>
              {t('are_you_repair_provider')} <Link to="/repair-provider/login" className="text-blue-700 font-bold hover:underline">{t('repair_provider_login')}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}