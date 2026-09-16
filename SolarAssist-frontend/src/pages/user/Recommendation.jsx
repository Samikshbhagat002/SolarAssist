import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BadgeDollarSign, BatteryCharging, CheckCircle2, Leaf, MapPin, SunMedium, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Recommendation() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [inputs, setInputs] = useState(null);
  const [quoteRequested, setQuoteRequested] = useState(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('latest_recommendation');
    if (stored) {
      try {
        setData(JSON.parse(stored));
      } catch (error) {
        console.warn('Error parsing recommendation data:', error);
      }
    }

    const storedInputs = sessionStorage.getItem('latest_planner_input');
    if (storedInputs) {
      try {
        setInputs(JSON.parse(storedInputs));
      } catch (error) {
        console.warn('Error parsing planner input:', error);
      }
    }
  }, []);

  const handleRequestQuote = (vendorName) => {
    setQuoteRequested(vendorName);
    setTimeout(() => setQuoteRequested(null), 4000);
  };

  if (!data) {
    return (
      <div className="max-w-3xl mx-auto rounded-3xl border border-sky-100 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100 text-blue-700">
          <SunMedium size={28} />
        </div>
        <h1 className="text-3xl font-black text-slate-900">{t('solar_plan_waiting')}</h1>
        <p className="mt-3 text-slate-600">
          {t('complete_planner_desc')}
        </p>
        <button
          type="button"
          onClick={() => navigate('/user/planner')}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-800"
        >
          {t('go_to_solar_planner')}
          <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  const annualSavings = Number(data.annual_savings_inr ?? data.annual_savings ?? 0);
  const systemCost = Number(data.net_cost_inr ?? data.gross_cost_inr ?? data.gross_cost ?? 0);
  const paybackYears = Number(data.payback_years ?? 0);
  const roi = Number(data.roi_25_year_percent ?? 0);
  const capacity = Number(data.capacity_kw ?? data.recommended_capacity_kw ?? 0);
  const generation = Number(data.annual_generation_kwh ?? 0);
  const monthlyGeneration = Number(data.monthly_generation_kwh ?? 0);

  const summaryCards = [
    { label: t('recommended_capacity'), value: `${capacity.toFixed(capacity % 1 === 0 ? 0 : 1)} kW`, detail: t('usage_roof_area_basis'), icon: SunMedium },
    { label: t('estimated_generation'), value: `${generation.toLocaleString()} kWh/yr`, detail: `~${monthlyGeneration.toLocaleString()} kWh/month`, icon: TrendingUp },
    { label: t('estimated_annual_savings'), value: `₹${annualSavings.toLocaleString()}`, detail: t('projected_utility_savings'), icon: BadgeDollarSign },
    { label: t('estimated_system_cost'), value: `₹${systemCost.toLocaleString()}`, detail: t('after_subsidy_estimate'), icon: BatteryCharging },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="rounded-3xl bg-gradient-to-r from-sky-600 via-blue-600 to-sky-500 p-6 text-white shadow-xl md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 inline-flex rounded-full border border-white/20 bg-slate-950/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-sky-100">
              {t('solar_plan_summary')}
            </div>
            <h1 className="text-3xl font-black">{t('custom_solar_recommendation')}</h1>
            <p className="mt-2 max-w-2xl text-sm text-sky-100">
              {t('recommendation_review_desc')}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              sessionStorage.setItem('financial_capacity_kw', String(capacity || 3));
              navigate('/user/financial');
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-800 shadow-lg transition hover:bg-sky-50"
          >
            {t('view_financial_analysis')}
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      {quoteRequested && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
          <span className="inline-flex items-center gap-2"><CheckCircle2 size={18} className="text-emerald-600" /> {t('quote_request_sent', { vendor: quoteRequested })}</span>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map(({ label, value, detail, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-blue-700">
              <Icon size={18} />
            </div>
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">{label}</div>
            <div className="mt-2 text-3xl font-black text-slate-900">{value}</div>
            <div className="mt-1 text-xs text-slate-500">{detail}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700"><SunMedium size={18} /></div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{t('recommended_system_details')}</h2>
              <p className="text-xs text-slate-500">{t('design_performance_assumptions')}</p>
            </div>
          </div>

          <div className="space-y-3">
            <InfoRow label={t('recommended_system_type')} value={data.battery_spec && !String(data.battery_spec).includes('No Battery') ? t('hybrid_battery_backed') : t('grid_tied')} />
            <InfoRow label={t('panel_configuration')} value={data.panel_config || t('panel_config_missing')} />
            <InfoRow label={t('battery_storage')} value={data.battery_spec || t('no_storage_requested')} />
            <InfoRow label={t('payback_period')} value={`${paybackYears ? paybackYears.toFixed(1) : t('not_available')} ${t('years')}`} />
            <InfoRow label={t('estimated_roi')} value={roi ? `${roi.toFixed(1)}%` : t('not_available')} />
            <InfoRow label={t('environmental_impact')} value={data.annual_co2_tons_offset ? `${data.annual_co2_tons_offset} ${t('tons_co2_per_year')}` : t('not_available')} />
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700"><Leaf size={18} /></div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{t('profile_summary')}</h2>
              <p className="text-xs text-slate-500">{t('recommendation_input_factors')}</p>
            </div>
          </div>

          <div className="space-y-3">
            <InfoRow label={t('monthly_consumption')} value={inputs?.monthlyConsumption ? `${inputs.monthlyConsumption} kWh` : t('not_specified')} />
            <InfoRow label={t('monthly_bill')} value={inputs?.monthlyBill ? `₹${Number(inputs.monthlyBill).toLocaleString()}` : t('not_specified')} />
            <InfoRow label={t('roof_area')} value={inputs?.roofArea ? `${inputs.roofArea} sq.ft` : t('not_specified')} />
            <InfoRow label={t('roof_type')} value={inputs?.roofType || t('not_specified')} />
            <InfoRow label={t('backup_priority')} value={inputs?.backupImportance || t('not_specified')} />
            <InfoRow label={t('location')} value={inputs ? [inputs.city, inputs.state, inputs.pincode].filter(Boolean).join(', ') || t('not_specified') : t('not_specified')} />
          </div>
        </div>
      </div>

      {data.matched_vendors && data.matched_vendors.length > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{t('recommended_local_vendors')}</h2>
              <p className="text-xs text-slate-500">{t('local_vendor_desc')}</p>
            </div>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">
              {t('verified')}
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {data.matched_vendors.map((vendor) => (
              <div key={vendor.id} className="rounded-2xl border border-sky-100 bg-sky-50/40 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{vendor.name}</h3>
                    <div className="mt-1 flex items-center gap-1 text-xs text-slate-500"><MapPin size={13} className="text-slate-400" /> {vendor.city || t('local_area')} • {t('service_area')}: {vendor.service_area || t('regional')}</div>
                  </div>
                  <div className="rounded-md bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">{vendor.rating || '4.8'} ★</div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3">
                  <span className="text-xs font-semibold text-slate-600">{vendor.phone || t('contact_not_available')}</span>
                  <button
                    type="button"
                    onClick={() => handleRequestQuote(vendor.name)}
                    className="rounded-xl bg-blue-700 px-4 py-2 text-xs font-bold text-white hover:bg-blue-800"
                  >
                    {t('request_quote')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
      <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{label}</span>
      <span className="max-w-[60%] text-right text-sm font-semibold text-slate-800">{value}</span>
    </div>
  );
}
