import { API_CONFIG } from '../apis/api_config';

// Helper for consistent headers/body
const getCommonParams = () => {
  const adminToken = sessionStorage.getItem("adminToken");
  const hotelParam = localStorage.getItem("hotelParam");
  return { adminToken, hotelParam };
};

export const adminLogin = async (username, password) => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/get_admin_login.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ApiUser: API_CONFIG.API_USER,
        ApiPass: API_CONFIG.API_PASS,
        UserName: username,
        Password: password
      }),
    });
    const data = await response.json();
    
    if (data?.result?.length > 0 && data.result[0].Userid) {
        return data; 
    }
    
    return null; // Return null if credentials didn't match

  } catch (error) {
    throw new Error(error.message);
  }
};

export const fetchBookingRegister = async (fromDate, toDate) => {
  try {
    const { hotelParam } = getCommonParams();
    
    // Default to current month if dates aren't provided
    if (!fromDate || !toDate) {
      const date = new Date();
      const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
      const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      fromDate = fromDate || firstDay.toISOString().split('T')[0];
      toDate = toDate || lastDay.toISOString().split('T')[0];
    }

    const response = await fetch(`${API_CONFIG.BASE_URL}/booking_register.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ApiUser: API_CONFIG.API_USER,
        ApiPass: API_CONFIG.API_PASS,
        parameter: hotelParam,
        FromDate: fromDate,
        ToDate: toDate
      }),
    });
    
    const data = await response.json();
    return data; // Returns { status: 1, count: X, data: [...] }
  } catch (error) {
    console.error("Fetch Bookings Error:", error);
    return { status: 0, data: [] };
  }
};

export const fetchCancellationReport = async (fromDate, toDate) => {
  try {
    const { hotelParam } = getCommonParams();

    const response = await fetch(`${API_CONFIG.BASE_URL}/cancellation_report.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ApiUser: API_CONFIG.API_USER,
        ApiPass: API_CONFIG.API_PASS,
        Parameter: hotelParam,
        CancellationFromDate: fromDate,
        CancellationToDate: toDate
      }),
    });

    const data = await response.json();
    return data; 
  } catch (error) {
    console.error("Fetch Cancellations Error:", error);
    return { status: 0, cancellations: [] };
  }
};

//
export const fetchRepeatGuests = async (mobileNo) => {
  try {
    const { hotelParam } = getCommonParams();

    const response = await fetch(`${API_CONFIG.BASE_URL}/get_repeat_guests.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ApiUser: API_CONFIG.API_USER,
        ApiPass: API_CONFIG.API_PASS,
        parameter: hotelParam,
        MobileNo: mobileNo
      }),
    });

    const data = await response.json();
    return data; 
  } catch (error) {
    console.error("Fetch Repeat Guests Error:", error);
    return { status: 0, RepeatGuests: [] };
  }
};


//

export const fetchGuestBookingHistory = async (guestName, mobileNo) => {
  try {
    const { hotelParam } = getCommonParams();

    const response = await fetch(`${API_CONFIG.BASE_URL}/get_guest_booking_history.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ApiUser: API_CONFIG.API_USER,
        ApiPass: API_CONFIG.API_PASS,
        parameter: hotelParam,
        GuestName: guestName, // PascalCase
        MobileNo: mobileNo
      }),
    });

    const data = await response.json();
    return data; 
  } catch (error) {
    console.error("Fetch Guest History Error:", error);
    return { BookingHistory: [] };
  }
};

// ... existing imports and functions

export const fetchRoomBookingStatus = async (fromDate, toDate) => {
  try {
    const { hotelParam } = getCommonParams();

    // Default to current month if dates aren't provided
    if (!fromDate || !toDate) {
      const date = new Date();
      const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
      const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      fromDate = fromDate || firstDay.toISOString().split('T')[0];
      toDate = toDate || lastDay.toISOString().split('T')[0];
    }

    const response = await fetch(`${API_CONFIG.BASE_URL}/hotel_room_booking_status.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ApiUser: API_CONFIG.API_USER,
        ApiPass: API_CONFIG.API_PASS,
        Parameter: hotelParam, // Note: The API doc specifies "Parameter" with a capital 'P'
        FromDate: fromDate,
        ToDate: toDate
      }),
    });

    const data = await response.json();
    return data; 
  } catch (error) {
    console.error("Fetch Room Status Error:", error);
    return null;
  }
};

// Add this to src/admin/apis/admin_api.js

export const fetchBookingsByCustomerName = async (guestName) => {
  try {
    const { hotelParam } = getCommonParams();

    const response = await fetch(`${API_CONFIG.BASE_URL}/get_bookings_by_customer_name.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ApiUser: API_CONFIG.API_USER,
        ApiPass: API_CONFIG.API_PASS,
        Parameter: hotelParam, // API Doc specifies "Parameter" with capital P [cite: 276]
        GuestName: guestName   // [cite: 277]
      }),
    });

    const data = await response.json();
    return data; 
  } catch (error) {
    console.error("Fetch by Name Error:", error);
    return { status: 0, bookings: [] };
  }
};

// ===============================
// SUMMARY REPORT API CALL
// ===============================
export const fetchSummaryReport = async ({ FromDate, ToDate }) => {
  const { hotelParam } = getCommonParams();
  const response = await fetch(`${API_CONFIG.BASE_URL}/summary_report.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ApiUser: API_CONFIG.API_USER,
      ApiPass: API_CONFIG.API_PASS,
      Parameter: hotelParam,
      FromDate,
      ToDate,
    }),
  });

  return response.json();
};

// ---------------------------------------------------------
// NEW: Fetch Bookings by Mobile Number (PDF Reference #7)
// ---------------------------------------------------------
export const fetchBookingsByMobile = async (mobileNo) => {
  try {
    const { hotelParam } = getCommonParams();

    const response = await fetch(`${API_CONFIG.BASE_URL}/get_bookings_from_mob.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ApiUser: API_CONFIG.API_USER,
        ApiPass: API_CONFIG.API_PASS,
        Parameter: hotelParam, // [cite: 312]
        MobileNo: mobileNo     // [cite: 313]
      }),
    });

    const data = await response.json();
    return data; // Returns { status: 1, bookings: [...] } [cite: 318]
  } catch (error) {
    console.error("Fetch by Mobile Error:", error);
    return { status: 0, bookings: [] };
  }
};