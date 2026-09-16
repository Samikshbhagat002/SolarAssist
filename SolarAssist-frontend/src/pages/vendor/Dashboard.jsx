import { useState, useEffect } from 'react';
import { Package, ClipboardList, CheckCircle2, DollarSign, Clock, ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import KPICard from '../../components/common/KPICard';
import { getVendorDashboard } from '../../services/api';
import { mockVendorRequests } from '../../services/mockData';

const statusColor = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  ACCEPTED: 'bg-blue-100 text-blue-800 border-blue-200',
  COMPLETED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  REJECTED: 'bg-rose-100 text-rose-800 border-rose-200',
};

export default function VendorDashboard() {
  const { t } = useTranslation();
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    async function loadData() {
      const data = await getVendorDashboard();
      setDashboardData(data);
    }
    loadData();
  }, []);

  const requests = dashboardData?.recent_requests || mockVendorRequests;
  const kpi = dashboardData?.kpi || {
    total_requests: 24,
    pending_requests: 6,
    completed_requests: 14,
    estimated_earnings: 441000
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 p-6 rounded-2xl text-white shadow-xl flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">
            {t('welcome_back')}, <span className="text-amber-400">{dashboardData?.business_name || t('vendor_partner')}</span>
          </h1>
          <p className="text-slate-300 text-sm">
            {t('vendor_dashboard_intro')}
          </p>
        </div>
        <div className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          {t('account_status')}: {dashboardData?.vendor_status ? t(`status_${dashboardData.vendor_status.toLowerCase()}`, dashboardData.vendor_status) : t('status_approved')}
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('total_quote_requests')}</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ClipboardList size={20} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{kpi.total_requests}</div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <ArrowUpRight size={14} className="text-emerald-500" /> +14% {t('from_last_month')}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('pending_approvals')}</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock size={20} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-amber-600">{kpi.pending_requests}</div>
          <div className="text-xs text-slate-500 mt-1">{t('action_required_response')}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('completed_installations')}</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-600">{kpi.completed_requests}</div>
          <div className="text-xs text-slate-500 mt-1">{t('successfully_fulfilled_orders')}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('total_business_value')}</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">₹{kpi.estimated_earnings.toLocaleString()}</div>
          <div className="text-xs text-slate-500 mt-1">{t('fulfilled_project_revenue')}</div>
        </div>
      </div>

      {/* Recent Requests Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{t('incoming_customer_requests')}</h2>
            <p className="text-xs text-slate-500">{t('recent_quote_inquiries')}</p>
          </div>
          <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
            {t('vendor_isolated_data')}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-bold text-slate-500">
                <th className="py-3 px-4">{t('customer_name')}</th>
                <th className="py-3 px-4">{t('location')}</th>
                <th className="py-3 px-4">{t('capacity')}</th>
                <th className="py-3 px-4">{t('service')}</th>
                <th className="py-3 px-4">{t('date')}</th>
                <th className="py-3 px-4">{t('status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{r.customer}</td>
                  <td className="py-3.5 px-4 text-slate-600">{r.location}</td>
                  <td className="py-3.5 px-4 font-medium text-slate-900">{r.capacity}</td>
                  <td className="py-3.5 px-4 text-slate-600">{r.service}</td>
                  <td className="py-3.5 px-4 text-slate-500 text-xs">{r.date}</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${statusColor[r.status] || 'bg-slate-100 text-slate-700'}`}>
                      {t(`status_${r.status.toLowerCase()}`, r.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}