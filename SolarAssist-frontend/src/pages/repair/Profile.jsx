import { useEffect, useState } from 'react';
import { CheckCircle2, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getRepairProviderProfile, updateRepairProviderProfile } from '../../services/api';

const emptyForm = {
  business_name: '',
  business_address: '',
  city: '',
  state: '',
  service_area: '',
  gst_id: '',
  phone: '',
  specializations: '',
  years_experience: '',
};

export default function RepairProviderProfile() {
  const { t } = useTranslation();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getRepairProviderProfile()
      .then((data) => setForm((current) => ({ ...current, ...data })))
      .catch(() => setError(t('could_not_load_saved_profile')))
      .finally(() => setLoading(false));
  }, [t]);

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      await updateRepairProviderProfile(form);
      setSaved(true);
    } catch {
      setError(t('could_not_save_repair_profile'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-slate-500">{t('loading_profile')}</div>;

  const fields = [
    ['business_name', t('business_name_label')],
    ['phone', t('phone_label')],
    ['business_address', t('business_address_label')],
    ['service_area', t('service_area_label')],
    ['city', t('city_label')],
    ['state', t('state_label')],
    ['gst_id', t('gst_business_id_label')],
    ['years_experience', t('years_experience_label')],
  ];

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-blue-900 mb-2">{t('repair_profile_title')}</h1>
        <p className="text-sm text-slate-500">{t('repair_profile_desc')}</p>
      </div>
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
      {saved && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 flex items-center gap-2"><CheckCircle2 size={18} /> {t('profile_saved_db')}</div>}
      <form onSubmit={handleSave} className="bg-white border border-blue-100 rounded-2xl p-6 shadow-sm grid md:grid-cols-2 gap-4">
        {fields.map(([field, label]) => (
          <label key={field} className={field === 'business_address' ? 'md:col-span-2 text-sm font-medium text-slate-700' : 'text-sm font-medium text-slate-700'}>
            {label}
            <input value={form[field] || ''} onChange={update(field)} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 font-normal" />
          </label>
        ))}
        <label className="md:col-span-2 text-sm font-medium text-slate-700">
          {t('specializations_label')}
          <textarea value={form.specializations || ''} onChange={update('specializations')} rows={3} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 font-normal" />
        </label>
        <div className="md:col-span-2 flex justify-end">
          <button disabled={saving} className="bg-blue-900 text-white px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50"><Save size={17} /> {saving ? t('saving') : t('save_profile_button')}</button>
        </div>
      </form>
    </div>
  );
}