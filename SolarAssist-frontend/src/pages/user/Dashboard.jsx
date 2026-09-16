import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sun, Zap, DollarSign, TrendingUp, ArrowRight, ShieldCheck, 
  MapPin, CheckCircle2, Leaf, Clock, Sparkles, Building2, 
  FileSpreadsheet, PhoneCall, Wrench
} from 'lucide-react';
import KPICard from '../../components/common/KPICard';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';

export default function UserDashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    capacity_kw: 5.2,
    annual_gen_kwh: 7540,
    annual_savings: 56500,
    payback_years: 3.8,
    subsidy_inr: 78000
  });

  const userName = user?.full_name || 'Archita';

  return (
    <div className="space-y-8">
      {/* Solar Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950 via-slate-900 to-blue-900 text-white p-8 md:p-10 shadow-xl border border-blue-800/40">
        {/* Glowing Sun background element */}
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-sky-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-32 bottom-0 w-48 h-48 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-400/20 text-sky-100 border border-sky-300/30">
                <Sun size={14} className="text-sky-100" /> {t('live_irradiance')}: 5.8 kWh/m²/day
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-800/40 text-blue-200 border border-blue-700/50">
                <MapPin size={13} /> {user?.city || 'Nagpur'}, Maharashtra
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              {t('welcome_back')}, <span className="text-sky-100">{userName}</span>!
            </h1>
            <p className="text-blue-200/90 text-sm md:text-base mt-2 max-w-2xl leading-relaxed">
              {t('rooftop_optimized_for')} <strong className="text-sky-100 font-semibold">{stats.capacity_kw} kW {t('monocrystalline_solar_system')}</strong> {t('under_pm_scheme')}.
            </p>
          </div>

          <div className="shrink-0 bg-white/10 backdrop-blur-md border border-white/15 p-4 rounded-2xl flex flex-col gap-2 min-w-[220px]">
            <div className="text-xs text-blue-200 uppercase font-semibold tracking-wider">{t('pm_surya_ghar_subsidy')}</div>
            <div className="text-2xl font-black text-sky-100">₹{stats.subsidy_inr.toLocaleString('en-IN')}</div>
            <div className="text-[11px] text-emerald-300 font-medium flex items-center gap-1">
              <ShieldCheck size={14} /> {t('dbt_approved')}
            </div>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KPICard 
          label={t('recommended_system')} 
          value={`${stats.capacity_kw} kW`} 
          subtext={t('high_efficiency_panels')} 
          icon={Sun} 
          trend={t('optimal')}
        />
        <KPICard 
          label={t('annual_energy_output')} 
          value={`${stats.annual_gen_kwh.toLocaleString('en-IN')} kWh`} 
          subtext={t('monthly_electricity_coverage')} 
          icon={Zap} 
        />
        <KPICard 
          label={t('estimated_annual_savings')} 
          value={`₹${stats.annual_savings.toLocaleString('en-IN')}`} 
          subtext={t('electricity_tariff_basis')} 
          icon={DollarSign} 
          trend={t('save_percentage')}
        />
        <KPICard 
          label={t('payback_period')} 
          value={`${stats.payback_years} ${t('years')}`} 
          subtext={t('free_power_after_payback')} 
          icon={TrendingUp} 
        />
      </div>

      {/* Solar Installation Roadmap Tracker */}
      <div className="bg-white border border-blue-100/90 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="text-sky-600" size={20} /> {t('solar_installation_roadmap')}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{t('roadmap_desc')}</p>
          </div>
          <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            {t('roadmap_step_active')}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
          {[
            { step: '01', title: t('roof_mapping'), desc: t('irradiance_scan'), done: true },
            { step: '02', title: t('system_sizing'), desc: t('capacity_model'), done: true },
            { step: '03', title: t('vendor_quote'), desc: t('active_vendor_quote'), active: true },
            { step: '04', title: t('net_metering'), desc: t('discom_grid_sync'), upcoming: true },
            { step: '05', title: t('commissioning'), desc: t('subsidy_disbursal_live'), upcoming: true },
          ].map((item, idx) => (
            <div 
              key={idx} 
              className={`p-4 rounded-xl border transition-all ${
                item.done 
                  ? 'bg-emerald-50/60 border-emerald-200 text-slate-900' 
                  : item.active 
                  ? 'bg-blue-900 text-white border-blue-800 shadow-md ring-2 ring-blue-500/20' 
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-bold ${item.active ? 'text-sky-100' : item.done ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {item.step}
                </span>
                {item.done ? (
                  <CheckCircle2 size={16} className="text-emerald-600" />
                ) : item.active ? (
                  <Clock size={16} className="text-sky-200 animate-pulse" />
                ) : null}
              </div>
              <div className="font-semibold text-sm mb-1">{item.title}</div>
              <div className={`text-[11px] ${item.active ? 'text-blue-200' : 'text-slate-500'}`}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Action Hub & Active Quote Request */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Action Navigation */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-slate-900">{t('smart_tools')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link 
              to="/user/planner" 
              className="bg-white border border-blue-100 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-blue-300 transition group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:bg-amber-400 group-hover:text-slate-950 transition">
                  <Sun size={22} />
                </div>

                <h3 className="font-bold text-slate-900 group-hover:text-blue-900 transition">{t('solar_system_planner')}</h3>
                <p className="text-xs text-slate-500 mt-1">{t('planner_card_desc')}</p>
              </div>
              <div className="mt-4 text-xs font-semibold text-blue-700 flex items-center gap-1 group-hover:gap-2 transition-all">
                {t('open_planner')} <ArrowRight size={14} />
              </div>
            </Link>

            <Link 
              to="/user/recommendation" 
              className="bg-white border border-blue-100 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-blue-300 transition group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:bg-blue-600 group-hover:text-white transition">
                  <Sparkles size={22} />
                </div>
                <h3 className="font-bold text-slate-900 group-hover:text-blue-900 transition">{t('ai_recommendation')}</h3>
                <p className="text-xs text-slate-500 mt-1">{t('recommendation_card_desc')}</p>
              </div>
              <div className="mt-4 text-xs font-semibold text-blue-700 flex items-center gap-1 group-hover:gap-2 transition-all">
                {t('view_explanation')} <ArrowRight size={14} />
              </div>
            </Link>

            <Link 
              to="/user/financial" 
              className="bg-white border border-blue-100 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-blue-300 transition group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:bg-emerald-600 group-hover:text-white transition">
                  <DollarSign size={22} />
                </div>
                <h3 className="font-bold text-slate-900 group-hover:text-blue-900 transition">{t('roi_financial_model')}</h3>
                <p className="text-xs text-slate-500 mt-1">{t('financial_card_desc')}</p>
              </div>
              <div className="mt-4 text-xs font-semibold text-blue-700 flex items-center gap-1 group-hover:gap-2 transition-all">
                {t('explore_financials')} <ArrowRight size={14} />
              </div>
            </Link>

            <Link 
              to="/user/vendors" 
              className="bg-white border border-blue-100 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-blue-300 transition group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:bg-purple-600 group-hover:text-white transition">
                  <Building2 size={22} />
                </div>
                <h3 className="font-bold text-slate-900 group-hover:text-blue-900 transition">{t('verified_solar_vendors')}</h3>
                <p className="text-xs text-slate-500 mt-1">{t('vendors_card_desc')}</p>
              </div>
              <div className="mt-4 text-xs font-semibold text-blue-700 flex items-center gap-1 group-hover:gap-2 transition-all">
                {t('browse_installers')} <ArrowRight size={14} />
              </div>
            </Link>
          </div>
        </div>

        {/* Active Vendor Quotation Status */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">{t('active_vendor_quote_heading')}</h2>
          <div className="bg-white border border-blue-100 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {t('accepted_quote')}
                </span>
                <h3 className="font-bold text-slate-900 text-base mt-2">SunPower Solar Solutions</h3>
                <p className="text-xs text-slate-500">{t('tier_one_installer')}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <Building2 size={20} />
              </div>
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>{t('selected_system')}:</span>
                <strong className="text-slate-900">5.0 kW {t('on_grid_kit')}</strong>
              </div>
              <div className="flex justify-between">
                <span>{t('estimated_cost')}:</span>
                <strong className="text-slate-900">₹2,60,000</strong>
              </div>
              <div className="flex justify-between">
                <span>{t('subsidy_offset')}:</span>
                <strong className="text-emerald-700">- ₹78,000</strong>
              </div>
              <div className="flex justify-between font-bold text-slate-900 text-sm pt-1 border-t border-slate-100">
                <span>{t('net_out_of_pocket')}:</span>
                <span className="text-blue-900">₹1,82,000</span>
              </div>
            </div>

            <div className="bg-blue-50/80 rounded-xl p-3 text-xs text-blue-900 border border-blue-100">
              <div className="font-semibold flex items-center gap-1.5 mb-0.5">
                <PhoneCall size={14} className="text-blue-700" /> {t('vendor_contact')}
              </div>
              <div className="text-slate-700">+91 9823012345 • Rajesh Sharma</div>
            </div>

            <Link 
              to="/user/vendors" 
              className="w-full bg-slate-900 text-white py-2.5 rounded-xl text-xs font-semibold hover:bg-slate-800 transition flex items-center justify-center gap-1.5"
            >
              {t('view_full_quote')} <ArrowRight size={14} />
            </Link>
          </div>

          {/* Eco Impact Widget */}
          <div className="bg-gradient-to-br from-emerald-900 to-teal-950 text-white rounded-2xl p-6 shadow-md border border-emerald-800">
            <div className="flex items-center gap-2 text-emerald-300 font-semibold text-xs uppercase tracking-wider mb-2">
              <Leaf size={16} /> {t('environmental_impact')}
            </div>
            <div className="text-2xl font-black mb-1 text-emerald-200">6.2 {t('tons_co2_saved')}</div>
            <p className="text-xs text-emerald-100/80 leading-relaxed mb-4">
              {t('tree_equivalent_prefix')} <strong>340 {t('trees')}</strong> {t('tree_equivalent_suffix')}
            </p>
            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="bg-white/10 rounded-lg p-2">
                <div className="font-bold text-emerald-200">340</div>
                <div className="text-[10px] text-emerald-100">{t('trees_planted')}</div>
              </div>
              <div className="bg-white/10 rounded-lg p-2">
                <div className="font-bold text-emerald-200">188.5 MWh</div>
                <div className="text-[10px] text-emerald-100">{t('clean_power_25_years')}</div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-amber-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-xl bg-amber-50 text-amber-600"><Wrench size={22} /></div>
              <div>
                <h2 className="font-bold text-slate-900">{t('solar_panel_problem')}</h2>
                <p className="text-sm text-slate-500 mt-1">{t('repair_support_desc')}</p>
              </div>
            </div>
            <Link to="/user/existing-solar-support" className="shrink-0 bg-amber-500 text-slate-950 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-amber-400 transition flex items-center gap-2">
              {t('get_service_help')} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}