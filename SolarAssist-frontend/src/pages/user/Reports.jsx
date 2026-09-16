import { useMemo, useState } from 'react';
import { Download, FileText, Printer, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const readSession = (key) => {
  try {
    return JSON.parse(sessionStorage.getItem(key) || 'null');
  } catch {
    return null;
  }
};

const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

export default function Reports() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const input = readSession('latest_planner_input');
  const recommendation = readSession('latest_recommendation');
  const financial = readSession('latest_financial_analysis');
  const vendorRequest = readSession('latest_vendor_request');

  const report = useMemo(() => ({
    input,
    recommendation,
    financial,
    vendorRequest,
    generatedAt: new Date().toLocaleString(),
  }), [input, recommendation, financial, vendorRequest]);

  const reportHtml = () => `<!doctype html><html><head><meta charset="utf-8"><title>${t('solar_assist_report')}</title>
    <style>body{font-family:Arial,sans-serif;color:#17324d;max-width:850px;margin:32px auto;line-height:1.5}
    h1{color:#1261a0;border-bottom:3px solid #7dd3fc;padding-bottom:10px}h2{color:#1261a0;margin-top:28px}
    table{width:100%;border-collapse:collapse;margin:10px 0 20px}td{border:1px solid #cbe8f7;padding:9px}td:first-child{font-weight:bold;background:#effaff;width:35%}
    .muted{color:#5d7185}.notice{background:#effaff;border:1px solid #bae6fd;padding:12px;border-radius:8px}</style></head><body>
    <h1>${t('personalized_solar_report')}</h1><p class="muted">${t('generated')} ${report.generatedAt}</p>
    <div class="notice">${t('report_basis')}</div>
    ${table(t('your_inputs'), [
      [t('monthly_consumption'), input?.monthlyConsumption ? `${input.monthlyConsumption} kWh` : t('not_provided')],
      [t('monthly_bill'), input?.monthlyBill ? money(input.monthlyBill) : t('not_provided')],
      [t('roof_area'), input?.roofArea ? `${input.roofArea} sq. ft.` : t('not_provided')],
      [t('location'), [input?.city, input?.state].filter(Boolean).join(', ') || t('not_provided')],
      [t('battery'), input?.battery || t('not_provided')],
    ])}
    ${table(t('recommendation'), [
      [t('system_capacity'), recommendation?.capacity_kw ? `${recommendation.capacity_kw} kW` : t('not_available')],
      [t('annual_generation'), recommendation?.annual_generation_kwh ? `${recommendation.annual_generation_kwh} kWh` : t('not_available')],
      [t('panel_configuration'), recommendation?.panel_config || t('not_available')],
      [t('subsidy'), money(recommendation?.subsidy_inr)],
      [t('net_cost'), money(recommendation?.net_cost_inr)],
    ])}
    ${table(t('financial_analysis'), [
      [t('annual_savings'), money(financial?.annual_savings)],
      [t('payback_period'), financial?.payback_years ? `${financial.payback_years} ${t('years')}` : t('not_available')],
      [t('twenty_five_year_roi'), financial?.roi_25_year_percent ? `${financial.roi_25_year_percent}%` : t('not_available')],
      [t('twenty_five_year_net_savings'), money(financial?.net_25yr_savings)],
      [t('co2_reduction'), financial?.annual_co2_tons_offset ? `${financial.annual_co2_tons_offset} ${t('tons_per_year')}` : t('not_available')],
    ])}
    ${table(t('requested_vendor'), vendorRequest ? [
      [t('vendor'), vendorRequest.vendor?.business_name || vendorRequest.vendor?.name || vendorRequest.vendor?.full_name || t('not_available')],
      [t('contact'), vendorRequest.vendor?.phone || vendorRequest.vendor?.email || t('not_available')],
      [t('service_area'), vendorRequest.vendor?.service_area || t('not_available')],
      [t('requested_capacity'), `${vendorRequest.capacity || t('not_available')} kW`],
      [t('installation_location'), vendorRequest.location || t('not_provided')],
      [t('request_notes'), vendorRequest.notes || t('none')],
    ] : [[t('status'), t('no_vendor_quote')]])}
    </body></html>`;

  const table = (heading, rows) => `<h2>${heading}</h2><table>${rows.map(([key, value]) => `<tr><td>${key}</td><td>${value}</td></tr>`).join('')}</table>`;

  const download = () => {
    const blob = new Blob([reportHtml()], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `solarassist-report-${new Date().toISOString().slice(0, 10)}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const print = () => {
    const popup = window.open('', '_blank', 'noopener,noreferrer');
    if (!popup) return;
    popup.document.write(reportHtml());
    popup.document.close();
    popup.focus();
    popup.print();
  };

  const Section = ({ title, children }) => <section className="bg-white border border-sky-100 rounded-2xl p-5 shadow-sm"><h2 className="text-lg font-bold text-blue-900 mb-3">{title}</h2>{children}</section>;
  const Row = ({ label, value }) => <div className="flex justify-between gap-4 border-b border-sky-50 py-2 text-sm"><span className="text-slate-500">{label}</span><span className="font-semibold text-slate-800 text-right">{value || t('not_available_dash')}</span></div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-linear-to-r from-blue-700 via-sky-600 to-sky-500 text-white rounded-2xl p-6 flex flex-col md:flex-row justify-between gap-4">
        <div><div className="flex items-center gap-2 text-sky-100 text-xs font-bold uppercase"><FileText size={16} /> SolarAssist</div><h1 className="text-3xl font-extrabold mt-2">{t('solar_reports')}</h1><p className="text-white/90 text-sm mt-1">{t('report_intro')}</p></div>
        <div className="flex gap-2 items-start"><button onClick={() => setOpen(true)} className="bg-white text-blue-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"><FileText size={16} /> {t('open_report')}</button><button onClick={download} className="bg-sky-900/40 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"><Download size={16} /> {t('download_report')}</button></div>
      </div>
      {!recommendation ? <div className="bg-sky-50 border border-sky-200 text-blue-900 rounded-2xl p-5">{t('no_report')}</div> : <div className="grid md:grid-cols-2 gap-5">
        <Section title={t('input_details')}><Row label={t('monthly_consumption')} value={input?.monthlyConsumption && `${input.monthlyConsumption} kWh`} /><Row label={t('monthly_bill')} value={input?.monthlyBill && money(input.monthlyBill)} /><Row label={t('roof_area')} value={input?.roofArea && `${input.roofArea} sq. ft.`} /><Row label={t('location')} value={[input?.city, input?.state].filter(Boolean).join(', ')} /></Section>
        <Section title={t('recommendation_details')}><Row label={t('system_capacity')} value={recommendation.capacity_kw && `${recommendation.capacity_kw} kW`} /><Row label={t('annual_generation')} value={recommendation.annual_generation_kwh && `${recommendation.annual_generation_kwh} kWh`} /><Row label={t('subsidy')} value={money(recommendation.subsidy_inr)} /><Row label={t('net_cost')} value={money(recommendation.net_cost_inr)} /></Section>
        <Section title={t('financial_details')}><Row label={t('annual_savings')} value={money(financial?.annual_savings)} /><Row label={t('payback_period')} value={financial?.payback_years && `${financial.payback_years} ${t('years')}`} /><Row label={t('twenty_five_year_roi')} value={financial?.roi_25_year_percent && `${financial.roi_25_year_percent}%`} /></Section>
        <Section title={t('vendor_details')}>{vendorRequest ? <><Row label={t('vendor')} value={vendorRequest.vendor?.business_name || vendorRequest.vendor?.name} /><Row label={t('contact')} value={vendorRequest.vendor?.phone || vendorRequest.vendor?.email} /><Row label={t('service_area')} value={vendorRequest.vendor?.service_area} /><Row label={t('location')} value={vendorRequest.location} /><Row label={t('request_notes')} value={vendorRequest.notes} /></> : <p className="text-sm text-slate-500">{t('not_requested')}</p>}</Section>
      </div>}
      {open && <div className="fixed inset-0 z-50 bg-blue-950/40 flex items-center justify-center p-4"><div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl p-6"><div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold text-blue-900">{t('solar_reports')}</h2><div className="flex gap-2"><button onClick={print} className="text-blue-700 text-sm font-semibold flex items-center gap-1"><Printer size={16} /> {t('print_report')}</button><button onClick={() => setOpen(false)} className="text-slate-500" aria-label={t('close_button')}><X size={20} /></button></div></div><Section title={t('input_details')}><Row label={t('monthly_consumption')} value={input?.monthlyConsumption && `${input.monthlyConsumption} kWh`} /><Row label={t('monthly_bill')} value={input?.monthlyBill && money(input.monthlyBill)} /><Row label={t('roof_area')} value={input?.roofArea && `${input.roofArea} sq. ft.`} /><Row label={t('location')} value={[input?.city, input?.state].filter(Boolean).join(', ')} /></Section><div className="h-4" /><Section title={t('recommendation_details')}><Row label={t('system_capacity')} value={recommendation?.capacity_kw && `${recommendation.capacity_kw} kW`} /><Row label={t('annual_generation')} value={recommendation?.annual_generation_kwh && `${recommendation.annual_generation_kwh} kWh`} /><Row label={t('subsidy')} value={money(recommendation?.subsidy_inr)} /><Row label={t('net_cost')} value={money(recommendation?.net_cost_inr)} /></Section><div className="h-4" /><Section title={t('financial_details')}><Row label={t('annual_savings')} value={money(financial?.annual_savings)} /><Row label={t('payback_period')} value={financial?.payback_years && `${financial.payback_years} ${t('years')}`} /><Row label={t('twenty_five_year_roi')} value={financial?.roi_25_year_percent && `${financial.roi_25_year_percent}%`} /></Section><div className="h-4" /><Section title={t('vendor_details')}>{vendorRequest ? <><Row label={t('vendor')} value={vendorRequest.vendor?.business_name || vendorRequest.vendor?.name} /><Row label={t('contact')} value={vendorRequest.vendor?.phone || vendorRequest.vendor?.email} /><Row label={t('service_area')} value={vendorRequest.vendor?.service_area} /><Row label={t('location')} value={vendorRequest.location} /><Row label={t('request_notes')} value={vendorRequest.notes} /></> : <p className="text-sm text-slate-500">{t('not_requested')}</p>}</Section></div></div>}
    </div>
  );
}
