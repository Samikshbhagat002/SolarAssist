import { useState } from 'react';
import { Star } from 'lucide-react';

export default function Feedback() {
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Replace with: await api.post('/feedback', { rating, message })
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-md mx-auto py-24 text-center px-6">
        <h2 className="text-xl font-bold text-blue-900 mb-2">Thank you!</h2>
        <p className="text-slate-600">Your feedback helps us improve SolarAssist.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-16 px-6">
      <h1 className="text-2xl font-bold text-blue-900 mb-6">Share Your Feedback</h1>
      <form onSubmit={handleSubmit}>
        <label className="block text-sm font-medium text-slate-700 mb-2">Rate your experience</label>
        <div className="flex gap-1 mb-6">
          {[1, 2, 3, 4, 5].map((n) => (
            <button type="button" key={n} onClick={() => setRating(n)}>
              <Star size={26} className={n <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'} />
            </button>
          ))}
        </div>

        <label className="block text-sm font-medium text-slate-700 mb-1">Your message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 mb-6"
          placeholder="Tell us what you think…"
        />

        <button type="submit" className="w-full bg-blue-900 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-800">
          Submit Feedback
        </button>
      </form>
    </div>
  );
}