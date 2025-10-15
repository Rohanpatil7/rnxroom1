// This relative path is non-negotiable. It MUST start with '/api' to trigger
// the proxy rule defined in your vite.config.js.
export const API_BASE = "/booking/api";

// --- Common Credentials ---
// These are static credentials from the API documentation.
const COMMON_CREDENTIALS = {
  UserName: "bookinguser",
  Password: "booking@123",
};

// --- Dynamic Hotel Parameter ---
// This function retrieves the hotel identifier from the URL's query string.
function getParameterFromUrl() {
  const params = new URLSearchParams(window.location.search);
  // Fallback to the default parameter from the documentation if not found in the URL.
  return params.get("parameter") || "QWVYSS9QVTREQjNLYzd0bjRZRTg4dz09";
}

// --- API Endpoint Configurations ---

// ✅ The 'Url' for each configuration now correctly and reliably points to the local proxy path.
export const HOTEL_DETAILS_CONFIG = {
  ...COMMON_CREDENTIALS,
  Parameter: getParameterFromUrl(),
  Url: `${API_BASE}/get_hotel_details.php`,
};

export const ROOM_RATES_CONFIG = {
  ...COMMON_CREDENTIALS,
  Parameter: getParameterFromUrl(),
  Url: `${API_BASE}/get_room_rates.php`,
};

export const TAXES_CONFIG = {
  ...COMMON_CREDENTIALS,
  Parameter: getParameterFromUrl(),
  Url: `${API_BASE}/get_taxes.php`,
};

