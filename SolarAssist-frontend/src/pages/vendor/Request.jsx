import { useState } from 'react';

const initialRequests = [
  { id: 1, customer: 'Rohan Patil', location: 'Amravati', capacity: '5 kW', date: '05 Aug 2026', status: 'New' },
  { id: 2, customer: 'Sneha Kulkarni', location: 'Nagpur', capacity: '3 kW', date: '02 Aug 2026', status: 'Contacted' },
  { id: 3, customer: 'Amit Joshi', location: 'Amravati', capacity: '4 kW', date: '28 Jul 2026', status: 'In Progress' },
];

const statusColor = {
  New: 'bg-blue-100 text-blue-700',
  Contacted: 'bg-yellow-100 text-yellow-700',
  'In Progress': 'bg-yellow-100 text-yellow-700',
  Completed: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700',
};

export default function Requests() {
  const [requests, setRequests] = useState(initialRequests);

  const updateStatus = (id, status) => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-blue-900 mb-6">Customer Requests</h1>

      <div className="bg-white border border-blue-100 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-blue-50 text-slate-600">
            <tr className="text-left">
              <th className="px-5 py-3">Customer</th>
              <th className="px-5 py-3">Location</th>
              <th className="px-5 py-3">Capacity</th>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="px-5 py-3">{r.customer}</td>
                <td className="px-5 py-3">{r.location}</td>
                <td className="px-5 py-3">{r.capacity}</td>
                <td className="px-5 py-3">{r.date}</td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor[r.status]}`}>{r.status}</span>
                </td>
                <td className="px-5 py-3 flex gap-2">
                  <button onClick={() => updateStatus(r.id, 'Contacted')} className="text-blue-700 hover:underline text-xs font-medium">Accept</button>
                  <button onClick={() => updateStatus(r.id, 'Rejected')} className="text-red-600 hover:underline text-xs font-medium">Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}