import { useEffect, useState } from 'react';
import { CheckCircle2, Link2, Save, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getAccountProfile, linkGoogleAccount, updateAccountProfile } from '../services/api';

const emptyForm = { full_name: '', phone: '', city: '', state: '' };

export default function ProfileSettings() {
  const { t } = useTranslation();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [googleLinked, setGoogleLinked] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);

  useEffect(() => {
    getAccountProfile()
      .then((data) => {
        setForm({
          full_name: data.full_name || '',
          phone: data.phone || '',
          city: data.city || '',
          state: data.state || '',
        });
        setEmail(data.email || '');
        setGoogleLinked(Boolean(data.google_subject));
      })
      .catch(() => setError(t('could_not_load_profile')))
      .finally(() => setLoading(false));
  }, [t]);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return undefined;
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => setGoogleReady(true);
    document.head.appendChild(script);
    return () => document.head.removeChild(script);
  }, []);

  const handleGoogleLink = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!googleReady || !window.google?.accounts?.id) {
      setError(t('google_not_configured_error'));
      return;
    }
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async ({ credential }) => {
        try {
          await linkGoogleAccount(credential);
          setGoogleLinked(true);
          setError('');
        } catch (err) {
          setError(err.response?.data?.detail || t('could_not_link_google'));
        }
      },
    });
    window.google.accounts.id.prompt();
  };

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      await updateAccountProfile(form);
      setSaved(true);
    } catch {
      setError(t('could_not_save_profile'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-slate-500">{t('loading_profile')}</div>;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-sky-100 p-3 text-blue-700"><UserRound size={22} /></div>
          <div>
            <h1 className="text-2xl font-bold text-blue-900">{t('profile_settings_title')}</h1>
            <p className="text-sm text-slate-500">{t('profile_settings_desc')}</p>
          </div>
        </div>
      </div>
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
      {saved && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 flex items-center gap-2"><CheckCircle2 size={18} /> {t('profile_saved_db')}</div>}
      <form onSubmit={handleSubmit} className="bg-white border border-blue-100 rounded-2xl p-6 shadow-sm grid md:grid-cols-2 gap-4">
        <label className="text-sm font-medium text-slate-700">
          {t('full_name_label')}
          <input required value={form.full_name} onChange={update('full_name')} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 font-normal" />
        </label>
        <label className="text-sm font-medium text-slate-700">
          {t('email_label')}
          <input value={email} readOnly className="mt-1 w-full border border-slate-200 bg-slate-50 text-slate-500 rounded-lg px-3 py-2 font-normal" />
        </label>
        <label className="text-sm font-medium text-slate-700">
          {t('phone_label')}
          <input value={form.phone} onChange={update('phone')} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 font-normal" />
        </label>
        <label className="text-sm font-medium text-slate-700">
          {t('city_label')}
          <input value={form.city} onChange={update('city')} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 font-normal" />
        </label>
        <label className="text-sm font-medium text-slate-700">
          {t('state_label')}
          <input value={form.state} onChange={update('state')} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 font-normal" />
        </label>
        <div className="md:col-span-2 flex justify-end">
          <button disabled={saving} className="bg-blue-900 text-white px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50">
            <Save size={17} /> {saving ? t('saving') : t('save_profile_settings')}
          </button>
        </div>
      </form>
      <div className="bg-white border border-blue-100 rounded-2xl p-6 shadow-sm">
        <h2 className="font-bold text-blue-900 flex items-center gap-2"><Link2 size={18} /> {t('google_account_title')}</h2>
        <p className="text-sm text-slate-500 mt-1 mb-4">
          {googleLinked ? t('google_linked_desc') : t('google_not_linked_desc')}
        </p>
        {!googleLinked && <button type="button" onClick={handleGoogleLink} className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-semibold hover:bg-slate-50">{t('link_google_account')}</button>}
      </div>
    </div>
  );
}