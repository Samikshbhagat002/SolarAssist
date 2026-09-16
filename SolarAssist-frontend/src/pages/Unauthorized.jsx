import { Link } from 'react-router-dom';

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
      <h1 className="text-2xl font-bold text-blue-900 mb-2">Unauthorized Access</h1>
      <p className="text-slate-600 mb-6">You don't have permission to access this page.</p>
      <Link to="/login" className="bg-blue-900 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-800">Go to Dashboard</Link>
    </div>
  );
}