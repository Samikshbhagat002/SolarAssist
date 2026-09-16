import { useEffect, useState } from 'react';
import { CheckCircle2, MapPin, MessageCircle, Send, ShieldCheck, Wrench } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  createServiceRequest,
  getServiceProviders,
  getUserServiceMessages,
  getUserServiceRequests,
  sendUserServiceMessage,
} from '../../services/api';

function readPlannerLocation() {
  try {
    return JSON.parse(sessionStorage.getItem('latest_planner_input') || '{}');
  } catch {
    return {};
  }
}

export default function ExistingSolarSupport() {
  const { t } = useTranslation();
  const location = readPlannerLocation();
  const [providers, setProviders] = useState([]);
  const [providerId, setProviderId] = useState('');
  const [form, setForm] = useState({ issue: '', urgency: 'Normal', description: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const [requests, setRequests] = useState([]);
  const [activeRequest, setActiveRequest] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [messageError, setMessageError] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    getServiceProviders()
      .then((data) => setProviders(data || []))
      .catch(() => setError(t('could_not_load_providers')))
      .finally(() => setLoading(false));
  }, [t]);

  useEffect(() => {
    getUserServiceRequests()
      .then((data) => {
        const repairRequests = (data || []).filter((request) => request.service_type === 'REPAIR_REQUEST');
        setRequests(repairRequests);
        if (repairRequests.length) setActiveRequest(repairRequests[0]);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!activeRequest) {
      setMessages([]);
      return undefined;
    }
    getUserServiceMessages(activeRequest.id)
      .then((data) => setMessages(data || []))
      .catch(() => setMessageError(t('could_not_load_repair_conversation')));
    return undefined;
  }, [activeRequest, t]);

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const request = await createServiceRequest({
        vendor_id: Number(providerId),
        service_type: 'REPAIR_REQUEST',
        city: location.city || 'Not specified',
        state: location.state || null,
        address: [location.city, location.state, location.pincode].filter(Boolean).join(', '),
        description: `Issue: ${form.issue}\nUrgency: ${form.urgency}\n${form.description}`,
      });
      setSubmitted(request);
      setRequests((current) => [request, ...current.filter((item) => item.id !== request.id)]);
      setActiveRequest(request);
    } catch (requestError) {
      setError(requestError.response?.data?.detail || t('could_not_submit_repair_request'));
    } finally {
      setSubmitting(false);
    }
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    const text = messageText.trim();
    if (!text || !activeRequest) return;
    setMessageError('');
    try {
      const message = await sendUserServiceMessage(activeRequest.id, text);
      setMessages((current) => [...current, message]);
      setMessageText('');
    } catch {
      setMessageError(t('could_not_send_repair_message'));
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-700"><ShieldCheck size={16} /> {t('choose_provider_label')}</div>
        <h1 className="text-2xl font-bold text-blue-900 mt-2">{t('existing_solar_support_title')}</h1>
        <p className="text-slate-600 mt-1">{t('existing_solar_support_desc')}</p>
      </div>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}

      {submitted && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 flex items-center gap-2"><CheckCircle2 size={20} /> {t('repair_request_sent')}</div>}

      <div className="grid gap-4 md:grid-cols-2">
        {loading && <p className="text-slate-500">{t('loading_providers')}</p>}
        {!loading && providers.length === 0 && <p className="text-slate-500">{t('no_providers_available')}</p>}
        {providers.map((provider) => (
          <button key={provider.id} type="button" onClick={() => setProviderId(String(provider.id))} className={`text-left rounded-2xl border p-5 transition ${providerId === String(provider.id) ? 'border-blue-700 bg-blue-50 ring-2 ring-blue-200' : 'border-slate-200 bg-white hover:border-blue-300'}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3"><Wrench className="text-blue-700" size={22} /><div><h2 className="font-bold text-slate-900">{provider.business_name || provider.full_name}</h2><p className="text-xs text-slate-500">{provider.full_name}</p></div></div>
              {providerId === String(provider.id) && <CheckCircle2 className="text-blue-700" size={20} />}
            </div>
            <div className="mt-4 space-y-1 text-xs text-slate-600"><p><MapPin size={13} className="inline mr-1 text-blue-600" />{provider.city || t('service_area_unavailable')}, {provider.state || ''}</p><p>{provider.service_area || t('default_repair_service_desc')}</p><p>{provider.specializations || t('default_specialization_desc')}</p></div>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-blue-100 rounded-2xl p-6 space-y-4">
        <h2 className="font-bold text-blue-900">{t('describe_issue')}</h2>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t('issue_type_label')}</label>
          <select value={form.issue} onChange={update('issue')} className="w-full border border-slate-300 rounded-lg px-3 py-2" required>
            <option value="">{t('select_issue')}</option>
            <option>{t('issue_low_power')}</option>
            <option>{t('issue_inverter_fault')}</option>
            <option>{t('issue_panel_damage')}</option>
            <option>{t('issue_battery')}</option>
            <option>{t('issue_wiring')}</option>
            <option>{t('issue_other')}</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t('urgency_label')}</label>
          <select value={form.urgency} onChange={update('urgency')} className="w-full border border-slate-300 rounded-lg px-3 py-2">
            <option>{t('urgency_normal')}</option>
            <option>{t('urgency_urgent')}</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t('describe_problem_label')}</label>
          <textarea value={form.description} onChange={update('description')} rows={4} className="w-full border border-slate-300 rounded-lg px-3 py-2" placeholder={t('describe_problem_placeholder')} required />
        </div>
        <button disabled={!providerId || submitting} type="submit" className="w-full bg-blue-900 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-800 disabled:opacity-50">
          {submitting ? t('sending_request') : providerId ? t('submit_repair_request') : t('choose_provider_first')}
        </button>
      </form>

      {requests.length > 0 && (
        <section className="bg-white border border-blue-100 rounded-2xl p-6">
          <h2 className="font-bold text-blue-900 flex items-center gap-2"><MessageCircle size={18} /> {t('your_repair_conversations')}</h2>
          <div className="flex flex-wrap gap-2 mt-3">
            {requests.map((request) => (
              <button key={request.id} type="button" onClick={() => { setActiveRequest(request); setSubmitted(null); }} className={`rounded-xl border px-3 py-2 text-left text-xs ${activeRequest?.id === request.id ? 'border-blue-700 bg-blue-50 text-blue-900' : 'border-slate-200'}`}>
                {t('request_hash_status', { id: request.id, status: request.status })}
              </button>
            ))}
          </div>
          {activeRequest && (
            <div className="mt-5 border-t pt-4">
              <p className="text-sm font-semibold text-slate-800">{t('chat_with_selected_provider')}</p>
              <div className="mt-3 min-h-28 max-h-64 overflow-y-auto rounded-xl bg-slate-50 p-3 space-y-2">
                {messages.map((message) => <div key={message.id} className="max-w-[85%] rounded-xl bg-white border px-3 py-2 text-sm text-slate-700">{message.message}</div>)}
                {!messages.length && <p className="text-xs text-slate-500 text-center py-6">{t('no_repair_messages')}</p>}
              </div>
              {messageError && <p className="text-xs text-rose-600 mt-2">{messageError}</p>}
              <form onSubmit={sendMessage} className="mt-3 flex gap-2">
                <input value={messageText} onChange={(event) => setMessageText(event.target.value)} placeholder={t('repair_message_placeholder')} className="flex-1 border rounded-xl px-3 py-2 text-sm" />
                <button type="submit" className="bg-blue-900 text-white rounded-xl px-4"><Send size={16} /></button>
              </form>
            </div>
          )}
        </section>
      )}
    </div>
  );
}