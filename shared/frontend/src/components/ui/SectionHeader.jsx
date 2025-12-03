import React from "react";

export const SectionHeader = ({ 
  title, 
  icon: Icon, 
  iconColor = "text-blue-400",
  badge,
  badgeColor = "bg-blue-500/20 border-blue-500/30 text-blue-400",
  className = "" 
}) => (
  <div className={`flex items-center gap-3 mb-4 ${className}`}>
    {Icon && <Icon className={`${iconColor} text-xl`} />}
    <h3 className="text-xl font-semibold text-white">{title}</h3>
    {badge !== undefined && (
      <span className={`px-3 py-1 border rounded-full text-sm font-medium ${badgeColor}`}>
        {badge}
      </span>
    )}
  </div>
);