import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun } from 'lucide-react';

export default function StartupScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/login', { replace: true });
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-slate-900">
      <div className="flex flex-col items-center gap-4 solarassist-splash-logo">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-sky-500 to-blue-700 text-white flex items-center justify-center shadow-xl shadow-blue-200/80">
          <Sun size={40} className="drop-shadow-sm" />
        </div>
        <div className="text-center">
          <div className="text-3xl font-black tracking-tight text-blue-900">SolarAssist</div>
          <div className="text-sm text-slate-500 mt-1">Personalized Solar Planning</div>
        </div>
      </div>
    </div>
  );
}
