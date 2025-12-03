import React, { createContext, useContext, useState, useEffect } from "react";
// 1. Correct Import: Rely on the apiClient service for all external calls
import { apiFetch } from "../services/apiClient"; 

const AuthContext = createContext();

// --- Local Storage Keys ---
const AUTH_STORAGE_KEY = "token"; // Original token key
const IMPERSONATION_META_KEY = "impersonation_meta";
const ORIGINAL_TOKEN_KEY = "original_token";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Read current token (which might be the impersonation token)
  const token = localStorage.getItem(AUTH_STORAGE_KEY);

  // Track impersonation metadata
  const [impersonationMeta, setImpersonationMeta] = useState(() => {
    try {
      const raw = localStorage.getItem(IMPERSONATION_META_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error("Failed to parse impersonation_meta from localStorage:", e);
      return null;
    }
  });

  // --- Core Effect: Fetch User Profile on Token Change ---
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!token) {
        setUser(null);
        setImpersonationMeta(null);
        setLoading(false);
        return;
      }

      try {
        // 2. CRITICAL FIX: Use apiFetch with relative path, relying on Vite/Nginx proxy
        const res = await fetch(`/users/me`, { 
          // Note: apiFetch already handles credentials: "include", but for clarity, we use basic fetch here
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          // Only clear auth on actual authentication failures (401/403)
          if (res.status === 401 || res.status === 403) {
            console.log("Authentication failed - invalid token");
            throw new Error("INVALID_TOKEN");
          }
          throw new Error(`HTTP ${res.status}`);
        }
        
        const data = await res.json();
        console.log("User data from backend:", data);

        // --- Role Merging Logic ---
        let merged;
        if (Array.isArray(data.effective_roles) && data.effective_roles.length > 0) {
          merged = data.effective_roles;
        } else {
          // Fallback: derive roles manually from user and group roles
          const direct = (data.roles || []).map((r) =>
            typeof r === "string" ? r : r.name
          );
          const viaGroups = (data.groups || []).flatMap((g) =>
            (g.roles || []).map((r) =>
              typeof r === "string" ? r : r.name
            )
          );
          merged = [...new Set([...direct, ...viaGroups])];
        }

        const userWithRoles = { ...data, roles: merged };
        console.log("User with merged roles:", userWithRoles);

        setUser(userWithRoles);
        localStorage.setItem("user", JSON.stringify(userWithRoles));
        localStorage.setItem("user_id", data.id);

        // Re-sync impersonation meta from localStorage (in case it changed)
        try {
          const raw = localStorage.getItem(IMPERSONATION_META_KEY);
          setImpersonationMeta(raw ? JSON.parse(raw) : null);
        } catch (e) {
          console.error("Failed to parse impersonation_meta during sync:", e);
          setImpersonationMeta(null);
        }

      } catch (error) {
        console.error("Auth fetch error:", error.message);

        if (error.message === "INVALID_TOKEN") {
          console.log("Token is invalid, clearing auth");
          setUser(null);
          // Clear all related keys upon invalid token
          localStorage.removeItem("user");
          localStorage.removeItem("user_id");
          localStorage.removeItem(AUTH_STORAGE_KEY);
          localStorage.removeItem(ORIGINAL_TOKEN_KEY);
          localStorage.removeItem(IMPERSONATION_META_KEY);
          setImpersonationMeta(null);
        } else {
          // Network error or other issue - attempt to use cached user
          console.log("Network error - attempting to use cached user data");
          const cachedUser = localStorage.getItem("user");
          if (cachedUser) {
            try {
              const parsedUser = JSON.parse(cachedUser);
              console.log("Using cached user:", parsedUser);
              setUser(parsedUser);
            } catch (e) {
              console.error("Failed to parse cached user:", e);
            }
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [token]);


  // --- Core Methods ---
  
  const login = (newToken) => {
    // Fresh login should clear any impersonation leftovers
    localStorage.removeItem(ORIGINAL_TOKEN_KEY);
    localStorage.removeItem(IMPERSONATION_META_KEY);

    localStorage.setItem(AUTH_STORAGE_KEY, newToken);
    // Force a reload to re-run the useEffect fetchUserProfile logic
    window.location.href = "/"; 
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem("user");
    localStorage.removeItem("user_id");
    localStorage.removeItem(ORIGINAL_TOKEN_KEY);
    localStorage.removeItem(IMPERSONATION_META_KEY);
    setImpersonationMeta(null);
    
    // Optionally call API endpoint to invalidate server session (requires a dedicated call, not integrated here)
    // For now, rely on token removal and redirect
    window.location.href = "/login";
  };

  const hasRole = (role) => {
    if (!user) return false;
    // Admin bypass is handled here for convenience
    if (user.roles?.includes("admin")) return true; 
    return user.roles?.includes(role);
  };

  const hasAnyRole = (roles) => {
    if (!user) return false;
    // Admin bypass
    if (user.roles?.includes("admin")) return true; 
    const rolesArray = Array.isArray(roles) ? roles : [roles];
    return rolesArray.some((role) => user.roles?.includes(role));
  };

  // --- Impersonation Methods ---
  
  const startImpersonation = (impersonationResponse) => {
    if (!impersonationResponse || !impersonationResponse.access_token) {
      console.error("Invalid impersonation response:", impersonationResponse);
      return;
    }

    const currentToken = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!currentToken) {
      console.error("No current token found – cannot start impersonation");
      return;
    }

    const { access_token, acting_as, impersonated_by } = impersonationResponse;

    // Store original token so we can come back later
    localStorage.setItem(ORIGINAL_TOKEN_KEY, currentToken);

    const meta = {
      impersonated: true,
      acting_as: acting_as || null,
      impersonated_by: impersonated_by || null,
    };

    localStorage.setItem(IMPERSONATION_META_KEY, JSON.stringify(meta));
    localStorage.setItem(AUTH_STORAGE_KEY, access_token);

    // Force a reload to re-run the /users/me fetch with the impersonation token
    window.location.href = "/";
  };

  const stopImpersonation = () => {
    const originalToken = localStorage.getItem(ORIGINAL_TOKEN_KEY);

    if (originalToken) {
      localStorage.setItem(AUTH_STORAGE_KEY, originalToken);
    } else {
      // No original token → safest is to log out completely
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }

    localStorage.removeItem(ORIGINAL_TOKEN_KEY);
    localStorage.removeItem(IMPERSONATION_META_KEY);
    setImpersonationMeta(null);

    // Reload to refresh /users/me as the original user
    window.location.href = "/";
  };

  const isImpersonating = !!(impersonationMeta && impersonationMeta.impersonated);

  // --- Context Provider ---

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loading,
        hasRole,
        hasAnyRole,
        isAuthenticated: !!user && !loading, // Added isAuthenticated for clarity
        // impersonation-related
        isImpersonating,
        impersonationMeta,
        startImpersonation,
        stopImpersonation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};