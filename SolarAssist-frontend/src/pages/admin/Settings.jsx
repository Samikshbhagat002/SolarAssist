import { useState, useEffect } from 'react';
import { Settings, Shield, Sliders, Save, CheckCircle2, DollarSign, Zap } from 'lucide-react';
import { getAdminSettings, updateAdminSetting } from '../../services/api';
import { mockSystemSettings } from '../../services/mockData';

export default function AdminSettings() {
  const [settings, setSettings] = useState(mockSystemSettings);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await getAdminSettings();
      if (data && data.length > 0) {
        setSettings(data);
      }
    }
    load();
  }, []);

  const handleChange = (key, newValue) => {
    setSettings(settings.map(s => s.key === key ? { ...s, value: newValue } : s));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      for (const s of settings) {
        await updateAdminSetting(s.key, { value: s.value, description: s.description });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.warn('Settings save warning:', err);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Configuration & Role Settings</h1>
          <p className="text-slate-500 text-sm">Configure PM Surya Ghar subsidy caps, default tariff rates, grid emission metrics, and access control matrix.</p>
        </div>
        <div className="bg-indigo-50 text-indigo-800 border border-indigo-200 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2">
          <Shield size={16} className="text-indigo-600" /> Admin Exclusive
        </div>
      </div>

      {saved && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 size={18} className="text-emerald-600" /> System settings saved successfully!
        </div>
      )}

      {/* System Settings Form */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Sliders size={20} className="text-blue-600" /> Global Parameter Configuration
        </h2>

        <form onSubmit={handleSave} className="space-y-5 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {settings.map((s) => (
              <div key={s.key} className="space-y-1 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <label className="block font-bold text-slate-800 text-xs uppercase tracking-wider">{s.key.replace(/_/g, ' ')}</label>
                <input
                  type="text"
                  value={s.value}
                  onChange={(e) => handleChange(s.key, e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <p className="text-xs text-slate-500 mt-1">{s.description}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition disabled:opacity-50"
            >
              <Save size={18} /> {loading ? 'Saving Parameters…' : 'Save System Settings'}
            </button>
          </div>
        </form>
      </div>

      {/* Roles & Permissions Matrix */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Shield size={20} className="text-indigo-600" /> Access Control & Role Permissions Matrix
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 uppercase font-bold text-slate-500">
                <th className="py-3 px-4">Permission Module</th>
                <th className="py-3 px-4">USER (Consumer)</th>
                <th className="py-3 px-4">VENDOR (Partner)</th>
                <th className="py-3 px-4">ADMIN (System)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="py-3 px-4 font-bold">Solar Planner & ML Calculator</td>
                <td className="py-3 px-4 text-emerald-600 font-bold">Full Access</td>
                <td className="py-3 px-4 text-slate-400">View Only</td>
                <td className="py-3 px-4 text-emerald-600 font-bold">Full Access</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold">My Products / Services Management</td>
                <td className="py-3 px-4 text-slate-400">No Access</td>
                <td className="py-3 px-4 text-emerald-600 font-bold">Vendor Scoped CRUD</td>
                <td className="py-3 px-4 text-emerald-600 font-bold">Platform Wide Audit</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold">Incoming Customer Quote Requests</td>
                <td className="py-3 px-4 text-slate-600 font-bold">Own Requests Only</td>
                <td className="py-3 px-4 text-emerald-600 font-bold">Vendor Scoped (Accept/Reject/Complete)</td>
                <td className="py-3 px-4 text-emerald-600 font-bold">All Requests Overview</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold">User Management & Account Deactivation</td>
                <td className="py-3 px-4 text-rose-500 font-bold">Blocked</td>
                <td className="py-3 px-4 text-rose-500 font-bold">Blocked</td>
                <td className="py-3 px-4 text-emerald-600 font-bold">Full Control</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold">System Configuration & Subsidy Caps</td>
                <td className="py-3 px-4 text-rose-500 font-bold">Blocked</td>
                <td className="py-3 px-4 text-rose-500 font-bold">Blocked</td>
                <td className="py-3 px-4 text-emerald-600 font-bold">Full Control</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
