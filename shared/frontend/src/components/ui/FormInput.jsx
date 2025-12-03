import React from "react";

export const FormInput = ({ 
  label, 
  name, 
  type = "text", 
  value, 
  onChange, 
  placeholder,
  required = false,
  disabled = false,
  error,
  className = "" 
}) => (
  <div className={className}>
    {label && (
      <label className="block text-sm font-semibold mb-2 text-blue-200">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
    )}
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      className={`w-full bg-[#0a1929]/50 border ${error ? 'border-red-500/50' : 'border-white/10'} rounded-xl px-4 py-3 text-white placeholder-blue-400/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
    />
    {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
  </div>
);

export const FormTextarea = ({ 
  label, 
  name, 
  value, 
  onChange, 
  placeholder,
  rows = 4,
  required = false,
  disabled = false,
  error,
  className = "" 
}) => (
  <div className={className}>
    {label && (
      <label className="block text-sm font-semibold mb-2 text-blue-200">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
    )}
    <textarea
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      required={required}
      className={`w-full bg-[#0a1929]/50 border ${error ? 'border-red-500/50' : 'border-white/10'} rounded-xl px-4 py-3 text-white placeholder-blue-400/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed`}
    />
    {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
  </div>
);

export const FormSelect = ({ 
  label, 
  name, 
  value, 
  onChange, 
  options = [],
  required = false,
  disabled = false,
  error,
  className = "" 
}) => (
  <div className={className}>
    {label && (
      <label className="block text-sm font-semibold mb-2 text-blue-200">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
    )}
    <select
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      required={required}
      className={`w-full bg-[#0a1929]/50 border ${error ? 'border-red-500/50' : 'border-white/10'} rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
  </div>
);