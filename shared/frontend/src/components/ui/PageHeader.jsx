import React from "react";

export const PageHeader = ({ 
  title, 
  description, 
  actions,
  className = "" 
}) => (
  <div className={`bg-[#0a1520]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 mb-8 shadow-2xl ${className}`}>
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-4xl font-bold text-white mb-3">{title}</h1>
        {description && (
          <p className="text-blue-200/70 text-lg">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  </div>
);