import React from "react";

const Textarea = ({
  label,
  className = "",
  rows = 4,
  placeholder,
  error,
  ...props
}) => (
  <div className="w-full">
    {label && (
      <label className="block text-sm font-semibold mb-2 text-blue-200">
        {label}
      </label>
    )}
    <textarea
      rows={rows}
      placeholder={placeholder}
      className={`w-full bg-[#0a1929]/50 border ${error ? 'border-red-500/50' : 'border-white/10'} rounded-xl px-4 py-3 text-white placeholder-blue-400/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all resize-none ${className}`}
      {...props}
    />
    {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
  </div>
);

export default Textarea;