// frontend/src/services/apiClient.js
// NOTE: Moved from utils/ to the more descriptive services/ folder.

// CRITICAL FIX: The base URL must be set to the root path
// This forces all requests to rely on the Vite/Nginx proxy configured
// in vite.config.js or nginx.conf.
const API_BASE_URL = "/";

console.log("🌍 API Base Path:", API_BASE_URL);

/**
 * Executes a fetch request to the API, automatically handling base URL
 * and error responses.
 * * NOTE: The path MUST start with a root path that the proxy is configured to catch,
 * e.g., '/api/users' or '/auth/login'.
 */
export async function apiFetch(path, options = {}) {
  // Construct the full URL using the relative base path
  // path will typically be something like "/api/users"
  const url = path.startsWith("http")
    ? path
    : `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;

  const res = await fetch(url, {
    credentials: "include", // Essential for session cookies/auth headers
    ...options,
  });

  if (!res.ok) {
    // Attempt to read error message from body if available
    let errorText = res.statusText || 'Unknown Error';
    try {
        const errorJson = await res.json();
        errorText = errorJson.detail || errorJson.message || errorText;
    } catch (e) {
        // If JSON parsing fails, use the raw response text
        errorText = await res.text();
    }
    
    throw new Error(`Request failed (${res.status}): ${errorText}`);
  }

  // Attempt to parse JSON response. Handle empty or non-JSON responses gracefully.
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return res.json().catch(() => ({}));
  }
  // Return an empty object for 204 No Content or similar non-JSON responses
  return {};
}