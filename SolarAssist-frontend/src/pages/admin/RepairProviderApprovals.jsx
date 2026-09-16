import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function RepairProviderApprovals() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/repair-providers/pending');
      setProviders(res.data);
    } catch {
      setProviders([]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const act = async (id, action) => {
    await api.post(`/admin/repair-providers/${id}/${action}`);
    load();
  };

  if (loading) return <p className="text-slate-500">Loading…</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-blue-900 mb-6">Repair Provider Approvals</h1>

      {providers.length === 0 && <p className="text-slate-500">No pending repair provider registrations.</p>}

      <div className="space-y-4">
        {providers.map((p) => (
          <div key={p.id} className="bg-white border border-blue-100 rounded-xl p-5 flex justify-between items-center">
            <div>
              <p className="font-semibold text-blue-900">{p.full_name}</p>
              <p className="text-sm text-slate-600">{p.specializations}</p>
              <p className="text-sm text-slate-500">{p.email}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => act(p.id, 'approve')} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">Approve</button>
              <button onClick={() => act(p.id, 'reject')} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700">Reject</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}