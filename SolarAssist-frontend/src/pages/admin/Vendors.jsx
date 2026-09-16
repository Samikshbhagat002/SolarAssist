import { useState, useEffect } from 'react';
import { Store, CheckCircle2, XCircle, Clock, Search, MapPin, Eye, Building, FileText } from 'lucide-react';
import { getAdminVendors, approveVendorAccount, rejectVendorAccount } from '../../services/api';
import { mockUsers } from '../../services/mockData';

export default function AdminVendors() {
  const [vendors, setVendors] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedVendor, setSelectedVendor] = useState(null);

  useEffect(() => {
    async function loadVendors() {
      const data = await getAdminVendors();
      if (data && data.length > 0) {
        setVendors(data);
      } else {
        const vendorList = mockUsers.filter(u => u.role === 'VENDOR').map(v => ({
          id: v.id,
          full_name: v.name,
          email: v.email,
          phone: v.phone,
          business_name: v.business_name || v.name,
          city: v.city || 'Amravati',
          state: v.state || 'Maharashtra',
          service_area: v.service_area || 'Vidarbha Region',
          gst_id: v.gst_id || '27AAAAA0000A1Z5',
          vendor_status: v.vendorStatus || 'PENDING',
          products_count: 5,
          requests_count: 14
        }));
        setVendors(vendorList);
      }
    }
    loadVendors();
  }, []);

  const handleApprove = async (vendorId) => {
    try {
      await approveVendorAccount(vendorId);
    } catch (e) {
      console.warn('API approve warning:', e);
    }
    setVendors(vendors.map(v => v.id === vendorId ? { ...v, vendor_status: 'APPROVED' } : v));
  };

  const handleReject = async (vendorId) => {
    try {
      await rejectVendorAccount(vendorId);
    } catch (e) {
      console.warn('API reject warning:', e);
    }
    setVendors(vendors.map(v => v.id === vendorId ? { ...v, vendor_status: 'REJECTED' } : v));
  };

  const filteredVendors = vendors.filter(v => {
    const matchSearch = (v.business_name || v.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
                        (v.email || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || v.vendor_status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vendor Management</h1>
          <p className="text-slate-500 text-sm">Approve or reject vendor onboarding requests, monitor activity, and inspect business GSTIN credentials.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search vendor or business..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none w-full sm:w-64"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Vendors Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-500">
              <th className="py-3.5 px-4">Business & Vendor Name</th>
              <th className="py-3.5 px-4">Location / Area</th>
              <th className="py-3.5 px-4">GSTIN</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Activity</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredVendors.map((v) => (
              <tr key={v.id} className="hover:bg-slate-50/80 transition">
                <td className="py-3.5 px-4">
                  <div className="font-bold text-slate-900">{v.business_name || v.full_name}</div>
                  <div className="text-xs text-slate-500">{v.email} • {v.phone || 'N/A'}</div>
                </td>
                <td className="py-3.5 px-4 text-slate-600 text-xs">
                  <div className="font-semibold text-slate-800">{v.city || 'Amravati'}, {v.state || 'MH'}</div>
                  <div className="text-slate-400">{v.service_area || 'Vidarbha'}</div>
                </td>
                <td className="py-3.5 px-4 font-mono text-xs text-slate-700">{v.gst_id || 'N/A'}</td>
                <td className="py-3.5 px-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                    v.vendor_status === 'APPROVED' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                    v.vendor_status === 'PENDING' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                    'bg-rose-50 text-rose-800 border-rose-200'
                  }`}>
                    {v.vendor_status}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-xs text-slate-600">
                  <div>{v.products_count || 0} Products Listed</div>
                  <div className="text-slate-400">{v.requests_count || 0} Requests Received</div>
                </td>
                <td className="py-3.5 px-4 text-right space-x-2">
                  <button
                    onClick={() => setSelectedVendor(v)}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                  >
                    <Eye size={15} />
                  </button>
                  {v.vendor_status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleApprove(v.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(v.id)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-lg"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {v.vendor_status === 'APPROVED' && (
                    <button
                      onClick={() => handleReject(v.id)}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-lg"
                    >
                      Suspend
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vendor Detail Modal */}
      {selectedVendor && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Vendor Account Details</h2>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase">Company Name</span>
                <div className="font-bold text-slate-900 text-base">{selectedVendor.business_name || selectedVendor.full_name}</div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400">Email:</span>
                  <div className="font-semibold text-slate-800">{selectedVendor.email}</div>
                </div>
                <div>
                  <span className="text-slate-400">Phone:</span>
                  <div className="font-semibold text-slate-800">{selectedVendor.phone || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-slate-400">GSTIN:</span>
                  <div className="font-mono font-semibold text-slate-800">{selectedVendor.gst_id || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-slate-400">Service Coverage:</span>
                  <div className="font-semibold text-slate-800">{selectedVendor.service_area || 'Vidarbha'}</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                onClick={() => setSelectedVendor(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
              >
                Close
              </button>
              {selectedVendor.vendor_status === 'PENDING' && (
                <button
                  onClick={() => { handleApprove(selectedVendor.id); setSelectedVendor(null); }}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
                >
                  Approve Vendor Account
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
