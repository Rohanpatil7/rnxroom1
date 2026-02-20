/* eslint-disable no-unused-vars */
// src/pages/Paysuccess.jsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { saveBookingDetails } from "../api/api_services";

const BOOKING_DETAILS_KEY = "currentBookingDetails";
const TEMP_CONTACT_KEY = "tempContactDetails";
const TEMP_GUEST_COUNTS_KEY = "tempGuestCounts";
const TEMP_GST_DETAILS_KEY = "tempGstDetails"; // [NEW] Added for company info

const STORAGE_KEYS_TO_CLEAR = [
  BOOKING_DETAILS_KEY,
  TEMP_GUEST_COUNTS_KEY,
  "tempChildrenAges",
  "bookingCart",
  TEMP_CONTACT_KEY,
  "tempAdditionalGuests",
  "tempShowGst",
  TEMP_GST_DETAILS_KEY, // Clear this too
  "tempBookingStep",
  "paymentDetails"
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
  const [apiError, setApiError] = useState(null);
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
      localStorage.setItem("bookingApiResponse", JSON.stringify(res));

      // Check for various success flags (API dependent)
      if (res?.Success === true || res?.success === true || res?.status === 'success' || res?.status === 'Success') {
        setSaveStatus("success");
        STORAGE_KEYS_TO_CLEAR.forEach((k) => {
          localStorage.removeItem(k);
          sessionStorage.removeItem(k);
        });
      } else {
        setSaveStatus("error");
        setApiError(res?.Message || "Booking save failed");
      }
    } catch (error) {
      setSaveStatus("error");
      setApiError("Server error while saving booking");
    }
  };

  useEffect(() => {
    if (!paymentDetails) return;

    // 1. Verify Payment Status
    const status = String(paymentDetails.status || "").toLowerCase();
    if (status !== "success") return;

    if (dataSentRef.current) return;
    dataSentRef.current = true;
    setSaveStatus("sending");

    try {
      // 2. Fetch all required session data
      const bookingSession = JSON.parse(localStorage.getItem(BOOKING_DETAILS_KEY) || "{}");
      const contactSession = JSON.parse(localStorage.getItem(TEMP_CONTACT_KEY) || "{}");
      const guestCounts = JSON.parse(localStorage.getItem(TEMP_GUEST_COUNTS_KEY) || "{}");
      const gstSession = JSON.parse(localStorage.getItem(TEMP_GST_DETAILS_KEY) || "{}"); // [NEW]

      if (!bookingSession?.rooms?.length) {
        setSaveStatus("error");
        setApiError("Booking session expired. No room data found.");
        return;
      }

      const { firstName, lastName } = extractNameParts(
        paymentDetails.firstname,
        contactSession
      );

      const formatDate = (d) => (d ? new Date(d).toISOString().split("T")[0] : "");
      const num = (v) => parseFloat(v || 0);

      const hotelParam = getHotelParam();
      const nights = bookingSession?.dates?.nights || 1;
      
      // 3. Detailed Financial Calculations
      let roomSubtotal = 0;
      let extraAdultAmount = 0;
      let extraChildAmount = 0;
      let totalGuests = 0;

      // 4. Construct Room Details with new fields
      const room_details = [];
      bookingSession.rooms.forEach((room, idx) => {
        for (let i = 0; i < room.quantity; i++) {
          const key = `${room.roomId}_${idx}_${i}`;
          const counts = guestCounts[key] || { adults: 1, children: 0 };
          
          totalGuests += (counts.adults + counts.children);

          // Calculate Extras (Assuming stored or re-calculated)
          // Note: If you have per-room extra costs stored, use them. Otherwise, use global/defaults.
          const r_extraAdults = room.extraAdults || 0; 
          const r_extraChildren = room.extraChildren || 0;
          const r_extraAdultRate = num(bookingSession.extraAdultCost) || 0; // Or room.extraAdultRate
          const r_extraChildRate = num(bookingSession.extraChildCost) || 0;

          const tariff_subtotal = num(room.pricePerNight) * nights;
          const extra_pax_subtotal = ((r_extraAdults * r_extraAdultRate) + (r_extraChildren * r_extraChildRate)) * nights;
          const room_total_amount = tariff_subtotal + extra_pax_subtotal; // Pre-tax subtotal for room
          
          const tax_amt = num(room.tax); // Per room instance tax
          
          roomSubtotal += tariff_subtotal;
          extraAdultAmount += (r_extraAdults * r_extraAdultRate * nights);
          extraChildAmount += (r_extraChildren * r_extraChildRate * nights);

          room_details.push({
            room_type_id: room.roomId || "",
            room_type_name: room.roomName || "", // [NEW]
            rate_type_id: room.rateTypeId || 2, // [NEW] Defaulting or fetching from room
            rate_type_name: room.rateTypeName || "Standard", // [NEW]
            meal_plan_id: room.planId || 1,
            meal_plan_name: room.planName || "Room Only", // [NEW]
            
            no_of_adults: counts.adults,
            extra_adult: r_extraAdults, // [NEW]
            extra_child: r_extraChildren, // [NEW]
            
            rate_per_night: num(room.pricePerNight),
            no_of_nights: nights,
            
            extra_adult_rate: r_extraAdultRate, // [NEW]
            child_rate: r_extraChildRate, // [NEW]
            
            teriff_subtotal: tariff_subtotal, // [NEW]
            extra_pax_subtotal: extra_pax_subtotal, // [NEW]
            subtotal: room_total_amount, // [NEW] (Base + Extras)
            
            discount_amount: 0, // [NEW]
            discount_percentage: 0, // [NEW]
            discount_note: "", // [NEW]
            
            taxable_amount: room_total_amount, // [NEW]
            tax_id: 1, // [NEW]
            tax_name: "GST", // [NEW]
            tax_percentage: 12, // [NEW] (Ideally calc from tax/amount)
            
            tax_amount: tax_amt,
            total_amount: room_total_amount + tax_amt, // [NEW]
            
            // [NEW] Sub-taxes (Example structure, should be dynamic if available)
            sub_taxes: [
               { tax_id: 1, tax_name: "GST", sub_tax_id: 11, sub_tax_name: "CGST", tax_percentage: 6, sub_tax_amount: tax_amt / 2 },
               { tax_id: 1, tax_name: "GST", sub_tax_id: 12, sub_tax_name: "SGST", tax_percentage: 6, sub_tax_amount: tax_amt / 2 }
            ]
          });
        }
      });

      const grandTotal = num(paymentDetails?.amount);
      const subTotal = roomSubtotal + extraAdultAmount + extraChildAmount;
      const taxAmount = num(bookingSession?.totalTax);
      const serviceCharge = 0; // Add logic if you have service fee

      // 5. Construct Final Payload with MISSING parameters
      const payload = {
        // --- Existing & Required ---
        ApiUser: import.meta.env.VITE_API_USERNAME,
        ApiPass: import.meta.env.VITE_API_PASSWORD,
        parameter: hotelParam, // Lowercase per new requirement

        // --- Guest Details ---
        guest_title: contactSession?.title || "Mr",
        first_name: firstName,
        last_name: lastName,
        email: paymentDetails?.email || contactSession?.email || "",
        mobile: paymentDetails?.phone || contactSession?.phone || "",
        
        // [NEW] Address Fields
        address_line1: contactSession?.address || "", 
        address_line2: contactSession?.city || "",
        pincode: contactSession?.zipCode || "",

        // [NEW] Company Details
        company_name: gstSession?.companyName || "",
        company_gst_no: gstSession?.registrationNumber || "",
        company_address: gstSession?.companyAddress || "",

        // --- Stay Details ---
        check_in_date: formatDate(bookingSession?.dates?.checkIn),
        check_out_date: formatDate(bookingSession?.dates?.checkOut),
        no_of_nights: nights,
        no_of_guests: totalGuests,

        // [NEW] Financial Breakdown
        room_subtotal: roomSubtotal,
        extra_adult_amount: extraAdultAmount,
        extra_child_amount: extraChildAmount,
        sub_total: subTotal,
        discount_amount: 0,
        taxable_amount: subTotal,
        tax_amount: taxAmount,
        round_off: 0,
        service_charge: serviceCharge,
        total_booking_amount: grandTotal, // Mapped from grand_total

        // --- Payment Info ---
        payment_status: "PAID", // [NEW] Changed from 1 to "PAID"
        payment_txn_id: paymentDetails?.txnid || "",
        
        // --- Details ---
        room_details: room_details,
        payment_gateway_response: paymentDetails || {},
      };

      setPayloadData(payload);
      sendBookingToApi(payload);
      
    } catch (error) {
      console.error("Payload construction error:", error);
      setSaveStatus("error");
      setApiError("Failed to process booking data.");
    }
  }, [paymentDetails, hotelData]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-16 h-16 flex items-center justify-center bg-green-100 rounded-full mx-auto mb-4">
        <span className="text-green-600 text-4xl">✔</span>
      </div>

      <h2 className="text-3xl font-bold text-green-700 mb-2">
        Payment Successful!
      </h2>

      <p className="text-gray-600 mb-6">
        Your booking has been successfully confirmed.
      </p>

      {/* Transaction Details Table */}
      <div className="mt-6 w-full max-w-3xl bg-white border rounded p-4 shadow">
        <div className="border-t pt-6">
          <h3 className="font-semibold text-lg mb-4">Transaction Details</h3>
          <table className="w-full border rounded overflow-hidden">
            <tbody>
              <tr className="border-b">
                <td className="p-3 font-medium text-gray-600">Payment Status</td>
                <td className="p-3 font-semibold text-green-600">{paymentDetails?.status || "NA"}</td>
              </tr>
              <tr className="border-b">
                <td className="p-3 font-medium text-gray-600">Transaction ID</td>
                <td className="p-3">{paymentDetails?.txnid || "NA"}</td>
              </tr>
              <tr className="border-b">
                <td className="p-3 font-medium text-gray-600">Amount</td>
                <td className="p-3">₹{paymentDetails?.amount || "0.00"}</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-gray-600">Email</td>
                <td className="p-3">{paymentDetails?.email || "NA"}</td>
              </tr>
            </tbody>
          </table>
        </div>
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