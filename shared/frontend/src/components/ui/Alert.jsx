import React from "react";
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle } from "react-icons/fa";

export const Alert = ({ 
  type = "info", // "success" | "error" | "warning" | "info"
  message,
  className = "" 
}) => {
  const config = {
    success: {
      bg: "bg-green-500/10 border-green-500/20",
      iconBg: "bg-green-500/20",
      icon: FaCheckCircle,
      iconColor: "text-green-400",
      textColor: "text-green-300/80"
    },
    error: {
      bg: "bg-red-500/10 border-red-500/20",
      iconBg: "bg-red-500/20",
      icon: FaExclamationTriangle,
      iconColor: "text-red-400",
      textColor: "text-red-300/80"
    },
    warning: {
      bg: "bg-yellow-500/10 border-yellow-500/20",
      iconBg: "bg-yellow-500/20",
      icon: FaExclamationTriangle,
      iconColor: "text-yellow-400",
      textColor: "text-yellow-300/80"
    },
    info: {
      bg: "bg-blue-500/10 border-blue-500/20",
      iconBg: "bg-blue-500/20",
      icon: FaInfoCircle,
      iconColor: "text-blue-400",
      textColor: "text-blue-300/80"
    }
  };

  const { bg, iconBg, icon: Icon, iconColor, textColor } = config[type];

  return (
    <div className={`rounded-xl p-4 ${bg} border ${className}`}>
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}>
          <Icon className={`${iconColor} text-base`} />
        </div>
        <div>
          <p className="font-semibold text-white text-sm capitalize">{type}</p>
          <p className={`text-xs ${textColor}`}>{message}</p>
        </div>
      </div>
    </div>
  );
};