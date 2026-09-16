import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Store, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function VendorLogin({ partnerRole = 'VENDOR' }) {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(() => localStorage.getItem('solarassist_last_email') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email.trim(), password);
    setLoading(false);

    if (!result.success) {
      setError(result.message.includes('pending') ? t('vendor_pending_login') : result.message);
      return;
    }
    if (result.user.role !== partnerRole) {
      return setError(`This login is for ${partnerRole === 'SERVICE_PROVIDER' ? 'repair provider' : 'vendor'} accounts only.`);
    }
    localStorage.setItem('solarassist_last_email', email.trim());
    navigate(partnerRole === 'SERVICE_PROVIDER' ? '/service-provider/dashboard' : '/vendor/dashboard');
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-sky-50">
      <div className="hidden md:flex flex-col justify-between bg-gradient-to-br from-blue-700 via-sky-600 to-sky-500 text-white p-12 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/15 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 text-2xl font-black mb-6">
            <div className="w-10 h-10 rounded-xl bg-white text-blue-700 flex items-center justify-center shadow-lg">
              <Store size={24} />
            </div>
            <span>{t('partner_portal_title')}</span>
          </div>

          <div className="space-y-4 max-w-md">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-white border border-white/25">
              <CheckCircle2 size={14} /> {t('approved_solar_vendors')}
            </span>
            <h1 className="text-3xl font-extrabold leading-tight">
              {t('vendor_grow_business')} <br />
              <span className="text-sky-100">{t('vendor_connect_customers')}</span>
            </h1>
            <p className="text-blue-200/90 text-sm leading-relaxed">
              {t('vendor_manage_desc')}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md bg-white border border-blue-100 rounded-3xl p-8 shadow-xl">
          <h2 className="text-2xl font-black text-slate-900 mb-1">{partnerRole === 'SERVICE_PROVIDER' ? t('repair_provider_sign_in') : t('vendor_portal_sign_in')}</h2>
          <p className="text-xs text-slate-500 mb-6">{t('partner_credentials_desc')}</p>

          {location.state?.justRegistered && (
            <div className="bg-sky-50 border border-sky-200 text-blue-800 text-xs rounded-xl px-4 py-3 mb-4">
              {t('partner_registration_received')}
            </div>
          )}
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl px-4 py-3 mb-4 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">{t('partner_email_label')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('partner_email_placeholder')}
                className="w-full border border-sky-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
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
                  className="w-full border border-sky-200 rounded-xl px-3.5 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
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
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-60 shadow-md"
            >
              {loading ? t('signing_in') : partnerRole === 'SERVICE_PROVIDER' ? t('repair_provider_login') : t('vendor_login')}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center space-y-2 text-xs text-slate-600">
            <p>
              {t('new_vendor_question')} <Link to="/register" className="text-blue-700 font-bold hover:underline">{t('register_business')}</Link>
            </p>
            <p>
              {t('looking_for_user_login')} <Link to="/login" className="text-blue-700 font-bold hover:underline">{t('user_login')}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}