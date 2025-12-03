import React from "react";

const sizeClasses = {
  sm: "w-8 h-8 border-2",
  md: "w-12 h-12 border-3",
  lg: "w-16 h-16 border-4",
  xl: "w-20 h-20 border-4",
};

export const LoadingSpinner = ({ 
  size = "md", 
  className = "",
  color = "blue" 
}) => {
  const colorClasses = {
    blue: "border-blue-200/30 border-t-blue-500",
    green: "border-green-200/30 border-t-green-500",
    purple: "border-purple-200/30 border-t-purple-500",
    amber: "border-amber-200/30 border-t-amber-500",
    red: "border-red-200/30 border-t-red-500",
  };

  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const colorClass = colorClasses[color] || colorClasses.blue;

  return (
    <div className="flex justify-center items-center">
      <div
        className={`${sizeClass} ${colorClass} rounded-full animate-spin ${className}`}
      ></div>
    </div>
  );
};

// Alternative: Spinner with text
export const LoadingSpinnerWithText = ({ 
  size = "md", 
  text = "Loading...",
  color = "blue",
  className = "" 
}) => {
  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <LoadingSpinner size={size} color={color} />
      <p className="text-blue-200/60 font-medium">{text}</p>
    </div>
  );
};

// Alternative: Dots spinner
export const DotsSpinner = ({ className = "" }) => {
  return (
    <div className={`flex gap-2 ${className}`}>
      <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
      <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
      <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
    </div>
  );
};

// Alternative: Pulse spinner
export const PulseSpinner = ({ size = "md", className = "" }) => {
  const sizeClass = sizeClasses[size] || sizeClasses.md;
  
  return (
    <div className="flex justify-center items-center">
      <div className={`${sizeClass} bg-blue-500 rounded-full animate-pulse ${className}`}></div>
    </div>
  );
};