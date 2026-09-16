import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, CheckCircle2, Leaf } from 'lucide-react';
import { fetchFinancialAnalysis } from '../../services/api';
import { mockFinancials } from '../../services/mockData';
import { useTranslation } from 'react-i18next';

export default function FinancialAnalysis() {
  const { t } = useTranslation();
  const [financials, setFinancials] = useState(mockFinancials);
  const [capacity, setCapacity] = useState(3.5);
  const [plannerInput, setPlannerInput] = useState(null);

  useEffect(() => {
    const savedCap = sessionStorage.getItem('financial_capacity_kw');
    const capVal = savedCap ? parseFloat(savedCap) : 3.5;
    const savedInput = sessionStorage.getItem('latest_planner_input');
    const input = savedInput ? JSON.parse(savedInput) : null;
    setCapacity(capVal);
    setPlannerInput(input);

    async function loadData() {
      const data = await fetchFinancialAnalysis({
        capacity_kw: capVal,
        monthly_consumption_kwh: Number(input?.monthlyConsumption) || capVal * 120,
        monthly_bill_inr: Number(input?.monthlyBill) || capVal * 120 * 7.5
      });
      if (data) {
        setFinancials(data);
        sessionStorage.setItem('latest_financial_analysis', JSON.stringify(data));
      }
    }
    loadData();
  }, []);

  const grossCost = financials.gross_cost || (capacity * 52000);
  const subsidy = financials.subsidy || (capacity <= 2 ? capacity * 30000 : capacity <= 3 ? 60000 + (capacity - 2) * 18000 : 78000);
  const netCost = financials.net_cost || (grossCost - subsidy);
  const annualSavings = financials.annual_savings || Math.round(capacity * 1450 * 7.5);
  const paybackYears = financials.payback_years || Math.round((netCost / annualSavings) * 10) / 10;
  const net25yrSavings = financials.net_25yr_savings || 1191000;
  const roiPct = financials.roi_25_year_percent || 1145.2;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-sky-600 to-blue-500 p-6 rounded-2xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase font-extrabold tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full w-fit mb-2">
            {t('simple_financial_view')}
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-1">{t('financial_analysis_roi')}</h1>
          <p className="text-white/90 text-sm">{t('financial_analysis_desc')}</p>
        </div>

        <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 text-sm text-blue-900">
          <strong>{t('calculated_from_plan')}</strong> {plannerInput ? `${plannerInput.monthlyConsumption || '—'} kWh/month and ₹${Number(plannerInput.monthlyBill || 0).toLocaleString()} ${t('monthly_bill_suffix')}.` : t('no_saved_planner_input')}
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center shrink-0">
          <div className="text-xs text-slate-400 font-bold uppercase">{t('estimated_payback_period')}</div>
          <div className="text-3xl font-black text-amber-400">{paybackYears} {t('years')}</div>
          <div className="text-[11px] text-emerald-400 font-semibold mt-0.5">{t('free_electricity_thereafter')}</div>
        </div>
      </div>

      {/* Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">{t('gross_system_price')}</div>
          <div className="text-2xl font-extrabold text-slate-900">₹{grossCost.toLocaleString()}</div>
          <div className="text-xs text-slate-500 mt-1">{t('based_on_system_size', { capacity })}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">{t('pm_surya_ghar_subsidy')}</div>
          <div className="text-2xl font-extrabold text-emerald-600">₹{subsidy.toLocaleString()}</div>
          <div className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <CheckCircle2 size={13} /> {t('direct_bank_transfer')}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">{t('net_upfront_investment')}</div>
          <div className="text-2xl font-extrabold text-slate-900">₹{netCost.toLocaleString()}</div>
          <div className="text-xs text-slate-500 mt-1">{t('actual_out_of_pocket')}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">{t('twenty_five_year_roi')}</div>
          <div className="text-2xl font-extrabold text-indigo-600">{roiPct}%</div>
          <div className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <TrendingUp size={13} /> ₹{net25yrSavings.toLocaleString()} {t('cumulative_net_profit')}
          </div>
        </div>
      </div>

      {/* Monthly Bill Comparison & Carbon Impact */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bill Savings Comparison Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <DollarSign size={20} className="text-emerald-600" /> {t('monthly_bill_comparison')}
          </h2>

          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-rose-50 rounded-xl border border-rose-100">
              <div>
                <span className="text-xs font-bold uppercase text-rose-700">{t('before_solar_installation')}</span>
                <div className="text-xl font-bold text-rose-950">₹{(financials.monthly_bill_before || 3200).toLocaleString()} / month</div>
              </div>
              <span className="text-xs text-rose-600 font-semibold">{t('utility_grid_dependability')}</span>
            </div>

            <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <div>
                <span className="text-xs font-bold uppercase text-emerald-700">{t('after_solar_installation')}</span>
                <div className="text-xl font-bold text-emerald-950">₹{(financials.estimated_monthly_bill_after || 28).toLocaleString()} / month</div>
              </div>
              <span className="text-xs font-bold bg-emerald-600 text-white px-2.5 py-1 rounded-lg">
                {t('ninety_five_percent_savings')}
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600">
              <span className="font-bold text-slate-900">{t('estimated_annual_electricity_savings')}</span>
              <div className="text-lg font-extrabold text-emerald-600 mt-0.5">₹{annualSavings.toLocaleString()} / {t('year')}</div>
            </div>
          </div>
        </div>

        {/* Environmental Return Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Leaf size={20} className="text-emerald-500" /> {t('environmental_carbon_offset')}
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100 text-center">
              <span className="text-xs font-bold uppercase text-emerald-800">{t('co2_emissions_reduced')}</span>
              <div className="text-2xl font-black text-emerald-900 mt-1">{financials.annual_co2_tons_offset || 4.16} {t('tons')}</div>
              <div className="text-[11px] text-emerald-700 mt-0.5">{t('saved_from_thermal_grid')}</div>
            </div>

            <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-100 text-center">
              <span className="text-xs font-bold uppercase text-amber-800">{t('equivalent_trees_planted')}</span>
              <div className="text-2xl font-black text-amber-900 mt-1">{financials.trees_equivalent || 187} {t('trees')}</div>
              <div className="text-[11px] text-amber-700 mt-0.5">{t('ecological_impact_credit')}</div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600">
            <span className="font-bold text-slate-800">{t('grid_carbon_factor')}</span> {t('grid_carbon_factor_desc')}
          </div>
        </div>
      </div>

      {/* 25-Year Cumulative Savings Curve */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
          {t('twenty_five_year_savings_projection')}
        </h2>

        <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
          {(financials.projections || mockFinancials.projections).slice(0, 10).map((p) => {
            const maxVal = net25yrSavings;
            const pct = Math.max(0, Math.min(100, Math.round((p.net_balance / maxVal) * 100)));
            const isProfitable = p.net_balance > 0;
            return (
              <div key={p.year} className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>{p.year}</span>
                  <span className={isProfitable ? 'text-emerald-600' : 'text-slate-500'}>
                    {t('net_balance_yearly_savings', { netBalance: p.net_balance.toLocaleString(), yearlySavings: p.yearly_savings.toLocaleString() })}
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${isProfitable ? 'bg-emerald-500' : 'bg-slate-400'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
