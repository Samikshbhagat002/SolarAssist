import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.detail || t('forgot_password_error'));
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center">
        <div className="max-w-md">
          <h2 className="text-xl font-bold text-blue-900 mb-3">{t('check_email_title')}</h2>
          <p className="text-slate-600">{t('check_email_desc')}</p>
          <Link to="/login" className="inline-block mt-6 text-blue-700 font-medium hover:underline">Back to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <h2 className="text-2xl font-bold text-blue-900 mb-2">{t('forgot_password_title')}</h2>
        <p className="text-sm text-slate-600 mb-6">{t('forgot_password_desc')}</p>

        <label className="block text-sm font-medium text-slate-700 mb-1">{t('email_label')}</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 mb-6" required />

        {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}

        <button type="submit" disabled={loading} className="w-full bg-blue-900 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-800 disabled:opacity-60">
          {loading ? t('sending') : t('send_reset_link')}
        </button>

        <p className="text-sm text-center text-slate-600 mt-6">
          <Link to="/login" className="text-blue-700 font-medium hover:underline">{t('back_to_login')}</Link>
        </p>
      </form>
    </div>
  );
}