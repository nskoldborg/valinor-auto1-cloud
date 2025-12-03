import { useMemo } from "react";
// Import the authentication hook to get user and permissions
import { useAuth } from "../context/AuthContext"; 
// Import useAccess for clean role checking (optional, but good practice)
// import { useAccess } from "../context/AccessContext"; 


/**
 * Converts user's assignable lists into structured options for Select components,
 * and determines high-level assignment permissions.
 * * @param {Array} allGroups - Full list of all available groups.
 * @param {Array} allTenants - Full list of all available tenants.
 * @param {Array} allPositions - Full list of all available positions.
 * @param {Array} allRoles - Full list of all available roles.
 * @returns {object} - Structured options and boolean flags.
 */
export function useAssignableOptions(allGroups, allTenants, allPositions, allRoles = []) {
  // Retrieve the current user and authentication status
  const { user: currentUser } = useAuth();
  
  // Helper function to check for role inclusion
  const isAdminLike = (requiredRoles) => {
    if (!currentUser || !currentUser.roles) return false;
    
    // Lowercase the required role names for case-insensitive check
    const lowerRequiredRoles = requiredRoles.map((n) => n.toLowerCase());
    
    return currentUser.roles.some((r) =>
      lowerRequiredRoles.includes(r.toLowerCase())
    );
  };

  return useMemo(() => {
    if (!currentUser) {
      return {
        groupOptions: [],
        roleOptions: [],
        tenantOptions: [],
        positionOptions: [],
        canAssign: { groups: false, roles: false, tenants: false, positions: false, countries: false },
        allGroups: allGroups,
        allRoles: allRoles,
        allTenants: allTenants,
        allPositions: allPositions,
      };
    }
    
    // --- Data Transformation: Map assignable arrays to {value, label} objects ---
    
    // NOTE: The backend API /users/me returns assignable_X properties, 
    // which are used here to filter the options available to the current user.
    
    const groupOptions = (currentUser.assignable_groups || []).map((g) => ({
      value: g.id,
      label: g.name,
    }));

    const roleOptions = (currentUser.assignable_roles || []).map((r) => ({
      value: r.id,
      label: r.name,
    }));

    const tenantOptions = (currentUser.assignable_tenants || []).map((t) => ({
      value: t.id,
      label: t.name,
    }));

    const positionOptions = (currentUser.assignable_positions || []).map((p) => ({
      value: p.id,
      label: p.name,
    }));
    
    const countryOptions = (currentUser.assignable_countries || []).map((c) => ({
        value: c.id,
        label: c.name || c.code, // Assuming country objects have id and name/code
    }));

    // --- Permission Check: Can the user perform assignment actions? ---
    
    const canAssign = {
      groups: isAdminLike([
        "admin",
        "route:users#can-assign-groups",
      ]),
      roles: isAdminLike([
        "admin",
        "route:users#can-assign-roles",
      ]),
      tenants: isAdminLike([
        "admin",
        "route:users#can-assign-tenants",
      ]),
      positions: isAdminLike([
        "admin",
        "route:users#can-assign-positions",
      ]),
      // Added countries check based on backend data
      countries: isAdminLike([
        "admin",
        "route:users#can-assign-countries",
      ]),
    };

    return {
      groupOptions,
      roleOptions,
      tenantOptions,
      positionOptions,
      countryOptions, // Added country options
      canAssign,
      // Provide full lists (unfiltered) for scenarios where they are needed (e.g., display tables)
      allGroups: allGroups,
      allRoles: allRoles,
      allTenants: allTenants,
      allPositions: allPositions,
    };
  }, [currentUser, allGroups, allTenants, allPositions, allRoles]);
}