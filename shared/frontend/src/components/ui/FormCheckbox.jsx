import React from "react";
import PropTypes from "prop-types";
import { FaCheck } from "react-icons/fa";

/**
 * FormCheckbox Component
 * A dark-themed checkbox input with label, description, and validation support
 */
export const FormCheckbox = ({
  label,
  checked,
  onChange,
  description,
  error,
  disabled = false,
  required = false,
  className = "",
  size = "md",
  variant = "primary",
  ...props
}) => {
  const hasError = !!error;

  // Size configurations
  const sizeClasses = {
    sm: {
      checkbox: "w-4 h-4",
      icon: "text-[10px]",
      label: "text-xs",
      description: "text-[10px]",
    },
    md: {
      checkbox: "w-5 h-5",
      icon: "text-xs",
      label: "text-sm",
      description: "text-xs",
    },
    lg: {
      checkbox: "w-6 h-6",
      icon: "text-sm",
      label: "text-base",
      description: "text-sm",
    },
  };

  // Variant configurations
  const variantClasses = {
    primary: {
      checked: "bg-gradient-to-br from-blue-500 to-blue-600 border-blue-500",
      unchecked: "bg-white/5 border-white/20",
      hover: "hover:border-blue-400",
      focus: "focus:ring-blue-500/20",
    },
    success: {
      checked: "bg-gradient-to-br from-green-500 to-green-600 border-green-500",
      unchecked: "bg-white/5 border-white/20",
      hover: "hover:border-green-400",
      focus: "focus:ring-green-500/20",
    },
    warning: {
      checked: "bg-gradient-to-br from-yellow-500 to-yellow-600 border-yellow-500",
      unchecked: "bg-white/5 border-white/20",
      hover: "hover:border-yellow-400",
      focus: "focus:ring-yellow-500/20",
    },
    error: {
      checked: "bg-gradient-to-br from-red-500 to-red-600 border-red-500",
      unchecked: "bg-white/5 border-white/20",
      hover: "hover:border-red-400",
      focus: "focus:ring-red-500/20",
    },
  };

  const currentSize = sizeClasses[size];
  const currentVariant = variantClasses[variant];

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-start gap-3">
        {/* Checkbox Container */}
        <div className="relative flex items-center justify-center pt-0.5">
          {/* Hidden Native Checkbox */}
          <input
            type="checkbox"
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            className="sr-only peer"
            {...props}
          />

          {/* Custom Checkbox */}
          <div
            className={`
              ${currentSize.checkbox}
              rounded-md border-2 
              flex items-center justify-center
              transition-all duration-200
              cursor-pointer
              ${
                checked
                  ? currentVariant.checked
                  : `${currentVariant.unchecked} ${currentVariant.hover}`
              }
              ${
                hasError
                  ? "border-red-500/50"
                  : ""
              }
              peer-focus:ring-2 ${currentVariant.focus}
              peer-disabled:opacity-50 peer-disabled:cursor-not-allowed
              backdrop-blur-sm
              ${checked ? "shadow-lg" : ""}
            `}
            onClick={() => !disabled && onChange({ target: { checked: !checked } })}
          >
            {/* Checkmark Icon */}
            {checked && (
              <FaCheck
                className={`${currentSize.icon} text-white animate-scale-in`}
              />
            )}
          </div>
        </div>

        {/* Label & Description */}
        {(label || description) && (
          <div className="flex-1">
            {label && (
              <label
                className={`
                  ${currentSize.label}
                  font-medium text-blue-200/90
                  cursor-pointer
                  ${disabled ? "opacity-50 cursor-not-allowed" : ""}
                `}
                onClick={() => !disabled && onChange({ target: { checked: !checked } })}
              >
                {label}
                {required && <span className="text-red-400 ml-1">*</span>}
              </label>
            )}
            {description && (
              <p
                className={`
                  ${currentSize.description}
                  text-blue-200/60 mt-1
                  ${disabled ? "opacity-50" : ""}
                `}
              >
                {description}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-xs text-red-400 ml-8">
          {error}
        </p>
      )}
    </div>
  );
};

FormCheckbox.propTypes = {
  label: PropTypes.string,
  checked: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  description: PropTypes.string,
  error: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  className: PropTypes.string,
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  variant: PropTypes.oneOf(["primary", "success", "warning", "error"]),
};

export default FormCheckbox;