/**
 * @file This service handles application-wide navigation utilities.
 * NOTE: The legacy tenant logic and localStorage usage have been removed.
 */

// If you need specific navigation, define it here:

/**
 * Directs the user to the main dashboard or home page after an operation.
 * @param {function} navigate - The navigate function from react-router-dom.
 */
export const goToHome = (navigate) => {
  navigate("/home");
};


// The old function is kept as a commented legacy reference for history:
/*
export const goBackToTenant = (navigate) => {
  const tenantId = localStorage.getItem("selectedTenant");
  if (tenantId) {
    navigate(`/tenant/${tenantId}/monitors`);
  } else {
    navigate("/");
  }
};
*/