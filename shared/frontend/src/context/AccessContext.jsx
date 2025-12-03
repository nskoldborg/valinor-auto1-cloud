import React, { createContext, useContext } from "react";
import { useAuth } from "./AuthContext";

const AccessContext = createContext();

export const AccessProvider = ({ children }) => {
  const { user, hasRole, hasAnyRole } = useAuth();

  const canAccess = (requiredRoles) => {
    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // No role requirement
    }

    if (!user) {
      console.log("canAccess - No user logged in");
      return false;
    }

    // Admin always has access
    if (user.roles?.includes("admin")) {
      console.log("canAccess - User is admin, granting access");
      return true;
    }

    // Convert single role to array
    const rolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    
    const result = hasAnyRole(rolesArray);
    console.log(`canAccess check for roles ${rolesArray}:`, result);
    return result;
  };

  return (
    <AccessContext.Provider value={{ canAccess }}>
      {children}
    </AccessContext.Provider>
  );
};

export const useAccess = () => {
  const context = useContext(AccessContext);
  if (!context) {
    throw new Error("useAccess must be used within an AccessProvider");
  }
  return context;
};