import React from "react";

const Input = ({ label, className = "", error, ...props }) => (
  <div className="w-full">
    {label && (
      <label className="block text-gray-700 mb-1 text-sm font-medium">
        {label}
      </label>
    )}
    <input
      {...props}
      className={`w-full rounded-md border border-gray-300 bg-white px-3 h-[40px] text-sm text-gray-800 
        placeholder-gray-400 transition-all duration-150
        focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400
        hover:border-gray-400
        ${error ? "border-red-400 focus:ring-red-400 focus:border-red-400" : ""}
        ${className}`}
    />
    {error && (
      <p className="text-xs text-red-600 mt-1 font-medium">{error}</p>
    )}
  </div>
);

export default Input;