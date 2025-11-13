// This relative path is non-negotiable. It MUST start with '/api' to trigger
// the proxy rule defined in your vite.config.js.
export const API_BASE = "/booking/api";

// --- Common Credentials ---
// These are static credentials from the API documentation.
const COMMON_CREDENTIALS = {
  UserName: "bookinguser",
  Password: "booking@123",
};


// --- Dynamic Hotel Parameter with localStorage Support ---
// ✅ UPDATED: This function now preserves the parameter across page reloads
function getParameterFromUrl() {
  // 1️⃣ Try to get from URL first
  const params = new URLSearchParams(window.location.search);
  const urlParam = params.get("parameter");
  
  // 2️⃣ Get from localStorage as fallback
  const storedParam = localStorage.getItem("hotelParam");
  
  // 3️⃣ Use whichever is available
  const finalParam = urlParam || storedParam || "";
  
  // 4️⃣ Save to localStorage if from URL (for future page loads)
  if (urlParam && urlParam !== storedParam) {
    localStorage.setItem("hotelParam", urlParam);
    console.log("✅ Saved parameter to localStorage:", urlParam);
  }
  
  console.log("🔍 Using parameter:", finalParam);
  return finalParam;
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

