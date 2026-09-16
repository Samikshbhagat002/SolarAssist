import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, CheckCircle2, Award, ShieldCheck, DollarSign } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getVendorReports } from '../../services/api';
import { mockVendorReports } from '../../services/mockData';

export default function VendorReports() {
  const { t } = useTranslation();
  const [report, setReport] = useState(mockVendorReports);

  useEffect(() => {
    async function loadReports() {
      const data = await getVendorReports();
      if (data) {
        setReport(data);
      }
    }
    loadReports();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('vendor_reports_title')}</h1>
          <p className="text-slate-500 text-sm">{t('vendor_reports_desc')}</p>
        </div>
        <div className="bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0">
          <ShieldCheck size={16} className="text-amber-600" />
          {t('vendor_scoped_private')}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">{t('total_sales_revenue')}</div>
          <div className="text-2xl font-extrabold text-slate-900">₹{(report.total_sales_inr || 441000).toLocaleString()}</div>
          <div className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <TrendingUp size={14} /> +18.4% {t('growth_label')}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">{t('request_conversion_rate')}</div>
          <div className="text-2xl font-extrabold text-amber-600">{report.conversion_rate_pct || 75.0}%</div>
          <div className="text-xs text-slate-500 mt-1">{t('conversion_rate_desc')}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">{t('completed_projects')}</div>
          <div className="text-2xl font-extrabold text-emerald-600">{report.completed_projects_count || 8}</div>
          <div className="text-xs text-slate-500 mt-1">{t('installed_commissioned')}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">{t('customer_rating')}</div>
          <div className="text-2xl font-extrabold text-slate-900 flex items-center gap-1">
            4.8 <Award size={18} className="text-amber-500" />
          </div>
          <div className="text-xs text-slate-500 mt-1">{t('based_on_reviews', { count: 28 })}</div>
        </div>
      </div>

      {/* Monthly Sales Breakdown Chart / Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4">{t('monthly_revenue_breakdown')}</h2>

        {/* Bar Chart Visualization */}
        <div className="space-y-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
          {report.monthly_breakdown.map((m) => {
            const maxVal = 200000;
            const pct = Math.min(100, Math.round((m.sales / maxVal) * 100));
            return (
              <div key={m.month} className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>{m.month}</span>
                  <span>₹{m.sales.toLocaleString()} ({m.jobs} {t('projects_suffix')})</span>
                </div>
                <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
              <th className="py-3 px-4">{t('table_month')}</th>
              <th className="py-3 px-4">{t('table_completed_jobs')}</th>
              <th className="py-3 px-4">{t('table_gross_revenue')}</th>
              <th className="py-3 px-4">{t('table_avg_project_value')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {report.monthly_breakdown.map((m) => (
              <tr key={m.month} className="hover:bg-slate-50/80 transition">
                <td className="py-3 px-4 font-bold text-slate-800">{m.month}</td>
                <td className="py-3 px-4 text-slate-600">{m.jobs} {t('installations_suffix')}</td>
                <td className="py-3 px-4 font-bold text-slate-900">₹{m.sales.toLocaleString()}</td>
                <td className="py-3 px-4 text-slate-500 text-xs">₹{Math.round(m.sales / Math.max(m.jobs, 1)).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}