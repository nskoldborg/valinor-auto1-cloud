import React from "react";
import PropTypes from "prop-types";
import { FaSearch, FaTimes } from "react-icons/fa";

/**
 * SearchBar Component
 * A reusable search input with clear functionality and dark theme styling
 */
export const SearchBar = ({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
  onClear,
  disabled = false,
  autoFocus = false,
  icon: CustomIcon,
  size = "default",
  ...props
}) => {
  const handleClear = () => {
    if (onClear) {
      onClear();
    } else {
      onChange("");
    }
  };

  const sizeClasses = {
    sm: "py-3 pl-12 pr-6 text-sm",
    default: "py-5 pl-16 pr-6",
    lg: "py-6 pl-20 pr-8 text-lg",
  };

  const iconSizeClasses = {
    sm: "left-4 text-base",
    default: "left-6 text-lg",
    lg: "left-8 text-xl",
  };

  const Icon = CustomIcon || FaSearch;

  return (
    <div className={`relative ${className}`}>
      <div className="bg-[#0d1f33]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden transition-all duration-300 focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500/50">
        {/* Search Icon */}
        <div className={`absolute inset-y-0 ${iconSizeClasses[size]} flex items-center pointer-events-none`}>
          <Icon className="text-blue-400/50" />
        </div>

        {/* Input */}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className={`
            w-full 
            ${sizeClasses[size]}
            text-white 
            placeholder-blue-400/30 
            focus:outline-none 
            bg-transparent
            disabled:opacity-50 
            disabled:cursor-not-allowed
            transition-all
          `}
          {...props}
        />

        {/* Clear Button */}
        {value && !disabled && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-6 flex items-center text-blue-400/50 hover:text-blue-400 transition-colors duration-200"
            type="button"
            aria-label="Clear search"
          >
            <FaTimes />
          </button>
        )}
      </div>
    </div>
  );
};

SearchBar.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  onClear: PropTypes.func,
  disabled: PropTypes.bool,
  autoFocus: PropTypes.bool,
  icon: PropTypes.elementType,
  size: PropTypes.oneOf(["sm", "default", "lg"]),
};

/**
 * SearchBarWithFilters Component
 * SearchBar with additional filter buttons
 */
export const SearchBarWithFilters = ({
  value,
  onChange,
  placeholder = "Search...",
  filters = [],
  activeFilter,
  onFilterChange,
  className = "",
  ...props
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      <SearchBar
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        {...props}
      />

      {filters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => onFilterChange(filter.value)}
              className={`
                px-4 py-2 
                rounded-xl 
                text-sm font-semibold 
                transition-all duration-300
                ${
                  activeFilter === filter.value
                    ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                    : "bg-white/5 text-blue-200/70 hover:bg-white/10 border border-white/10"
                }
              `}
            >
              {filter.icon && <span className="mr-2">{filter.icon}</span>}
              {filter.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

SearchBarWithFilters.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  filters: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.node,
    })
  ),
  activeFilter: PropTypes.string,
  onFilterChange: PropTypes.func,
  className: PropTypes.string,
};

/**
 * SearchBarWithSuggestions Component
 * SearchBar with autocomplete suggestions
 */
export const SearchBarWithSuggestions = ({
  value,
  onChange,
  placeholder = "Search...",
  suggestions = [],
  onSuggestionClick,
  className = "",
  ...props
}) => {
  const [showSuggestions, setShowSuggestions] = React.useState(false);

  const handleSuggestionClick = (suggestion) => {
    onSuggestionClick(suggestion);
    setShowSuggestions(false);
  };

  return (
    <div className={`relative ${className}`}>
      <SearchBar
        value={value}
        onChange={(val) => {
          onChange(val);
          setShowSuggestions(val.length > 0 && suggestions.length > 0);
        }}
        placeholder={placeholder}
        onFocus={() => setShowSuggestions(value.length > 0 && suggestions.length > 0)}
        {...props}
      />

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <>
          {/* Backdrop to close suggestions */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowSuggestions(false)}
          />

          {/* Suggestions List */}
          <div className="absolute z-20 w-full mt-2 bg-[#0d1f33] border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-6 py-3 text-left text-white hover:bg-white/5 transition-colors duration-200 border-b border-white/5 last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <FaSearch className="text-blue-400/50 text-sm" />
                  <span>{suggestion.label || suggestion}</span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

SearchBarWithSuggestions.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  suggestions: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        value: PropTypes.any,
      }),
    ])
  ),
  onSuggestionClick: PropTypes.func.isRequired,
  className: PropTypes.string,
};

export default SearchBar;