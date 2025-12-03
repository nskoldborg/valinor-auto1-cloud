import React from "react";

export const ChartCard = ({ 
  title, 
  icon: Icon, 
  iconColor = "text-blue-400",
  actions,
  children,
  height = "300px",
  className = "" 
}) => (
  <div className={`bg-[#0d1f33]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl ${className}`}>
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        {Icon && <Icon className={`${iconColor} text-xl`} />}
        <h3 className="text-xl font-semibold text-white">{title}</h3>
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
    <div style={{ height }} className="flex items-center justify-center">
      {children}
    </div>
  </div>
);

// Placeholder for charts
export const ChartPlaceholder = ({ message }) => (
  <div className="w-full h-full flex items-center justify-center text-blue-400/30">
    {message}
  </div>
);