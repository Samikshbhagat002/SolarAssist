import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function RepairServices() {
  const { t } = useTranslation();
  const [services, setServices] = useState([
    { id: 1, name: 'Inverter Repair', price: '₹800 onwards', available: true },
    { id: 2, name: 'Panel Cleaning', price: '₹500 per visit', available: true },
    { id: 3, name: 'Battery Service', price: '₹1,200 onwards', available: false },
  ]);

  const remove = (id) => setServices((prev) => prev.filter((s) => s.id !== id));

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-blue-900">{t('my_services_title')}</h1>
        <button className="flex items-center gap-2 bg-blue-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800">
          <Plus size={16} /> {t('add_service_button')}
        </button>
      </div>

      <div className="space-y-3">
        {services.map((s) => (
          <div key={s.id} className="bg-white border border-blue-100 rounded-xl p-4 flex justify-between items-center">
            <div>
              <p className="font-medium text-blue-900">{s.name}</p>
              <p className="text-sm text-slate-500">{s.price}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${s.available ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                {s.available ? t('service_available') : t('service_unavailable')}
              </span>
              <button onClick={() => remove(s.id)} className="text-red-500 hover:text-red-700">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}