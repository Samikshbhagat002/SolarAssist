import { useState, useEffect } from 'react';
import { User, Building, MapPin, FileText, Phone, Mail, CheckCircle2, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getVendorProfile, updateVendorProfile } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function VendorProfile() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [form, setForm] = useState({
    business_name: user?.business_name || 'GreenTech Solar Solutions',
    business_address: user?.business_address || '123 Solar Highway, Industrial Area',
    city: user?.city || 'Amravati',
    state: user?.state || 'Maharashtra',
    service_area: user?.service_area || 'Vidarbha Region & Nearby Districts',
    gst_id: user?.gst_id || '27AAAAA0000A1Z5',
    phone: user?.phone || '+91 9823012345',
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await getVendorProfile();
      if (data) {
        setForm({
          business_name: data.business_name || form.business_name,
          business_address: data.business_address || form.business_address,
          city: data.city || form.city,
          state: data.state || form.state,
          service_area: data.service_area || form.service_area,
          gst_id: data.gst_id || form.gst_id,
          phone: data.phone || form.phone,
        });
      }
    }
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateVendorProfile(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setSaved(false);
      window.alert(err.response?.data?.detail || t('could_not_save_business_profile'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('vendor_business_profile_settings')}</h1>
          <p className="text-slate-500 text-sm">{t('update_company_details')}</p>
        </div>
        <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5">
          <CheckCircle2 size={16} className="text-emerald-600" /> {t('account_verified')}
        </div>
      </div>

      {saved && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 size={18} className="text-emerald-600" /> {t('business_profile_updated_successfully')}
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">{t('registered_business_name')}</label>
              <input
                type="text"
                required
                value={form.business_name}
                onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">{t('gstin_business_registration_id')}</label>
              <input
                type="text"
                value={form.gst_id}
                onChange={(e) => setForm({ ...form, gst_id: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">{t('business_phone_number')}</label>
              <input
                type="text"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">{t('service_coverage_area')}</label>
              <input
                type="text"
                value={form.service_area}
                onChange={(e) => setForm({ ...form, service_area: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">{t('business_address')}</label>
              <input
                type="text"
                value={form.business_address}
                onChange={(e) => setForm({ ...form, business_address: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">{t('business_city')}</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">{t('business_state')}</label>
              <input
                type="text"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-6 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition disabled:opacity-50"
            >
              <Save size={18} /> {loading ? t('saving') : t('save_business_profile')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
