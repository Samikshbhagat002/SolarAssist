import { useEffect, useState } from 'react';
import { Search, Wrench } from 'lucide-react';
import { getAdminRepairProviders, approveRepairProvider, rejectRepairProvider } from '../../services/api';

export default function RepairProviders() {
  const [providers, setProviders] = useState([]);
  const [search, setSearch] = useState('');

  const load = async () => setProviders((await getAdminRepairProviders()) || []);
  useEffect(() => { load(); }, []);

  const updateStatus = async (id, action) => {
    await (action === 'approve' ? approveRepairProvider(id) : rejectRepairProvider(id));
    await load();
  };

  const visible = providers.filter((provider) =>
    `${provider.business_name} ${provider.full_name} ${provider.email}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <header className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-slate-900">Repair Provider Management</h1><p className="text-sm text-slate-500">Manage registered repair and maintenance providers separately from solar vendors.</p></div>
        <div className="relative"><Search size={17} className="absolute left-3 top-3 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search providers..." className="pl-9 pr-3 py-2 border rounded-xl text-sm" /></div>
      </header>
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {visible.length === 0 ? <p className="p-10 text-center text-slate-500">No repair providers found.</p> : (
          <table className="w-full text-sm text-left"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">Provider</th><th className="p-4">Location</th><th className="p-4">Specializations</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th></tr></thead>
            <tbody className="divide-y">{visible.map((provider) => <tr key={provider.id}><td className="p-4"><b>{provider.business_name}</b><div className="text-xs text-slate-500">{provider.full_name} · {provider.email}</div></td><td className="p-4 text-xs">{provider.city || 'N/A'}, {provider.state || 'N/A'}</td><td className="p-4 text-xs">{provider.specializations || 'Repair & maintenance'}</td><td className="p-4"><span className="px-2 py-1 rounded-full text-xs font-bold bg-slate-100">{provider.vendor_status}</span></td><td className="p-4 text-right">{provider.vendor_status === 'PENDING' && <><button onClick={() => updateStatus(provider.id, 'approve')} className="mr-2 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold">Approve</button><button onClick={() => updateStatus(provider.id, 'reject')} className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold">Reject</button></>}</td></tr>)}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}
