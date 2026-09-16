import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Package, Check, X, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getVendorProducts, createVendorProduct, updateVendorProduct, deleteVendorProduct } from '../../services/api';
import { mockProducts } from '../../services/mockData';

export default function VendorServices() {
  const { t } = useTranslation();
  const [products, setProducts] = useState(mockProducts);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState({
    name: '',
    category: 'Panel Kit',
    capacity_kw: '',
    price: '',
    description: '',
    warranty_years: 5,
    is_available: true
  });

  useEffect(() => {
    async function loadProducts() {
      const data = await getVendorProducts();
      if (data && data.length > 0) {
        setProducts(data);
      }
    }
    loadProducts();
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setForm({
      name: '',
      category: 'Panel Kit',
      capacity_kw: '',
      price: '',
      description: '',
      warranty_years: 5,
      is_available: true
    });
    setModalOpen(true);
  };

  const openEditModal = (p) => {
    setEditingProduct(p);
    setForm({
      name: p.name,
      category: p.category,
      capacity_kw: p.capacity_kw || '',
      price: p.price,
      description: p.description || '',
      warranty_years: p.warranty_years || 5,
      is_available: p.is_available !== false
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm(t('confirm_delete_product'))) {
      try {
        await deleteVendorProduct(id);
      } catch (e) {
        console.warn('API error during delete:', e);
      }
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      capacity_kw: form.capacity_kw ? parseFloat(form.capacity_kw) : null,
      price: parseFloat(form.price || 0),
      warranty_years: parseInt(form.warranty_years || 5)
    };

    if (editingProduct) {
      try {
        await updateVendorProduct(editingProduct.id, payload);
      } catch (e) {
        console.warn('API error during update:', e);
      }
      setProducts(products.map(p => p.id === editingProduct.id ? { ...p, ...payload } : p));
    } else {
      let newProduct = { id: Date.now(), ...payload };
      try {
        const created = await createVendorProduct(payload);
        if (created) newProduct = created;
      } catch (e) {
        console.warn('API error during create:', e);
      }
      setProducts([newProduct, ...products]);
    }
    setModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('my_products_services')}</h1>
          <p className="text-slate-500 text-sm">{t('manage_solar_offerings')}</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md transition shrink-0"
        >
          <Plus size={18} /> {t('add_new_product_service')}
        </button>
      </div>

      {/* Product List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((p) => (
          <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-3">
                <span className="px-2.5 py-1 bg-amber-50 text-amber-800 text-xs font-bold rounded-lg border border-amber-200 uppercase">
                  {t(`category_${p.category.toLowerCase().replace(/\s+/g, '_')}`, p.category)}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${p.is_available ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                  {p.is_available ? t('available') : t('out_of_stock')}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-1">{p.name}</h3>
              <p className="text-xs text-slate-500 mb-4 line-clamp-2">{p.description || t('no_description_provided')}</p>
              
              <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                {p.capacity_kw && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">{t('capacity')}:</span>
                    <span className="font-semibold text-slate-800">{p.capacity_kw} kW</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">{t('warranty')}:</span>
                  <span className="font-semibold text-slate-800">{p.warranty_years} {t('years')}</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-100">
                  <span>{t('price')}:</span>
                  <span className="text-amber-600">₹{p.price.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 border-t border-slate-100 pt-4 mt-4">
              <button
                onClick={() => openEditModal(p)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition"
              >
                <Edit2 size={14} /> {t('edit')}
              </button>
              <button
                onClick={() => handleDelete(p.id)}
                className="flex items-center justify-center py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-semibold transition"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Dialog */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">
                {editingProduct ? t('edit_product_service') : t('add_product_service')}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block font-medium text-slate-700 mb-1">{t('product_service_name')}</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={t('product_service_placeholder')}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">{t('category')}</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="Panel Kit">{t('category_panel_kit')}</option>
                    <option value="Inverter">{t('category_inverter')}</option>
                    <option value="Battery">{t('category_battery')}</option>
                    <option value="Installation">{t('category_installation')}</option>
                    <option value="Maintenance">{t('category_maintenance')}</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">{t('capacity_kw')}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.capacity_kw}
                    onChange={(e) => setForm({ ...form, capacity_kw: e.target.value })}
                    placeholder={t('capacity_placeholder')}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">{t('price_rupees')}</label>
                  <input
                    type="number"
                    required
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder={t('price_placeholder')}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">{t('warranty_years')}</label>
                  <input
                    type="number"
                    value={form.warranty_years}
                    onChange={(e) => setForm({ ...form, warranty_years: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">{t('description_features')}</label>
                <textarea
                  rows="3"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder={t('description_placeholder')}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="avail"
                  checked={form.is_available}
                  onChange={(e) => setForm({ ...form, is_available: e.target.checked })}
                  className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
                />
                <label htmlFor="avail" className="text-slate-700 font-medium">{t('currently_available_in_stock')}</label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-md"
                >
                  {editingProduct ? t('save_changes') : t('create_product')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
