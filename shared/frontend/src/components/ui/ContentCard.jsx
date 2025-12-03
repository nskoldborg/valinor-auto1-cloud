import React from "react";

export const ContentCard = ({ 
  children, 
  className = "",
  padding = "p-6",
  noBorder = false 
}) => (
  <div className={`bg-white/5 backdrop-blur-sm ${!noBorder ? 'border border-white/10' : ''} rounded-xl ${padding} ${className}`}>
    {children}
  </div>
);