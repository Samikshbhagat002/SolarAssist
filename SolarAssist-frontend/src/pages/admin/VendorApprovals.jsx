import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Clock, ShieldCheck } from 'lucide-react';
import api from '../../services/api';
import { mockUsers } from '../../services/mockData';

export default function VendorApprovals() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/vendors/pending');
      if (res.data && res.data.length > 0) {
        setVendors(res.data);
      } else {
        const pending = mockUsers.filter(u => u.role === 'VENDOR' && u.vendorStatus === 'PENDING').map(v => ({
          id: v.id,
          business_name: v.business_name || v.name,
          full_name: v.name,
          city: v.city || 'Nagpur',
          state: v.state || 'Maharashtra',
          email: v.email,
          gst_id: v.gst_id || '27BBBBB1111B2Z4',
          service_area: v.service_area || 'Nagpur District'
        }));
        setVendors(pending);
      }
    } catch {
      const pending = mockUsers.filter(u => u.role === 'VENDOR' && u.vendorStatus === 'PENDING').map(v => ({
        id: v.id,
        business_name: v.business_name || v.name,
        full_name: v.name,
        city: v.city || 'Nagpur',
        state: v.state || 'Maharashtra',
        email: v.email,
        gst_id: v.gst_id || '27BBBBB1111B2Z4',
        service_area: v.service_area || 'Nagpur District'
      }));
      setVendors(pending);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const act = async (id, action) => {
    try {
      await api.post(`/admin/vendors/${id}/${action}`);
    } catch (e) {
      console.warn('API action warning:', e);
    }
    setVendors(vendors.filter(v => v.id !== id));
  };

  if (loading) return <div className="p-8 text-slate-500">Loading pending vendor requests…</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pending Vendor Approvals</h1>
          <p className="text-slate-500 text-sm">Review vendor onboarding submissions, GSTIN verification, and grant platform access.</p>
        </div>
        <div className="bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2">
          <Clock size={16} className="text-amber-600" /> {vendors.length} Pending
        </div>
      </div>

      {vendors.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 font-medium">
          <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2" />
          No pending vendor onboarding registrations. All applications processed!
        </div>
      )}

      <div className="space-y-4">
        {vendors.map((v) => (
          <div key={v.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="px-2.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-[11px] font-bold uppercase mb-1 inline-block">
                Pending Verification
              </span>
              <h3 className="font-bold text-slate-900 text-lg">{v.business_name}</h3>
              <p className="text-xs text-slate-600">{v.full_name} · {v.email}</p>
              <div className="text-xs text-slate-500 mt-1 flex gap-3">
                <span>Location: {v.city}, {v.state}</span>
                <span>GSTIN: {v.gst_id || 'Pending Audit'}</span>
              </div>
            </div>

            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => act(v.id, 'approve')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition shadow-sm"
              >
                Approve Account
              </button>
              <button
                onClick={() => act(v.id, 'reject')}
                className="bg-rose-50 hover:bg-rose-100 text-rose-600 px-4 py-2 rounded-xl text-xs font-bold transition border border-rose-200"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}