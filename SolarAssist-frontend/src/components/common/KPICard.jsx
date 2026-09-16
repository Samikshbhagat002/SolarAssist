export default function KPICard({ label, value, subtext, icon: Icon, trend, color = "blue" }) {
  const isBlue = color === "blue";
  
  return (
    <div className="bg-white border border-blue-100/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
      {/* Decorative top ambient glow */}
      <div className="absolute -right-6 -top-6 w-20 h-20 bg-blue-500/10 rounded-full blur-xl group-hover:bg-amber-500/15 transition-all" />
      
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        {Icon && (
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 group-hover:bg-amber-400 group-hover:text-slate-950 transition-colors duration-300 shadow-xs">
            <Icon size={20} />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">{value}</h3>
        {trend && (
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            {trend}
          </span>
        )}
      </div>

      {subtext && (
        <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1 font-medium">
          {subtext}
        </p>
      )}
    </div>
  );
}