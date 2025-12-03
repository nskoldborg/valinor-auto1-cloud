import React from "react";
import ReactSelect from "react-select";

const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: "rgba(10, 25, 41, 0.5)",
    borderColor: state.isFocused ? "rgba(59, 130, 246, 0.5)" : "rgba(255, 255, 255, 0.1)",
    borderWidth: "1px",
    borderRadius: "0.75rem",
    boxShadow: state.isFocused 
      ? "0 0 0 2px rgba(59, 130, 246, 0.2)" 
      : "none",
    transition: "all 0.3s ease",
    minHeight: "44px",
    height: "44px",
    fontSize: "0.875rem",
    alignItems: "center",
    "&:hover": { 
      borderColor: state.isFocused ? "rgba(59, 130, 246, 0.5)" : "rgba(255, 255, 255, 0.2)",
    },
  }),
  valueContainer: (provided) => ({
    ...provided,
    padding: "0 12px",
    height: "44px",
    display: "flex",
    alignItems: "center",
    fontSize: "0.875rem",
  }),
  singleValue: (provided) => ({
    ...provided,
    fontSize: "0.875rem",
    color: "#ffffff",
    fontWeight: "500",
  }),
  placeholder: (provided) => ({
    ...provided,
    fontSize: "0.875rem",
    color: "rgba(147, 197, 253, 0.3)",
    fontWeight: "400",
  }),
  input: (provided) => ({
    ...provided,
    fontSize: "0.875rem",
    color: "#ffffff",
    margin: 0,
    padding: 0,
  }),
  option: (provided, state) => ({
    ...provided,
    fontSize: "0.875rem",
    fontWeight: "500",
    backgroundColor: state.isSelected
      ? "rgba(59, 130, 246, 0.2)"
      : state.isFocused
      ? "rgba(255, 255, 255, 0.05)"
      : "transparent",
    color: state.isSelected ? "#93c5fd" : "#e0e7ff",
    cursor: "pointer",
    padding: "12px 20px",
    transition: "all 0.2s ease",
    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
    "&:last-child": {
      borderBottom: "none",
    },
    "&:active": {
      backgroundColor: "rgba(59, 130, 246, 0.3)",
    },
  }),
  indicatorsContainer: (provided) => ({
    ...provided,
    height: "44px",
    display: "flex",
    alignItems: "center",
  }),
  dropdownIndicator: (provided, state) => ({
    ...provided,
    color: state.isFocused ? "#93c5fd" : "rgba(147, 197, 253, 0.5)",
    padding: "8px",
    transition: "all 0.3s ease",
    transform: state.selectProps.menuIsOpen ? "rotate(180deg)" : "rotate(0deg)",
    ":hover": { 
      color: "#93c5fd",
    },
  }),
  clearIndicator: (provided) => ({
    ...provided,
    color: "rgba(147, 197, 253, 0.5)",
    padding: "8px",
    transition: "all 0.2s ease",
    ":hover": { 
      color: "#f87171",
    },
  }),
  indicatorSeparator: (provided) => ({
    ...provided,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    width: "1px",
    marginTop: "8px",
    marginBottom: "8px",
  }),
  menuPortal: (provided) => ({
    ...provided,
    zIndex: 9999,
  }),
  menu: (provided) => ({
    ...provided,
    zIndex: 9999,
    borderRadius: "0.75rem",
    backgroundColor: "#0d1f33",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    marginTop: "8px",
    overflow: "hidden",
    padding: "0",
    backdropFilter: "blur(12px)",
  }),
  menuList: (provided) => ({
    ...provided,
    padding: "0",
    maxHeight: "300px",
  }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: "rgba(59, 130, 246, 0.2)",
    borderRadius: "0.5rem",
    padding: "2px 4px",
    border: "1px solid rgba(59, 130, 246, 0.3)",
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: "#93c5fd",
    fontWeight: "600",
    fontSize: "0.75rem",
    padding: "2px 6px",
  }),
  multiValueRemove: (provided) => ({
    ...provided,
    color: "#93c5fd",
    borderRadius: "0 0.5rem 0.5rem 0",
    transition: "all 0.2s ease",
    ":hover": {
      backgroundColor: "rgba(59, 130, 246, 0.3)",
      color: "#ffffff",
    },
  }),
};

const Select = ({ label, className = "", error, helperText, ...props }) => (
  <div className={`w-full ${className}`}>
    {label && (
      <label className="flex items-center gap-2 text-sm font-semibold text-blue-200 mb-2">
        <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
        {label}
      </label>
    )}
    <ReactSelect
      {...props}
      isSearchable
      menuPortalTarget={document.body}
      classNamePrefix="react-select"
      styles={{
        ...customSelectStyles,
        ...(props.styles || {}),
      }}
    />
    {error && (
      <p className="mt-2 text-xs text-red-400 flex items-center gap-1">
        <span className="w-1 h-1 bg-red-400 rounded-full"></span>
        {error}
      </p>
    )}
    {helperText && !error && (
      <p className="mt-2 text-xs text-blue-400/50 flex items-center gap-1">
        <span className="w-1 h-1 bg-blue-400/50 rounded-full"></span>
        {helperText}
      </p>
    )}
  </div>
);

export default Select;