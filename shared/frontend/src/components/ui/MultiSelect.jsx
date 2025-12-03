import React from "react";
import ReactSelect from "react-select";

const multiSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: "white",
    borderColor: state.isFocused ? "#60a5fa" : "#d1d5db",
    borderWidth: "1px",
    borderRadius: "0.375rem",
    boxShadow: state.isFocused ? "0 0 0 2px rgba(96,165,250,0.3)" : "none",
    transition: "all 0.15s ease-in-out",
    minHeight: "40px",
    height: "auto",                 // ✅ allow the control to grow
    alignItems: "flex-start",       // ✅ top-align tags so rows stack naturally
    flexWrap: "wrap",
    fontSize: "0.875rem",
    "&:hover": { borderColor: "#9ca3af" },
    paddingTop: 2,
    paddingBottom: 2,
  }),
  valueContainer: (provided) => ({
    ...provided,
    padding: "2px 6px",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "flex-start",
    minHeight: "36px",
    height: "auto",                 // ✅ grow as tags wrap
    maxHeight: "none",              // ✅ no cap -> no scrollbar
    overflowY: "visible",           // ✅ no internal scroll
  }),
  indicatorsContainer: (provided) => ({
    ...provided,
    height: "40px",
    alignItems: "center",
  }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: "#f3f4f6",
    borderRadius: 6,
    margin: 3,
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: "#374151",
    fontSize: "0.75rem",
    padding: "2px 6px",
  }),
  multiValueRemove: (provided) => ({
    ...provided,
    color: "#6b7280",
    borderRadius: 4,
    ":hover": { backgroundColor: "#e5e7eb", color: "#111827" },
  }),
  dropdownIndicator: (provided, state) => ({
    ...provided,
    color: state.isFocused ? "#3b82f6" : "#6b7280",
    padding: 4,
  }),
  clearIndicator: (provided) => ({
    ...provided,
    color: "#9ca3af",
    padding: 4,
  }),
  menuPortal: (provided) => ({ ...provided, zIndex: 9999 }),
  menu: (provided) => ({
    ...provided,
    zIndex: 9999,
    borderRadius: 8,
    backgroundColor: "white",
    boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
    border: "1px solid #e5e7eb",
    marginTop: 4,
  }),
  option: (provided, state) => ({
    ...provided,
    fontSize: "0.875rem",
    backgroundColor: state.isFocused
      ? "rgba(59,130,246,0.1)"
      : state.isSelected
      ? "rgba(59,130,246,0.15)"
      : "white",
    color: state.isSelected ? "#1e3a8a" : "#111827",
    cursor: "pointer",
    padding: "8px 12px",
    borderRadius: 4,
  }),
  placeholder: (provided) => ({
    ...provided,
    color: "#9ca3af",
  }),
};

const MultiSelect = ({ label, className = "", ...props }) => (
  <div className={`w-full ${className}`}>
    {label && (
      <label className="block text-gray-700 mb-1 text-sm font-medium">
        {label}
      </label>
    )}
    <ReactSelect
      {...props}
      isMulti
      isSearchable
      closeMenuOnSelect={false}
      menuPortalTarget={document.body}
      styles={{ ...multiSelectStyles, ...(props.styles || {}) }}
      classNamePrefix="react-select"
    />
  </div>
);

export default MultiSelect;