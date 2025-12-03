import React from "react";
import PropTypes from "prop-types";

/**
 * FormTextarea Component
 * A dark-themed textarea input with label, icon, and validation support
 */
export const FormTextarea = ({
  label,
  value,
  onChange,
  placeholder,
  error,
  helperText,
  icon,
  rows = 4,
  disabled = false,
  required = false,
  maxLength,
  showCharCount = false,
  className = "",
  ...props
}) => {
  const hasError = !!error;
  const charCount = value?.length || 0;
  const isNearLimit = maxLength && charCount > maxLength * 0.8;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-blue-200/80">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}

      {/* Textarea Container */}
      <div className="relative">
        {/* Icon */}
        {icon && (
          <div className="absolute left-3 top-3 text-blue-400/60 pointer-events-none z-10">
            {icon}
          </div>
        )}

        {/* Textarea */}
        <textarea
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          maxLength={maxLength}
          className={`
            w-full rounded-lg px-4 py-3 text-sm
            ${icon ? "pl-10" : ""}
            bg-white/5 border
            ${
              hasError
                ? "border-red-500/50 focus:border-red-500"
                : "border-white/10 focus:border-blue-500"
            }
            text-white placeholder-blue-200/40
            transition-all duration-200
            focus:outline-none focus:ring-2
            ${
              hasError
                ? "focus:ring-red-500/20"
                : "focus:ring-blue-500/20"
            }
            disabled:opacity-50 disabled:cursor-not-allowed
            resize-y min-h-[80px]
            backdrop-blur-sm
          `}
          {...props}
        />

        {/* Character Count */}
        {showCharCount && maxLength && (
          <div
            className={`absolute bottom-2 right-3 text-xs font-medium transition-colors ${
              isNearLimit
                ? charCount >= maxLength
                  ? "text-red-400"
                  : "text-yellow-400"
                : "text-blue-200/40"
            }`}
          >
            {charCount}/{maxLength}
          </div>
        )}
      </div>

      {/* Helper Text / Error */}
      {(helperText || error) && (
        <p
          className={`text-xs ${
            hasError ? "text-red-400" : "text-blue-200/60"
          }`}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
};

FormTextarea.propTypes = {
  label: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  error: PropTypes.string,
  helperText: PropTypes.string,
  icon: PropTypes.node,
  rows: PropTypes.number,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  maxLength: PropTypes.number,
  showCharCount: PropTypes.bool,
  className: PropTypes.string,
};

export default FormTextarea;
