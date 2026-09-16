import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { generateRecommendation } from '../../services/api';
import { useTranslation } from 'react-i18next';

const connectionTypes = ['Residential', 'Commercial', 'Industrial', 'Agricultural'];
const futureUsageOptions = ['No major change', 'AC', 'EV', 'More appliances', 'Other'];
const housingTypes = ['Independent house', 'Apartment/Flat', 'Bungalow', 'Commercial building'];
const roofTypes = ['RCC/Concrete', 'Metal', 'Tiled', 'Other'];
const shadingOptions = ['Very little', 'Some shade', 'Significant shade', 'Not sure'];
const roofOwnershipOptions = ['I own this property', 'Rented/Leased', 'Housing society approval needed'];
const budgetOptions = ['Under ₹1.5 Lakh', '₹1.5–3 Lakh', '₹3–6 Lakh', '₹6 Lakh+', 'Not sure yet'];
const gridOptions = [
  { value: 'On-Grid', desc: 'Connected to the grid, no battery — lowest cost, no backup during outages' },
  { value: 'Off-Grid + Battery', desc: 'Independent with battery backup — higher cost, works during outages' },
  { value: 'Hybrid', desc: 'Grid-connected with battery backup — balance of cost and reliability' },
];
const timelineOptions = ['Within 1 month', '1–3 months', '3–6 months', 'Just exploring'];

const steps = ['Electricity Usage', 'Location & Rooftop', 'Financial & Goals', 'Review'];
const optionKeys = {
  Residential: 'residential',
  Commercial: 'commercial',
  Industrial: 'industrial',
  Agricultural: 'agricultural',
  'No major change': 'no_major_change',
  AC: 'air_conditioning',
  EV: 'electric_vehicle',
  'More appliances': 'more_appliances',
  Other: 'other',
  'Independent house': 'independent_house',
  'Apartment/Flat': 'apartment_flat',
  Bungalow: 'bungalow',
  'Commercial building': 'commercial_building',
  'RCC/Concrete': 'rcc_concrete',
  Metal: 'metal_roof',
  Tiled: 'tiled_roof',
  'Very little': 'very_little_shade',
  'Some shade': 'some_shade',
  'Significant shade': 'significant_shade',
  'Not sure': 'not_sure',
  'I own this property': 'own_property',
  'Rented/Leased': 'rented_leased',
  'Housing society approval needed': 'housing_society_approval',
  'Under ₹1.5 Lakh': 'budget_under_1_5_lakh',
  '₹1.5–3 Lakh': 'budget_1_5_to_3_lakh',
  '₹3–6 Lakh': 'budget_3_to_6_lakh',
  '₹6 Lakh+': 'budget_over_6_lakh',
  'Not sure yet': 'budget_not_sure',
  'On-Grid': 'on_grid',
  'Off-Grid + Battery': 'off_grid_battery',
  Hybrid: 'hybrid',
  'Within 1 month': 'within_one_month',
  '1–3 months': 'one_to_three_months',
  '3–6 months': 'three_to_six_months',
  'Just exploring': 'just_exploring',
};
const stepKeys = {
  'Electricity Usage': 'electricity_usage',
  'Location & Rooftop': 'location_rooftop',
  'Financial & Goals': 'financial_goals',
  Review: 'review',
};

export default function SolarPlanner() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const optionLabel = (value) => t(optionKeys[value] || value); // moved inside: needs access to t()
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    // Step 1
    consumption: '', bill: '', familySize: '', housingType: '',
    connectionType: 'Residential', acUnits: '', evOwnership: '',
    daytimeUsage: '', futureUsage: 'No major change',
    // Step 2
    pincode: '', address: '', roofArea: '', roofType: 'RCC/Concrete',
    roofShading: 'Very little', roofOwnership: '', roofAge: '',
    // Step 3
    budget: '', gridType: '', timeline: '', batteryBackup: '', state: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (e) => setData({ ...data, [field]: e.target.value });
  const selectPill = (field, value) => setData({ ...data, [field]: value });

  const validateStep = () => {
    const newErrors = {};
    if (step === 0) {
      if (!data.consumption || Number(data.consumption) <= 0) newErrors.consumption = t('valid_consumption_error');
      if (!data.bill || Number(data.bill) <= 0) newErrors.bill = t('valid_bill_error');
      if (!data.familySize || Number(data.familySize) <= 0) newErrors.familySize = t('family_size_error');
    }
    if (step === 1) {
      if (!data.pincode || data.pincode.length < 6) newErrors.pincode = t('valid_pin_error');
      if (!data.roofArea || Number(data.roofArea) <= 0) newErrors.roofArea = t('roof_area_error');
    }
    if (step === 2) {
      if (!data.budget) newErrors.budget = t('budget_error');
      if (!data.gridType) newErrors.gridType = t('connection_error');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) setStep((s) => Math.min(s + 1, steps.length - 1));
  };
  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    setErrors({});
    setSubmitting(true);

    const budget = data.budget === 'Under ₹1.5 Lakh'
      ? 150000
      : data.budget === '₹1.5–3 Lakh'
        ? 300000
        : data.budget === '₹3–6 Lakh'
          ? 600000
          : data.budget === '₹6 Lakh+'
            ? 1000000
            : 300000;

    const payload = {
      monthlyConsumption: Number(data.consumption),
      monthlyBill: Number(data.bill),
      roofArea: Number(data.roofArea),
      budget,
      state: data.state || 'Maharashtra',
      city: data.city || 'Amravati',
      userType: data.connectionType,
      battery: data.gridType === 'On-Grid' ? 'No' : 'Yes',
    };

    try {
      const recommendation = await generateRecommendation(payload);
      sessionStorage.setItem('latest_planner_input', JSON.stringify(data));
      sessionStorage.setItem('latest_recommendation', JSON.stringify(recommendation));
      navigate('/user/recommendation');
    } catch (error) {
      const message = error.response?.data?.detail || t('recommendation_error');
      setErrors({ submit: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${
              i < step ? 'bg-blue-900 text-white' : i === step ? 'bg-blue-900 text-white' : 'bg-slate-200 text-slate-500'
            }`}>
              {i < step ? <Check size={16} /> : String(i + 1).padStart(2, '0')}
            </div>
            <span className={`text-xs sm:text-sm hidden sm:inline ${i <= step ? 'text-blue-900 font-medium' : 'text-slate-400'}`}>{t(stepKeys[label])}</span>
            {i < steps.length - 1 && <div className="flex-1 h-px bg-slate-200" />}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">

        {/* STEP 1 — Electricity Usage */}
        {step === 0 && (
          <div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-blue-700 font-bold text-sm">01</span>
                <h2 className="text-2xl font-bold text-slate-900">{t('electricity_usage')}</h2>
              </div>
              <div className="bg-blue-50 text-blue-800 text-sm rounded-xl px-4 py-3 max-w-xs">
                {t('energy_profile_desc')}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('monthly_consumption_kwh')}</label>
                <input type="number" min="1" value={data.consumption} onChange={update('consumption')}
                  className={`w-full border rounded-xl px-4 py-3 ${errors.consumption ? 'border-red-400' : 'border-slate-300'}`} />
                {errors.consumption && <p className="text-red-600 text-xs mt-1">{errors.consumption}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('monthly_bill_rupees')}</label>
                <input type="number" min="1" value={data.bill} onChange={update('bill')}
                  className={`w-full border rounded-xl px-4 py-3 ${errors.bill ? 'border-red-400' : 'border-slate-300'}`} />
                {errors.bill && <p className="text-red-600 text-xs mt-1">{errors.bill}</p>}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('household_size')}</label>
                <input type="number" min="1" placeholder={t('example_four')} value={data.familySize} onChange={update('familySize')}
                  className={`w-full border rounded-xl px-4 py-3 ${errors.familySize ? 'border-red-400' : 'border-slate-300'}`} />
                {errors.familySize && <p className="text-red-600 text-xs mt-1">{errors.familySize}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('housing_type')}</label>
                <select value={data.housingType} onChange={update('housingType')} className="w-full border border-slate-300 rounded-xl px-4 py-3">
                  <option value="">{t('select_option')}</option>
                  {housingTypes.map((h) => <option key={h} value={h}>{optionLabel(h)}</option>)}
                </select>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-700 mb-2">{t('connection_type')}</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {connectionTypes.map((type) => (
                  <button key={type} type="button" onClick={() => selectPill('connectionType', type)}
                    className={`border rounded-xl px-4 py-3 text-sm font-medium transition ${
                      data.connectionType === type ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}>
                    {data.connectionType === type && '✓ '}{optionLabel(type)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('ac_units')}</label>
                <input type="number" min="0" placeholder={t('example_two')} value={data.acUnits} onChange={update('acUnits')}
                  className="w-full border border-slate-300 rounded-xl px-4 py-3" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('ev_ownership')}</label>
                <select value={data.evOwnership} onChange={update('evOwnership')} className="w-full border border-slate-300 rounded-xl px-4 py-3">
                  <option value="">{t('select_option')}</option>
                  <option value="Already own">{t('already_own_ev')}</option>
                  <option value="Planning">{t('planning_ev')}</option>
                  <option value="No">{t('no_ev_plans')}</option>
                </select>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('daytime_usage')}</label>
              <input type="text" placeholder={t('daytime_usage_example')} value={data.daytimeUsage} onChange={update('daytimeUsage')}
                className="w-full border border-slate-300 rounded-xl px-4 py-3" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">{t('future_usage')}</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {futureUsageOptions.map((opt) => (
                  <button key={opt} type="button" onClick={() => selectPill('futureUsage', opt)}
                    className={`border rounded-xl px-3 py-3 text-sm font-medium transition ${
                      data.futureUsage === opt ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}>
                    {data.futureUsage === opt && '✓ '}{optionLabel(opt)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 — Location & Rooftop */}
        {step === 1 && (
          <div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-blue-700 font-bold text-sm">02</span>
                <h2 className="text-2xl font-bold text-slate-900">{t('location_rooftop')}</h2>
              </div>
              <div className="bg-blue-50 text-blue-800 text-sm rounded-xl px-4 py-3 max-w-xs">
                {t('location_rooftop_desc')}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('pin_code')}</label>
                <input type="text" inputMode="numeric" maxLength={6} placeholder={t('pin_example')} value={data.pincode} onChange={update('pincode')}
                  className={`w-full border rounded-xl px-4 py-3 ${errors.pincode ? 'border-red-400' : 'border-slate-300'}`} />
                {errors.pincode && <p className="text-red-600 text-xs mt-1">{errors.pincode}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('address_area_optional')}</label>
                <input type="text" placeholder={t('address_example')} value={data.address} onChange={update('address')}
                  className="w-full border border-slate-300 rounded-xl px-4 py-3" />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('rooftop_area')}</label>
                <input type="number" min="1" value={data.roofArea} onChange={update('roofArea')}
                  className={`w-full border rounded-xl px-4 py-3 ${errors.roofArea ? 'border-red-400' : 'border-slate-300'}`} />
                {errors.roofArea && <p className="text-red-600 text-xs mt-1">{errors.roofArea}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('roof_type')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {roofTypes.map((type) => (
                    <button key={type} type="button" onClick={() => selectPill('roofType', type)}
                      className={`border rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                        data.roofType === type ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}>
                      {data.roofType === type && '✓ '}{optionLabel(type)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-700 mb-2">{t('roof_shading')}</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {shadingOptions.map((opt) => (
                  <button key={opt} type="button" onClick={() => selectPill('roofShading', opt)}
                    className={`border rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      data.roofShading === opt ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}>
                    {data.roofShading === opt && '✓ '}{optionLabel(opt)}
                  </button>
                ))}
              </div>
            </div>

            {/* NEW: ownership + roof age — both affect installation feasibility and approval time */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('roof_ownership')}</label>
                <select value={data.roofOwnership} onChange={update('roofOwnership')} className="w-full border border-slate-300 rounded-xl px-4 py-3">
                  <option value="">{t('select_option')}</option>
                  {roofOwnershipOptions.map((o) => <option key={o} value={o}>{optionLabel(o)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('roof_age')}</label>
                <input type="number" min="0" placeholder={t('roof_age_example')} value={data.roofAge} onChange={update('roofAge')}
                  className="w-full border border-slate-300 rounded-xl px-4 py-3" />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 — Financial & Goals */}
        {step === 2 && (
          <div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-blue-700 font-bold text-sm">03</span>
                <h2 className="text-2xl font-bold text-slate-900">{t('financial_goals')}</h2>
              </div>
              <div className="bg-blue-50 text-blue-800 text-sm rounded-xl px-4 py-3 max-w-xs">
                {t('financial_goals_desc')}
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-700 mb-2">{t('budget_preference')}</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {budgetOptions.map((opt) => (
                  <button key={opt} type="button" onClick={() => selectPill('budget', opt)}
                    className={`border rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      data.budget === opt ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}>
                    {data.budget === opt && '✓ '}{optionLabel(opt)}
                  </button>
                ))}
              </div>
              {errors.budget && <p className="text-red-600 text-xs mt-1">{errors.budget}</p>}
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-700 mb-2">{t('connection_type')}</label>
              <div className="space-y-2">
                {gridOptions.map((opt) => (
                  <button key={opt.value} type="button" onClick={() => selectPill('gridType', opt.value)}
                    className={`w-full text-left border rounded-xl px-4 py-3 transition ${
                      data.gridType === opt.value ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
                    }`}>
                    <p className={`font-medium text-sm ${data.gridType === opt.value ? 'text-blue-800' : 'text-slate-700'}`}>
                      {data.gridType === opt.value && '✓ '}{optionLabel(opt.value)}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{t(`grid_${optionKeys[opt.value]}_desc`)}</p>
                  </button>
                ))}
              </div>
              {errors.gridType && <p className="text-red-600 text-xs mt-1">{errors.gridType}</p>}
            </div>

            {/* NEW: timeline + state — timeline signals urgency, state drives subsidy lookup */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('installation_timeline')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {timelineOptions.map((opt) => (
                    <button key={opt} type="button" onClick={() => selectPill('timeline', opt)}
                      className={`border rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                        data.timeline === opt ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}>
                      {data.timeline === opt && '✓ '}{optionLabel(opt)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('state_subsidy_eligibility')}</label>
                <input type="text" placeholder={t('state_example')} value={data.state} onChange={update('state')}
                  className="w-full border border-slate-300 rounded-xl px-4 py-3" />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4 — Review */}
        {step === 3 && (
          <div>
            <div className="mb-6">
              <span className="text-blue-700 font-bold text-sm">04</span>
              <h2 className="text-2xl font-bold text-slate-900">{t('review_details')}</h2>
            </div>
            <div className="space-y-1 text-sm">
              {Object.entries(data).map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-slate-100 py-2">
                  <span className="text-slate-500 capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="font-medium text-slate-800">{v || t('not_available_dash')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        {errors.submit && <p className="mt-4 text-sm text-red-600">{errors.submit}</p>}
        <div className="flex justify-between items-center pt-6 mt-6 border-t border-slate-100">
          <button onClick={handleBack} disabled={step === 0}
            className="flex items-center gap-1 text-slate-500 font-medium hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed">
            <ArrowLeft size={16} /> {t('back')}
          </button>
          {step < steps.length - 1 ? (
            <button onClick={handleNext} className="flex items-center gap-2 bg-blue-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-800">
              {t('continue')} <ArrowRight size={16} />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting} className="flex items-center gap-2 bg-blue-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-800 disabled:opacity-60">
              {submitting ? t('generating') : t('generate_recommendation')} <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}