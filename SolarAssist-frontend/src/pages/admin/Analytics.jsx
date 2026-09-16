import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Store, Sun, MapPin, Zap, ShieldCheck } from 'lucide-react';
import { getAdminAnalytics } from '../../services/api';
import { mockAdminAnalytics } from '../../services/mockData';

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState(mockAdminAnalytics);

  useEffect(() => {
    async function load() {
      const data = await getAdminAnalytics();
      if (data) {
        setAnalytics(data);
      }
    }
    load();
  }, []);

  const summary = analytics.platform_summary || mockAdminAnalytics.platform_summary;
  const growth = analytics.monthly_user_growth || mockAdminAnalytics.monthly_user_growth;
  const regions = analytics.top_regions || mockAdminAnalytics.top_regions;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Platform Analytics & Global Reports</h1>
          <p className="text-slate-500 text-sm">System-wide reports covering user acquisition, vendor coverage, solar capacity, and regional demand.</p>
        </div>
        <div className="bg-blue-50 text-blue-800 border border-blue-200 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0">
          <ShieldCheck size={16} className="text-blue-600" /> Platform Wide Scoped
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Total Solar Plans Generated</div>
          <div className="text-2xl font-extrabold text-slate-900">{summary.total_quote_requests || 640}</div>
          <div className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <TrendingUp size={14} /> +32% demand month-over-month
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Recommended System Capacity</div>
          <div className="text-2xl font-extrabold text-amber-600">{(summary.total_capacity_recommended_kw || 14250).toLocaleString()} kW</div>
          <div className="text-xs text-slate-500 mt-1">Across residential & commercial users</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Total Active Vendors</div>
          <div className="text-2xl font-extrabold text-indigo-600">{summary.total_vendors || 85}</div>
          <div className="text-xs text-slate-500 mt-1">Onboarded & verified businesses</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Total CO2 Emission Offset</div>
          <div className="text-2xl font-extrabold text-emerald-600">{(summary.total_co2_reduced_tons || 1120.5).toLocaleString()} Tons</div>
          <div className="text-xs text-slate-500 mt-1">Environmental impact footprint</div>
        </div>
      </div>

      {/* User & Vendor Growth Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">User & Vendor Growth Trend</h2>
          <div className="space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-100">
            {growth.map((g) => {
              const maxUsers = 1500;
              const userPct = Math.round((g.users / maxUsers) * 100);
              return (
                <div key={g.month} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>{g.month}</span>
                    <span>{g.users} Users · {g.vendors} Vendors</span>
                  </div>
                  <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${userPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Regional Activity Table */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Top Regional Activity</h2>
          <div className="space-y-3">
            {regions.map((r) => (
              <div key={r.city} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-1">
                    <MapPin size={14} className="text-amber-500" /> {r.city}
                  </div>
                  <div className="text-xs text-slate-500">{r.vendors} Onboarded Vendors</div>
                </div>
                <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2.5 py-1 rounded-lg">
                  {r.requests} Plans
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
