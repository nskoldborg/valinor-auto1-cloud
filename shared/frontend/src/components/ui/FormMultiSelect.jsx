// src/components/ui/FormMultiSelect.jsx
import React from "react";
import Select from "react-select";

export const FormMultiSelect = ({
  label,
  options,
  value,
  onChange,
  placeholder,
  isDisabled = false,
  isClearable = true,
  isSearchable = true,
  icon: Icon,
  helperText,
  error,
  required = false,
}) => {
  const customStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      borderColor: error
        ? "#ef4444"
        : state.isFocused
        ? "#a855f7"
        : "rgba(255, 255, 255, 0.1)",
      borderWidth: "1px",
      borderRadius: "0.75rem",
      padding: "0.375rem",
      boxShadow: state.isFocused
        ? error
          ? "0 0 0 2px rgba(239, 68, 68, 0.5)"
          : "0 0 0 2px rgba(168, 85, 247, 0.5)"
        : "none",
      "&:hover": {
        borderColor: error ? "#ef4444" : "#a855f7",
      },
      minHeight: "42px",
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: "rgba(168, 85, 247, 0.2)",
      border: "1px solid rgba(168, 85, 247, 0.3)",
      borderRadius: "0.5rem",
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: "#e9d5ff",
      fontWeight: "600",
      padding: "0.25rem 0.5rem",
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: "#e9d5ff",
      borderRadius: "0 0.5rem 0.5rem 0",
      "&:hover": {
        backgroundColor: "rgba(147, 51, 234, 0.3)",
        color: "white",
      },
    }),
    input: (base) => ({
      ...base,
      color: "white",
    }),
    placeholder: (base) => ({
      ...base,
      color: "rgba(191, 219, 254, 0.4)",
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: "#0d1f33",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      borderRadius: "0.75rem",
      overflow: "hidden",
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 9999,
    }),
    menuList: (base) => ({
      ...base,
      padding: "0.25rem",
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#a855f7"
        : state.isFocused
        ? "rgba(168, 85, 247, 0.1)"
        : "transparent",
      color: "white",
      fontWeight: state.isSelected ? "600" : "500",
      borderRadius: "0.5rem",
      padding: "0.625rem 0.75rem",
      cursor: "pointer",
      "&:active": {
        backgroundColor: "#a855f7",
      },
    }),
    noOptionsMessage: (base) => ({
      ...base,
      color: "rgba(191, 219, 254, 0.6)",
    }),
    loadingMessage: (base) => ({
      ...base,
      color: "rgba(191, 219, 254, 0.6)",
    }),
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="flex items-center gap-2 text-sm font-semibold text-blue-200">
          {Icon && <Icon className="text-purple-400" />}
          {label}
          {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <Select
        isMulti
        options={options}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        isDisabled={isDisabled}
        isClearable={isClearable}
        isSearchable={isSearchable}
        styles={customStyles}
        menuPortalTarget={document.body}
        menuShouldScrollIntoView={false}
        className={error ? "react-select-error" : ""}
      />
      {helperText && !error && (
        <div className="flex items-start gap-2">
          {Icon && <Icon className="text-purple-400 text-xs mt-0.5 flex-shrink-0" />}
          <p className="text-xs text-blue-200/70 italic">{helperText}</p>
        </div>
      )}
      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
};