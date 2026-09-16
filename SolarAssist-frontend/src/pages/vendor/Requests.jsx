import { useEffect, useState } from 'react';
import { Check, MapPin, Mail, MessageCircle, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  getVendorRequests,
  getVendorServiceMessages,
  getVendorServiceRequests,
  sendVendorServiceMessage,
  updateVendorServiceRequestStatus,
  updateVendorRequestStatus,
} from '../../services/api';
import { mockVendorRequests } from '../../services/mockData';

const filters = ['ALL', 'PENDING', 'ACCEPTED', 'COMPLETED', 'REJECTED'];

export default function VendorRequests() {
  const { t } = useTranslation();
  const [requests, setRequests] = useState(mockVendorRequests);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');

  useEffect(() => {
    getVendorRequests().then((data) => {
      if (data) setRequests(data);
    }).catch(() => {});
    getVendorServiceRequests().then((data) => setServiceRequests(data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedService) {
      return undefined;
    }
    let active = true;
    getVendorServiceMessages(selectedService.id).then((data) => {
      if (active) setMessages(data || []);
    }).catch(() => {});
    return () => { active = false; };
  }, [selectedService]);

  const changeStatus = async (id, status) => {
    try {
      await updateVendorRequestStatus(id, { status });
    } catch (error) {
      window.alert(error.response?.data?.detail || t('could_not_update_request_status'));
      return;
    }
    setRequests((current) => current.map((request) => request.id === id ? { ...request, status } : request));
    setSelectedRequest((current) => current?.id === id ? { ...current, status } : current);
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    const text = messageText.trim();
    if (!text || !selectedService) return;
    try {
      const message = await sendVendorServiceMessage(selectedService.id, text);
      setMessages((current) => [...current, message]);
      setMessageText('');
    } catch (error) {
      window.alert(error.response?.data?.detail || t('could_not_send_message'));
    }
  };

  const changeServiceStatus = async (status) => {
    if (!selectedService) return;
    try {
      const updated = await updateVendorServiceRequestStatus(selectedService.id, status);
      setSelectedService(updated);
      setServiceRequests((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (error) {
      window.alert(error.response?.data?.detail || t('could_not_update_service_status'));
    }
  };

  const visibleRequests = filter === 'ALL' ? requests : requests.filter((request) => request.status === filter);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <header className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">{t('customer_quote_requests_orders')}</h1>
        <p className="text-slate-500 text-sm mt-1">{t('review_customer_inquiries')}</p>
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1 mt-4 w-fit">
          {filters.map((item) => (
            <button key={item} onClick={() => setFilter(item)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${filter === item ? 'bg-amber-500 text-slate-950' : 'text-slate-600'}`}>
              {item === 'ALL' ? t('request_status_all') : t(`status_${item.toLowerCase()}`, item)}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {visibleRequests.map((request) => (
            <article key={request.id} onClick={() => { setSelectedRequest(request); setSelectedService(null); }} className={`bg-white border rounded-2xl p-5 cursor-pointer shadow-sm ${selectedRequest?.id === request.id ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-200'}`}>
              <div className="flex justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900">{request.customer || request.customer_name}</h3>
                  <div className="text-xs text-slate-500 flex items-center gap-1 mt-1"><MapPin size={13} /> {request.location || t('local')}</div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold border bg-slate-50">{t(`status_${request.status.toLowerCase()}`, request.status)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3 text-xs bg-slate-50 p-3 rounded-xl">
                <div><span className="text-slate-400">{t('capacity')}</span><div className="font-bold">{request.capacity || request.capacity_kw || t('custom')}</div></div>
                <div><span className="text-slate-400">{t('service')}</span><div className="font-bold truncate">{request.service || request.service_name}</div></div>
              </div>
              {request.user_notes && <p className="text-xs text-slate-600 italic mt-3">"{request.user_notes}"</p>}
              {request.status === 'PENDING' && (
                <div className="flex gap-2 mt-4 pt-3 border-t">
                  <button onClick={(event) => { event.stopPropagation(); changeStatus(request.id, 'ACCEPTED'); }} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold">{t('accept')}</button>
                  <button onClick={(event) => { event.stopPropagation(); changeStatus(request.id, 'REJECTED'); }} className="px-3 py-1.5 bg-rose-50 text-rose-700 rounded-lg text-xs font-bold">{t('reject')}</button>
                </div>
              )}
              {request.status === 'ACCEPTED' && (
                <button onClick={(event) => { event.stopPropagation(); changeStatus(request.id, 'COMPLETED'); }} className="mt-4 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1"><Check size={14} /> {t('mark_completed')}</button>
              )}
            </article>
          ))}
          {!visibleRequests.length && <div className="bg-white border rounded-2xl p-10 text-center text-slate-500">{t('no_quote_requests_found')}</div>}
        </div>

        <aside className="bg-white border rounded-2xl p-6 shadow-sm h-fit">
          <h2 className="font-bold border-b pb-3">{t('request_overview')}</h2>
          {selectedRequest ? (
            <div className="space-y-4 text-sm pt-4">
              <div><strong>{selectedRequest.customer || selectedRequest.customer_name}</strong><div className="text-xs text-slate-500 mt-1"><Mail size={13} className="inline mr-1" />{selectedRequest.email || selectedRequest.customer_email}</div><div className="text-xs text-slate-500 mt-1"><Phone size={13} className="inline mr-1" />{selectedRequest.phone || selectedRequest.customer_phone}</div></div>
              <div className="border-t pt-3 text-xs space-y-2"><div className="flex justify-between"><span>{t('capacity')}</span><strong>{selectedRequest.capacity || selectedRequest.capacity_kw || t('custom')}</strong></div><div className="flex justify-between"><span>{t('service')}</span><strong>{selectedRequest.service || selectedRequest.service_name}</strong></div><div className="flex justify-between"><span>{t('location')}</span><strong>{selectedRequest.location || t('local')}</strong></div></div>
              <div className="grid grid-cols-2 gap-2"><button onClick={() => changeStatus(selectedRequest.id, 'ACCEPTED')} className="py-2 rounded-lg bg-blue-600 text-white text-xs font-bold">{t('accept')}</button><button onClick={() => changeStatus(selectedRequest.id, 'COMPLETED')} className="py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold">{t('complete')}</button></div>
            </div>
          ) : <p className="text-xs text-slate-500 text-center py-8">{t('select_quote_request')}</p>}
        </aside>
      </div>

      <section className="bg-white border border-amber-200 rounded-2xl p-6 shadow-sm">
        <h2 className="font-bold text-slate-900">{t('existing_solar_service_requests')}</h2>
        <p className="text-xs text-slate-500 mt-1">{t('solar_service_requests_desc')}</p>
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          {serviceRequests.map((request) => (
            <button key={request.id} type="button" onClick={() => { setSelectedService(request); setSelectedRequest(null); }} className={`text-left border rounded-xl p-4 ${selectedService?.id === request.id ? 'border-amber-500 bg-amber-50' : 'border-slate-200'}`}>
              <div className="flex justify-between gap-2"><strong>{request.service_type}</strong><span className="text-xs font-bold">{t(`status_${request.status.toLowerCase()}`, request.status)}</span></div>
              <div className="text-xs text-slate-600 mt-2">{request.city} · {request.address || t('site_address_shared')}</div>
              <div className="text-xs text-slate-500 mt-1">{request.description}</div>
            </button>
          ))}
          {!serviceRequests.length && <p className="text-sm text-slate-500">{t('no_solar_service_requests')}</p>}
        </div>
        {selectedService && (
          <div className="mt-5 border-t pt-4">
            <h3 className="font-semibold flex items-center gap-2"><MessageCircle size={16} /> {t('chat_with_customer')}</h3>
            <div className="flex gap-2 mt-3">
              <button type="button" onClick={() => changeServiceStatus('ACCEPTED')} className="bg-blue-600 text-white rounded-lg px-3 py-1.5 text-xs font-bold">{t('accept_request')}</button>
              <button type="button" onClick={() => changeServiceStatus('REJECTED')} className="bg-rose-50 text-rose-700 rounded-lg px-3 py-1.5 text-xs font-bold">{t('reject_request')}</button>
              <button type="button" onClick={() => changeServiceStatus('COMPLETED')} className="bg-emerald-600 text-white rounded-lg px-3 py-1.5 text-xs font-bold">{t('mark_completed')}</button>
            </div>
            <div className="max-h-40 overflow-y-auto bg-slate-50 rounded-xl p-3 mt-2 space-y-2">
              {messages.map((message) => <div key={message.id} className="bg-white border rounded-lg px-3 py-2 text-sm">{message.message}</div>)}
              {!messages.length && <p className="text-xs text-slate-500">{t('chat_empty')}</p>}
            </div>
            <form onSubmit={sendMessage} className="flex gap-2 mt-2"><input value={messageText} onChange={(event) => setMessageText(event.target.value)} placeholder={t('type_message')} className="flex-1 border rounded-lg px-3 py-2 text-sm" /><button className="bg-amber-500 text-slate-950 rounded-lg px-4 text-sm font-bold">{t('send_message')}</button></form>
          </div>
        )}
      </section>
    </div>
  );
}
