import { useState, useEffect } from 'react';
import { Users, Store, CheckSquare, Sun, TrendingUp, ShieldAlert, ArrowUpRight } from 'lucide-react';
import KPICard from '../../components/common/KPICard';
import { getAdminDashboard } from '../../services/api';
import { mockAdminStats } from '../../services/mockData';

export default function AdminDashboard() {
  const [stats, setStats] = useState(mockAdminStats);

  useEffect(() => {
    async function load() {
      const data = await getAdminDashboard();
      if (data) {
        setStats({
          totalUsers: data.total_users || 1250,
          registeredVendors: data.registered_vendors || 85,
          pendingApprovals: data.pending_approvals || 12,
          plansGenerated: data.plans_generated || 2480,
        });
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 rounded-2xl text-white shadow-xl flex justify-between items-center border border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Platform Admin Dashboard</h1>
          <p className="text-slate-400 text-sm">System-wide monitoring, user controls, vendor approvals, and platform governance.</p>
        </div>
        <div className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse"></span> Platform Active
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Registered Users</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users size={20} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{stats.totalUsers.toLocaleString()}</div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <ArrowUpRight size={14} className="text-emerald-500" /> +24% this month
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Registered Vendors</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Store size={20} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{stats.registeredVendors}</div>
          <div className="text-xs text-slate-500 mt-1">Verified partner ecosystem</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Approvals</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <CheckSquare size={20} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-amber-600">{stats.pendingApprovals}</div>
          <div className="text-xs text-slate-500 mt-1">Vendors awaiting verification</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Plans Generated</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Sun size={20} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{stats.plansGenerated.toLocaleString()}</div>
          <div className="text-xs text-slate-500 mt-1">AI Recommendation runs</div>
        </div>
      </div>

      {/* Overview Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-2">Platform Activity Overview</h2>
          <p className="text-xs text-slate-500 mb-4">Summary of consumer traffic, solar plan creation, and vendor proposal matches.</p>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-sm font-semibold text-slate-700">Total System Capacity Recommended</span>
              <span className="text-sm font-bold text-slate-900">14.2 MW</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-sm font-semibold text-slate-700">Total Subsidies Claimed</span>
              <span className="text-sm font-bold text-amber-600">₹4.82 Crores</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-sm font-semibold text-slate-700">Estimated CO2 Reduction</span>
              <span className="text-sm font-bold text-emerald-600">1,120 Tons</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-2">System Governance & Health</h2>
          <p className="text-xs text-slate-500 mb-4">Role permissions and system operational status</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-200">
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Fast API Backend
              </div>
              <span className="text-xs font-semibold">Online (HTTP 200)</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 text-blue-900 rounded-xl border border-blue-200">
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span> ML Pipeline Engine
              </div>
              <span className="text-xs font-semibold">Loaded & Ready</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 text-slate-800 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span> Vendor Isolation Guard
              </div>
              <span className="text-xs font-semibold">Strict RBAC Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}