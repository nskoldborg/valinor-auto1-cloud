import { useAuth } from "../context/AuthContext";
import { useAccess } from "../context/AccessContext";

const Protected = ({ role, anyOf, allOf, children }) => {
  const { hasRole, user } = useAuth();
  const { hasAnyPermission, hasAllPermissions } = useAccess();

  // Block if no user yet
  if (!user) return null;

  // Admin sees everything
  if (user.roles?.includes("admin")) {
    return children;
  }

  // OLD PATTERN: Single role check (backwards compatible)
  if (role && !hasRole(role)) {
    return null;
  }

  // NEW PATTERN: Check any of multiple permissions
  if (anyOf && !hasAnyPermission(anyOf)) {
    return null;
  }

  // NEW PATTERN: Check all of multiple permissions
  if (allOf && !hasAllPermissions(allOf)) {
    return null;
  }

  // If no restrictions specified, show to all authenticated users
  return children;
};

export default Protected;