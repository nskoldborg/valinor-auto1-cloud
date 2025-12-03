import React, { createContext, useState, useContext, useEffect } from "react";

const UIContext = createContext();

export const UIProvider = ({ children }) => {
  // Updated initial state with a cleaner, dark-mode friendly palette
  const [uiSettings, setUISettings] = useState({
    appName: "Valinor Platform", // Updated app name
    headerColor: "#0F172A", // Slate-900 (Dark background for contrast)
    logoUrl: "/icon.svg",
    backgroundColor: "#F1F5F9", // Slate-100 (Light background for contrast)
    theme: "light", // Defaulting to light theme
  });

  // Load saved settings from localStorage on startup
  useEffect(() => {
    const saved = localStorage.getItem("uiSettings");
    if (saved) {
      // Safely merge saved settings over defaults
      setUISettings(prev => ({ ...prev, ...JSON.parse(saved) }));
    }
  }, []);

  // A function to save the current state of uiSettings to localStorage
  const saveUISettings = (newSettings) => {
    // If newSettings is provided, merge it with current state before saving
    const finalSettings = newSettings ? { ...uiSettings, ...newSettings } : uiSettings;
    
    // Update state first
    setUISettings(finalSettings);
    
    // Persist to localStorage
    localStorage.setItem("uiSettings", JSON.stringify(finalSettings));
  };

  return (
    <UIContext.Provider value={{ uiSettings, setUISettings, saveUISettings }}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error("useUI must be used within a UIProvider");
  }
  return context;
};