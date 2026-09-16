import { useState, useEffect } from 'react';
import { Store, MapPin, Phone, Award, CheckCircle2, Search, ArrowRight, ShieldCheck, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { createServiceRequest, getUserServiceMessages, sendUserServiceMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

function readStoredObject(key) {
  try {
    return JSON.parse(sessionStorage.getItem(key) || '{}');
  } catch {
    return {};
  }
}

export default function UserVendors() {

  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [quoteSuccess, setQuoteSuccess] = useState(false);
  const [plannerInput] = useState(() => readStoredObject('latest_planner_input'));
  const [recommendation] = useState(() => readStoredObject('latest_recommendation'));
  const [chatVendor, setChatVendor] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatRequest, setChatRequest] = useState(null);
  const [vendorLoadError, setVendorLoadError] = useState('');
  const { user } = useAuth(); // NEW
  const { t } = useTranslation();

  useEffect(() => {
    async function fetchVendors() {
      try {
        const res = await api.get('/user/vendors');
        if (res.data && Array.isArray(res.data)) {
          // Only show approved active vendors
          const approved = res.data.filter(v => v.vendor_status === 'APPROVED');
          setVendors(approved);
        } else {
          setVendors([]);
        }
      } catch {
        setVendors([]);
        setVendorLoadError(t('vendors_load_error'));
      } finally {
        setLoading(false);
      }
    }
    fetchVendors();
  }, [t]);

  const filtered = vendors.filter(v => 
    (v.business_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.city || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.service_area || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendQuoteRequest = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    sessionStorage.setItem('latest_vendor_request', JSON.stringify({
      vendor: selectedVendor,
      location: formData.get('location'),
      notes: formData.get('notes'),
      capacity: recommendation.capacity_kw || 3.5,
      requestedAt: new Date().toISOString(),
    }));
    setQuoteSuccess(true);
    setTimeout(() => {
      setSelectedVendor(null);
      setQuoteSuccess(false);
    }, 2500);
  };

  const openChat = async (vendor) => {
    setChatVendor(vendor);
    setChatRequest(null);
    setChatMessages([]);
    try {
      const request = await createServiceRequest({
        vendor_id: vendor.id,
        service_type: 'VENDOR_CHAT',
        city: plannerInput.city || vendor.city || 'Local',
        address: [plannerInput.city, plannerInput.state].filter(Boolean).join(', '),
        description: 'Customer wants to ask this vendor for specific product, pricing, warranty or service information.',
      });
      setChatRequest(request);
      setChatMessages(await getUserServiceMessages(request.id));
    } catch (error) {
      setChatMessages([]);
      window.alert(error.response?.data?.detail || t('vendor_chat_start_error'));
    }
  };

  const sendChat = async (e) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text || !chatVendor || !chatRequest) return;
    try {
      const message = await sendUserServiceMessage(chatRequest.id, text);
      setChatMessages((current) => [...current, message]);
      setChatInput('');
    } catch (error) {
      window.alert(error.response?.data?.detail || t('message_send_error'));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-widest mb-1">
          <ShieldCheck size={16} /> {t('government_registered_installers')}
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900">{t('verified_solar_vendors')}</h1>
        <p className="text-slate-600 text-sm mt-1">
          {t('vendor_connect_desc')}
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder={t('search_vendors_placeholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
        />
      </div>

      {/* Vendors Grid */}
      {loading ? (
        <div className="py-12 text-center text-slate-500">{t('loading_vendors')}</div>
      ) : vendorLoadError ? (
        <div className="py-12 text-center text-rose-600">{vendorLoadError}</div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-slate-500">{t('no_approved_vendors')}</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((vendor) => (
            <div
              key={vendor.id}
              className="bg-white border border-blue-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
                    <Store size={24} />
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                    <CheckCircle2 size={12} /> {t('mnre_empaneled')}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-1">{vendor.business_name || vendor.full_name}</h3>
                <p className="text-xs text-slate-500 mb-4">{t('contact_person')}: {vendor.full_name}</p>

                <div className="space-y-2 text-xs text-slate-600 mb-6">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-blue-600 shrink-0" />
                    <span>{vendor.city || t('default_city')}, {vendor.state || t('default_state')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-blue-600 shrink-0" />
                    <span>{vendor.phone || t('default_phone')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award size={14} className="text-amber-500 shrink-0" />
                    <span>{t('service_area')}: {vendor.service_area || t('default_service_area')}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedVendor(vendor)}
                className="w-full bg-blue-900 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-800 transition flex items-center justify-center gap-2 shadow-xs"
              >
                {t('request_quotation')} <ArrowRight size={16} />
              </button>
              <button
                onClick={() => openChat(vendor)}
                className="w-full mt-2 border border-blue-200 text-blue-800 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-50 transition flex items-center justify-center gap-2"
              >
                <MessageCircle size={16} /> {t('chat_with_vendor')}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Quote Request Modal */}
      {selectedVendor && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-xl font-bold text-slate-900">{t('request_solar_quotation')}</h3>
            <p className="text-xs text-slate-600">
              {t('send_rooftop_parameters')} <strong>{selectedVendor.business_name || selectedVendor.full_name}</strong> {t('for_custom_pricing')}
            </p>

            {quoteSuccess ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-sm font-medium flex items-center gap-2">
                <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                {t('quotation_submitted')}
              </div>
            ) : (
              <form onSubmit={handleSendQuoteRequest} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{t('recommended_system_capacity')}</label>
                  <input type="text" value={`${recommendation.capacity_kw || 3.5} kW ${t('rooftop_solar_system')}`} className="w-full border rounded-lg px-3 py-2 text-sm bg-slate-50" readOnly />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{t('installation_location')}</label>
                  <input name="location" type="text" defaultValue={[plannerInput.city, plannerInput.state].filter(Boolean).join(', ')} placeholder={t('city_state_placeholder')} className="w-full border rounded-lg px-3 py-2 text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{t('notes_requirements')}</label>
                  <textarea name="notes" rows="3" defaultValue={t('quote_notes_default', { capacity: recommendation.capacity_kw || 3.5 })} className="w-full border rounded-lg px-3 py-2 text-sm"></textarea>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedVendor(null)}
                    className="flex-1 border border-slate-300 py-2 rounded-xl text-sm font-medium hover:bg-slate-50"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-900 text-white py-2 rounded-xl text-sm font-semibold hover:bg-blue-800"
                  >
                    {t('submit_request')}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}
      {chatVendor && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="bg-blue-900 text-white p-5 flex items-center justify-between">
              <div><h3 className="font-bold">{t('vendor_chat')}</h3><p className="text-xs text-blue-200 mt-1">{chatVendor.business_name || chatVendor.full_name}</p></div>
              <button onClick={() => setChatVendor(null)} className="text-blue-100 hover:text-white" aria-label={t('close_button')}>✕</button>
            </div>
            <div className="h-64 overflow-y-auto bg-slate-50 p-4 space-y-2">
              {!chatRequest && <p className="text-xs text-slate-500 text-center mt-8">{t('opening_conversation')}</p>}
              {chatRequest && chatMessages.length === 0 && <p className="text-xs text-slate-500 text-center mt-8">{t('chat_empty')}</p>}
              {chatMessages.map((message) => (
                <div key={message.id} className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${message.sender_id === chatRequest?.user_id ? 'ml-auto bg-blue-700 text-white' : 'bg-white border text-slate-700'}`}>
                  {message.message}
                </div>
              ))}
            </div>
            <form onSubmit={sendChat} className="p-3 flex gap-2 border-t">
              <input disabled={!chatRequest} value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder={t('type_message')} className="flex-1 border rounded-lg px-3 py-2 text-sm" />
              <button disabled={!chatRequest} type="submit" className="bg-blue-900 text-white rounded-lg px-3 text-sm font-semibold disabled:opacity-50">{t('send_message')}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
