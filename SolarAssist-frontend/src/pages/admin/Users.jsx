import { useState, useEffect } from 'react';
import { Users, Search, Edit2, ShieldAlert, CheckCircle2, XCircle, Filter, UserCheck, UserX } from 'lucide-react';
import { getAdminUsers, toggleAdminUserStatus, updateAdminUser } from '../../services/api';
import { mockUsers } from '../../services/mockData';

export default function AdminUsers() {
  const [users, setUsers] = useState(mockUsers);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ full_name: '', email: '', phone: '', role: 'USER' });

  useEffect(() => {
    async function loadUsers() {
      const data = await getAdminUsers();
      if (data && data.length > 0) {
        setUsers(data);
      }
    }
    loadUsers();
  }, []);

  const handleToggleStatus = async (user) => {
    try {
      await toggleAdminUserStatus(user.id);
    } catch (e) {
      console.warn('API warning:', e);
    }
    setUsers(users.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u));
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      await updateAdminUser(editingUser.id, editForm);
    } catch (e) {
      console.warn('API update warning:', e);
    }

    setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...editForm } : u));
    setEditingUser(null);
  };

  const filteredUsers = users.filter(u => {
    const matchSearch = (u.name || u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
                        (u.email || '').toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-500 text-sm">View, edit user credentials, assign system roles, and activate/deactivate accounts.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none w-full sm:w-64"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
          >
            <option value="ALL">All Roles</option>
            <option value="USER">User (Consumer)</option>
            <option value="VENDOR">Vendor</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-500">
              <th className="py-3.5 px-4">User Name</th>
              <th className="py-3.5 px-4">Email</th>
              <th className="py-3.5 px-4">Phone</th>
              <th className="py-3.5 px-4">Role</th>
              <th className="py-3.5 px-4">Account Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUsers.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50/80 transition">
                <td className="py-3.5 px-4 font-bold text-slate-900">{u.full_name || u.name}</td>
                <td className="py-3.5 px-4 text-slate-600">{u.email}</td>
                <td className="py-3.5 px-4 text-slate-500 text-xs">{u.phone || 'N/A'}</td>
                <td className="py-3.5 px-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                    u.role === 'ADMIN' ? 'bg-indigo-50 text-indigo-800 border-indigo-200' :
                    u.role === 'VENDOR' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                    'bg-blue-50 text-blue-800 border-blue-200'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 w-fit ${
                    u.is_active !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {u.is_active !== false ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                    {u.is_active !== false ? 'Active' : 'Deactivated'}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right space-x-2">
                  <button
                    onClick={() => {
                      setEditingUser(u);
                      setEditForm({
                        full_name: u.full_name || u.name,
                        email: u.email,
                        phone: u.phone || '',
                        role: u.role
                      });
                    }}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => handleToggleStatus(u)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      u.is_active !== false
                        ? 'bg-rose-50 hover:bg-rose-100 text-rose-600'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600'
                    }`}
                  >
                    {u.is_active !== false ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Edit User Account</h2>
            <form onSubmit={handleSaveUser} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Phone</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="USER">USER</option>
                  <option value="VENDOR">VENDOR</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
