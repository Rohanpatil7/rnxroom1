/* eslint-disable no-unused-vars */
// src/pages/PaySuccess.jsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { saveBookingDetails } from "../api/api_services";

const BOOKING_DETAILS_KEY = "currentBookingDetails";
const TEMP_CONTACT_KEY = "tempContactDetails";
const TEMP_GUEST_COUNTS_KEY = "tempGuestCounts";

const STORAGE_KEYS_TO_CLEAR = [
  BOOKING_DETAILS_KEY,
  TEMP_GUEST_COUNTS_KEY,
  "tempChildrenAges",
  "bookingCart",
  TEMP_CONTACT_KEY,
  "tempAdditionalGuests",
  "tempShowGst",
  "tempGstDetails",
  "tempBookingStep",
];

const getHotelParam = () => {
  try {
    const data = localStorage.getItem("hotelParam");
    return data || "";
  } catch {
    return "";
  }
};

const parseEasebuzzParams = (searchParams) => {
  const params = Object.fromEntries(searchParams.entries());
  Object.keys(params).forEach((key) => {
    params[key] = decodeURIComponent(String(params[key]).replace(/\+/g, " "));
  });
  return params;
};

const extractNameParts = (firstnameParam, contactSession) => {
  let firstName = contactSession?.firstName || "";
  let lastName = contactSession?.lastName || "";

  if (!firstName || !lastName) {
    const parts = (firstnameParam || "").trim().split(" ");
    if (parts.length > 1) {
      firstName = parts.slice(0, -1).join(" ");
      lastName = parts.slice(-1).join(" ");
    } else {
      firstName = firstnameParam || "Guest";
      lastName = "User";
    }
  }
  return { firstName, lastName };
};

// eslint-disable-next-line no-unused-vars

const getMissingParamsFromPayload = (payload) => {
  const REQUIRED_FIELDS = [
    "ApiUser",
    "ApiPass",
    "parameter",
    "first_name",
    "last_name",
    "email",
    "mobile",
    "check_in_date",
    "check_out_date",
    "no_of_nights",
    "no_of_guests",
    "room_amount",
    "tax_amount",
    "grand_total",
    "payment_status",
    "payment_txn_id",
    "room_details",
  ];

  return REQUIRED_FIELDS.filter((f) => {
    const v = payload?.[f];
    return (
      v === undefined ||
      v === null ||
      v === "" ||
      (Array.isArray(v) && v.length === 0)
    );
  });
};

const PaySuccess = ({ hotelData }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [paymentDetails, setPaymentDetails] = useState(() => {
    try {
      const stored = localStorage.getItem("paymentDetails");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [saveStatus, setSaveStatus] = useState("idle");
  const [apiResponse, setApiResponse] = useState(null);
  const [apiError, setApiError] = useState(null);

  // NEW: store payload to display on UI
  const [payloadData, setPayloadData] = useState(null);

  const dataSentRef = useRef(false);

  useEffect(() => {
    const parsed = parseEasebuzzParams(searchParams);
    if (Object.keys(parsed).length > 0) {
      setPaymentDetails(parsed);
      localStorage.setItem("paymentDetails", JSON.stringify(parsed));
    }
  }, [searchParams]);

  const sendBookingToApi = async (payload) => {
    try {
      setSaveStatus("sending");
      localStorage.setItem("bookingApiPayload", JSON.stringify(payload));

      const res = await saveBookingDetails(payload);

      setApiResponse(res);
      localStorage.setItem("bookingApiResponse", JSON.stringify(res));

      if (res?.Success === true || res?.success === true) {
        setSaveStatus("success");
        STORAGE_KEYS_TO_CLEAR.forEach((k) => {
          localStorage.removeItem(k);
          sessionStorage.removeItem(k);
        });
      } else {
        setSaveStatus("error");
        setApiError(res?.Message || "Booking save failed");
      }
    } catch {
      setSaveStatus("error");
      setApiError("Server error while saving booking");
    }
  };

  useEffect(() => {
    if (!paymentDetails) return;

    const status = String(paymentDetails.status || "").toLowerCase();
    if (status !== "success") return;

    if (dataSentRef.current) return;
    dataSentRef.current = true;
    setSaveStatus("sending");

    try {
      const bookingSession = JSON.parse(localStorage.getItem(BOOKING_DETAILS_KEY) || "{}");
      const contactSession = JSON.parse(localStorage.getItem(TEMP_CONTACT_KEY) || "{}");
      const guestCounts = JSON.parse(localStorage.getItem(TEMP_GUEST_COUNTS_KEY) || "{}");

      if (!bookingSession?.rooms?.length) {
        setSaveStatus("error");
        setApiError("Booking session expired. No room data found.");
        return;
      }

      const { firstName, lastName } = extractNameParts(
        paymentDetails.firstname,
        contactSession
      );

      const formatDate = (d) =>
        d ? new Date(d).toISOString().split("T")[0] : "";
      const num = (v) => parseFloat(v || 0);

      const room_details = [];
      bookingSession.rooms.forEach((room, idx) => {
        for (let i = 0; i < room.quantity; i++) {
          const key = `${room.roomId}_${idx}_${i}`;
          const counts = guestCounts[key] || { adults: 1, children: 0 };
          const nights = bookingSession?.dates?.nights || 1;

          room_details.push({
            room_type_id: room.roomId || "",
            meal_plan_id: room.planId || 1,
            no_of_rooms: 1,
            no_of_adults: counts.adults,
            no_of_children: counts.children,
            extra_adult: 0,
            extra_child: 0,
            rate_per_night: num(room.pricePerNight),
            no_of_nights: nights,
            tax_amount: num(room.tax),
            total_amount: num(room.pricePerNight) * nights,
          });
        }
      });

      const hotelParam = getHotelParam();
      if (!hotelParam) {
        setSaveStatus("error");
        setApiError("Hotel security parameter missing.");
        return;
      }

      const payload = {
        ApiUser: import.meta.env.VITE_API_USERNAME,
        ApiPass: import.meta.env.VITE_API_PASSWORD,
        parameter: hotelParam,

        guest_title: contactSession?.title || "Mr.",
        first_name: firstName,
        last_name: lastName,

        email: paymentDetails?.email || contactSession?.email || "",
        mobile: paymentDetails?.phone || contactSession?.phone || "",

        no_of_guests:
          (parseInt(bookingSession?.guests?.adults) || 0) +
          (parseInt(bookingSession?.guests?.children) || 0),

        check_in_date: formatDate(bookingSession?.dates?.checkIn),
        check_out_date: formatDate(bookingSession?.dates?.checkOut),
        no_of_nights: bookingSession?.dates?.nights || 1,

        room_amount: num(bookingSession?.totalPrice),
        tax_amount: num(bookingSession?.totalTax),
        grand_total: num(paymentDetails?.amount),

        payment_status: 1,
        payment_txn_id: paymentDetails?.txnid || "",
        room_details,
        payment_gateway_response: paymentDetails || {},
      };

      // Store in local & state for UI
      localStorage.setItem("bookingFinalPayload", JSON.stringify(payload));
      setPayloadData(payload);

      const missing = getMissingParamsFromPayload(payload);
      if (missing.length > 0) {
        setSaveStatus("error");
        setApiError(`Missing required booking fields: ${missing.join(", ")}`);
        return;
      }

      sendBookingToApi(payload);
    } catch {
      setSaveStatus("error");
      setApiError("Failed to process booking.");
    }
  }, [paymentDetails, hotelData]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">

      {/* SUCCESS ICON */}
        <div className="w-16 h-16 flex items-center justify-center bg-green-100 rounded-full mx-auto mb-4">
          <span className="text-green-600 text-4xl">✔</span>
        </div>

        <h2 className="text-3xl font-bold text-green-700 mb-2">
          Payment Successful!
        </h2>

        <p className="text-gray-600 mb-6">
          Your booking has been successfully confirmed.
        </p>

{/* 
      <div className="mt-6 w-full max-w-3xl bg-white border rounded p-4 shadow">

        {/* <h3 className="font-semibold mb-2">Booking API Status</h3> */}

        {/* {saveStatus === "idle" && <p>⏳ Waiting for payment details...</p>}
        {saveStatus === "sending" && <p>🚀 Saving booking...</p>}
        {saveStatus === "success" && <p className="text-green-600">✅ Booking Saved Successfully!</p>} */}
        {/* {saveStatus === "error" && (
          <p className="text-red-600">❌ Booking Failed — {apiError}</p>
        )} */}

        {/* SHOW API RESPONSE */}
        {/* {apiResponse && (
          <div className="mt-3">
            <h4 className="font-semibold">API Response</h4>
            <pre className="p-2 bg-gray-100 border rounded text-xs overflow-auto">
              {JSON.stringify(apiResponse, null, 2)}
            </pre>
          </div>
        )} */}

        {/* SHOW PAYLOAD ALWAYS */}
        {/* {payloadData && (
          <div className="mt-3">
            <h4 className="font-semibold">Payload Sent to Server</h4>
            <pre className="p-2 bg-gray-100 border rounded text-xs overflow-auto">
              {JSON.stringify(payloadData, null, 2)}
            </pre>
          </div>
        )} */}


        {/* TRANSACTION BOX */}
        <div className="border-t pt-6">
          <h3 className="font-semibold text-lg mb-4">
            Transaction Details
          </h3>

          <table className="w-full border rounded overflow-hidden">
            <tbody>

              <tr className="border-b">
                <td className="p-3 font-medium text-gray-600">Payment Status</td>
                <td className="p-3 font-semibold text-green-600">
                  {paymentDetails?.status || "NA"}
                </td>
              </tr>

              <tr className="border-b">
                <td className="p-3 font-medium text-gray-600">Transaction ID</td>
                <td className="p-3">{paymentDetails?.txnid || "NA"}</td>
              </tr>

              <tr className="border-b">
                <td className="p-3 font-medium text-gray-600">Easebuzz ID</td>
                <td className="p-3">{paymentDetails?.easepayid || "NA"}</td>
              </tr>

              <tr className="border-b">
                <td className="p-3 font-medium text-gray-600">Amount</td>
                <td className="p-3">₹{paymentDetails?.amount || "0.00"}</td>
              </tr>

              <tr className="border-b">
                <td className="p-3 font-medium text-gray-600">Email</td>
                <td className="p-3">{paymentDetails?.email || "NA"}</td>
              </tr>

              <tr className="border-b">
                <td className="p-3 font-medium text-gray-600">Phone</td>
                <td className="p-3">{paymentDetails?.phone || "NA"}</td>
              </tr>

              <tr>
                <td className="p-3 font-medium text-gray-600">Product Info</td>
                <td className="p-3">{paymentDetails?.productinfo || "Hotel Booking"}</td>
              </tr>

            </tbody>
          </table>

      </div>

      <button
        onClick={() => navigate("/")}
        className="mt-6 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
      >
        Back to Home
      </button>
    </div>
  );
};

export default PaySuccess;
