import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatCard({
  label, value, sub, icon: Icon,
  iconBg, iconColor, trend, trendUp = true
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100" style={{boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-gray-400">{label}</p>
        {Icon && (
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center
                           ${iconBg || 'bg-violet-50'}`}>
            <Icon size={18} className={iconColor || 'text-violet-600'} />
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-2">{value}</p>
      {(sub || trend) && (
        <div className="flex items-center gap-1">
          {trend && (
            trendUp
              ? <TrendingUp  size={12} className="text-emerald-500" />
              : <TrendingDown size={12} className="text-red-400"    />
          )}
          <p className={`text-xs font-medium ${
            trend
              ? trendUp ? 'text-emerald-600' : 'text-red-500'
              : 'text-gray-400'
          }`}>
            {trend || sub}
          </p>
        </div>
      )}
    </div>
  );
}