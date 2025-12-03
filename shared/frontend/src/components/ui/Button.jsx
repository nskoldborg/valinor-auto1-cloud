import React from "react";

// Primary Button (Blue gradient)
export const PrimaryButton = ({ 
  children, 
  onClick, 
  disabled = false, 
  loading = false,
  icon: Icon,
  className = "",
  type = "button"
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled || loading}
    className={`px-5 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2 shadow-lg shadow-blue-500/30 ${className}`}
  >
    {loading ? (
      <>
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        {children}
      </>
    ) : (
      <>
        {Icon && <Icon className="text-sm" />}
        {children}
      </>
    )}
  </button>
);

// Secondary Button (White/transparent with border)
export const SecondaryButton = ({ 
  children, 
  onClick, 
  disabled = false,
  icon: Icon,
  className = "",
  type = "button"
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white transition-all flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
  >
    {Icon && <Icon className="text-sm" />}
    {children}
  </button>
);

// Danger Button (Red gradient)
export const DangerButton = ({ 
  children, 
  onClick, 
  disabled = false,
  loading = false,
  icon: Icon,
  className = "",
  type = "button"
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled || loading}
    className={`px-5 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2 shadow-lg shadow-red-500/30 ${className}`}
  >
    {loading ? (
      <>
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        {children}
      </>
    ) : (
      <>
        {Icon && <Icon className="text-sm" />}
        {children}
      </>
    )}
  </button>
);

// Success Button (Green gradient)
export const SuccessButton = ({ 
  children, 
  onClick, 
  disabled = false,
  loading = false,
  icon: Icon,
  className = "",
  type = "button"
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled || loading}
    className={`px-5 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2 shadow-lg shadow-green-500/30 ${className}`}
  >
    {loading ? (
      <>
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        {children}
      </>
    ) : (
      <>
        {Icon && <Icon className="text-sm" />}
        {children}
      </>
    )}
  </button>
);

// Warning Button (Yellow/Orange gradient)
export const WarningButton = ({ 
  children, 
  onClick, 
  disabled = false,
  loading = false,
  icon: Icon,
  className = "",
  type = "button"
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled || loading}
    className={`px-5 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2 shadow-lg shadow-yellow-500/30 ${className}`}
  >
    {loading ? (
      <>
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        {children}
      </>
    ) : (
      <>
        {Icon && <Icon className="text-sm" />}
        {children}
      </>
    )}
  </button>
);

// Small Button (Compact version)
export const SmallButton = ({ 
  children, 
  onClick, 
  disabled = false,
  variant = "secondary", // "primary" | "secondary" | "danger" | "success" | "warning"
  icon: Icon,
  className = "",
  type = "button"
}) => {
  const variants = {
    primary: "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/30",
    secondary: "bg-white/5 hover:bg-white/10 border border-white/10 text-blue-200",
    danger: "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/30",
    success: "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg shadow-green-500/30",
    warning: "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg shadow-yellow-500/30"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {Icon && <Icon className="text-xs" />}
      {children}
    </button>
  );
};