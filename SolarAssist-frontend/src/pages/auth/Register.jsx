import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Store, UserRound, CheckCircle2, Wrench } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Register() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedRole = searchParams.get('role');
  const [role, setRole] = useState(requestedRole === 'REPAIR_PROVIDER' ? 'REPAIR_PROVIDER' : 'USER');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', password: '', confirmPassword: '',
    businessName: '', address: '', city: '', state: '', serviceArea: '', gst: '',
  });

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) return setError(t('passwords_do_not_match'));

    setLoading(true);
    const result = await register({ ...form, role });
    setLoading(false);

    if (!result.success) return setError(result.message);

    const destination = role === 'VENDOR'
      ? '/vendor/dashboard'
      : role === 'REPAIR_PROVIDER'
        ? '/repair/dashboard'
        : '/user/dashboard';
    navigate(destination, {
      replace: true,
      state: { justRegistered: true },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-sky-50">
      <form onSubmit={handleSubmit} className="w-full max-w-2xl bg-white border border-sky-100 rounded-3xl p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-xl bg-sky-100 text-blue-700 flex items-center justify-center"><Store size={22} /></div>
          <div>
            <h2 className="text-2xl font-bold text-blue-900">{t('register_title')}</h2>
            <p className="text-sm text-slate-500">{t('register_description')}</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <label className="block text-sm font-medium text-slate-700 mb-1">{t('full_name_label')}</label>
        <input value={form.fullName} onChange={update('fullName')} className="w-full border border-slate-300 rounded-lg px-3 py-2 mb-4" required />

        <label className="block text-sm font-medium text-slate-700 mb-1">{t('email_label')}</label>
        <input type="email" value={form.email} onChange={update('email')} className="w-full border border-slate-300 rounded-lg px-3 py-2 mb-4" required />

        <label className="block text-sm font-medium text-slate-700 mb-1">{t('phone_label')}</label>
        <input value={form.phone} onChange={update('phone')} className="w-full border border-slate-300 rounded-lg px-3 py-2 mb-4" required />

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('password_label')}</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={update('password')}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 pr-10"
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" tabIndex={-1}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('confirm_password_label')}</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={update('confirmPassword')}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 pr-10"
                required
              />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" tabIndex={-1}>
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        </div>

        <label className="block text-sm font-medium text-slate-700 mb-2">{t('register_as_label')}</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <button type="button" onClick={() => setRole('USER')} className={`p-3 rounded-xl border text-left ${role === 'USER' ? 'border-sky-500 bg-sky-50 text-blue-800' : 'border-slate-200 text-slate-600'}`}>
            <UserRound size={18} className="mb-1" /><span className="block text-sm font-bold">{t('solar_user_role')}</span><span className="text-xs">{t('solar_user_role_desc')}</span>
          </button>
          <button type="button" onClick={() => setRole('VENDOR')} className={`p-3 rounded-xl border text-left ${role === 'VENDOR' ? 'border-sky-500 bg-sky-50 text-blue-800' : 'border-slate-200 text-slate-600'}`}>
            <Store size={18} className="mb-1" /><span className="block text-sm font-bold">{t('solar_vendor_role')}</span><span className="text-xs">{t('solar_vendor_role_desc')}</span>
          </button>
          <button type="button" onClick={() => setRole('REPAIR_PROVIDER')} className={`p-3 rounded-xl border text-left ${role === 'REPAIR_PROVIDER' ? 'border-sky-500 bg-sky-50 text-blue-800' : 'border-slate-200 text-slate-600'}`}>
            <Wrench size={18} className="mb-1" /><span className="block text-sm font-bold">{t('repair_provider_role')}</span><span className="text-xs">{t('repair_provider_role_desc')}</span>
          </button>
        </div>

        {(role === 'VENDOR' || role === 'REPAIR_PROVIDER') && (
          <div className="border-t border-sky-100 pt-4 mt-2 space-y-4">
            <p className="text-sm font-semibold text-blue-900">{role === 'REPAIR_PROVIDER' ? t('repair_provider_details') : t('vendor_business_details')}</p>
            <p className="text-xs text-slate-500 flex items-center gap-1"><CheckCircle2 size={14} className="text-sky-600" /> {t('partner_review_notice')}</p>
            <input placeholder={t('business_name_placeholder')} value={form.businessName} onChange={update('businessName')} className="w-full border border-slate-300 rounded-lg px-3 py-2" required />
            <input placeholder={t('business_address_placeholder')} value={form.address} onChange={update('address')} className="w-full border border-slate-300 rounded-lg px-3 py-2" required />
            <div className="grid grid-cols-2 gap-4">
              <input placeholder={t('city_placeholder')} value={form.city} onChange={update('city')} className="w-full border border-slate-300 rounded-lg px-3 py-2" required />
              <input placeholder={t('state_placeholder')} value={form.state} onChange={update('state')} className="w-full border border-slate-300 rounded-lg px-3 py-2" required />
            </div>
            <input placeholder={t('service_area_placeholder')} value={form.serviceArea} onChange={update('serviceArea')} className="w-full border border-slate-300 rounded-lg px-3 py-2" required />
            <input placeholder={t('gst_placeholder')} value={form.gst} onChange={update('gst')} className="w-full border border-slate-300 rounded-lg px-3 py-2" />
          </div>
        )}

        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition mt-6 disabled:opacity-60">
          {loading ? t('creating_account') : t('register_button')}
        </button>

        <p className="text-sm text-center text-slate-600 mt-6">
          {t('already_have_account')} <Link to="/login" className="text-blue-700 font-medium hover:underline">{t('login_button')}</Link>
        </p>
      </form>
    </div>
  );
}