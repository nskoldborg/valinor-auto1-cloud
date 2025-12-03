import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "./AuthContext"; // Import AuthContext to get user permissions
// Removed unused import: import { apiFetch } from "../services/apiClient"; 

const CountryContext = createContext();

export const CountryProvider = ({ children }) => {
  // Get user object and loading state directly from AuthContext
  const { user, loading: authLoading } = useAuth(); 
  
  // State for user-selected filters
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [selectedLocale, setSelectedLocale] = useState("en");

  // --- Logic 1: Derive Available Countries from User Object ---
  const availableCountries = useMemo(() => {
    // 1. If user data is not loaded or assignable_countries is missing, return only 'All'.
    if (authLoading || !user || !user.assignable_countries) {
        return [{ id: 'all', name: 'All Countries', code: 'all' }];
    }

    // 2. Ensure 'all' is the primary option
    const allOption = { id: 'all', name: 'All Countries', code: 'all' };

    // 3. Use the list provided by the API in the user object
    // Assuming assignable_countries is an array of country objects {id, name, code}
    const userCountries = user.assignable_countries || [];

    return [allOption, ...userCountries];
  }, [authLoading, user]);

  // --- Logic 2: Cleanup selectedCountry if user access changes ---
  useEffect(() => {
      if (!user || authLoading) return;

      // Check if the currently selected country is still in the available list
      const isSelectedCountryAvailable = availableCountries.some(c => c.id === selectedCountry);

      if (!isSelectedCountryAvailable) {
          // Reset selection to 'all' if the user's permissions changed (e.g., impersonation switch)
          setSelectedCountry("all");
      }
      
  }, [availableCountries, selectedCountry, user, authLoading]);


  // --- Logic 3: Persistence (Unchanged but cleaned) ---

  // Load selected country/locale from localStorage on mount (persistence)
  useEffect(() => {
    const storedCountry = localStorage.getItem("selectedCountry");
    const storedLocale = localStorage.getItem("selectedLocale");
    if (storedCountry) setSelectedCountry(storedCountry);
    if (storedLocale) setSelectedLocale(storedLocale);
  }, []);

  // Persist on change
  useEffect(() => {
    localStorage.setItem("selectedCountry", selectedCountry);
  }, [selectedCountry]);

  useEffect(() => {
    localStorage.setItem("selectedLocale", selectedLocale);
  }, [selectedLocale]);

  // --- Context Value ---

  const contextValue = useMemo(() => ({
    selectedCountry,
    setSelectedCountry,
    selectedLocale,
    setSelectedLocale,
    availableCountries,
    // The countries are loaded once the user object is available
    countriesLoading: authLoading, 
  }), [
    selectedCountry,
    selectedLocale,
    availableCountries,
    authLoading,
  ]);

  return (
    <CountryContext.Provider value={contextValue}>
      {children}
    </CountryContext.Provider>
  );
};

export const useCountry = () => {
  const context = useContext(CountryContext);
  if (!context) {
    throw new Error("useCountry must be used within a CountryProvider");
  }
  return context;
};