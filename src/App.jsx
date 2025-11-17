import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Home from "./pages/Home.jsx";
import AllRooms from "./pages/AllRooms.jsx";
import Booking from "./pages/Booking.jsx";
import { getHotelDetails } from "./api/api_services.js";
import PaySuccess from "./pages/Paysuccess.jsx";
import PayFailure from "./pages/Payfailure.jsx";
import {BallTriangle} from "react-loader-spinner";

function App() {
  const [hotelData, setHotelData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

   const getQueryParam = (name) => {
    let query = window.location.search;
    if (!query && window.location.hash.includes("?")) {
      query = window.location.hash.split("?")[1];
    }
    const params = new URLSearchParams(query);
    return params.get(name);
  };

  // ✅ Get URL parameter (already decoded by URLSearchParams)
  const urlParam = getQueryParam("parameter");
  
  // ✅ Get stored parameter
  const storedParam = localStorage.getItem("hotelParam");
  
  // ✅ Use URL param if available, otherwise stored
  const hotelParam = urlParam || storedParam;

   // ✅ Save to localStorage immediately if URL param exists
  if (urlParam && urlParam !== storedParam) {
    localStorage.setItem("hotelParam", urlParam);
    console.log("✅ Saved parameter to localStorage:", urlParam);
  }


  console.log("🔍 Debug Info:", {
    urlParam,
    storedParam,
    hotelParam,
    urlLength: urlParam?.length,
    storedLength: storedParam?.length
  });

  useEffect(() => {
    const fetchHotelData = async () => {
      if (!hotelParam) {
        setError("Trouble to find hotel.");
        return;
      }

      try {
        setLoading(true);

        // ✅ Save DECODED parameter from URL
        if (urlParam) {
          localStorage.setItem("hotelParam", urlParam);
          console.log("✅ Saved to localStorage:", urlParam);
        }

        // ✅ Use parameter directly (already decoded by URLSearchParams)
        const data = await getHotelDetails(hotelParam);

        if (data?.result?.[0]) {
          if (data.result[0].Error) {
            setError(` ${data.result[0].Error}`);
            
            // ✅ Clear localStorage if API says invalid
            if (data.result[0].Error.includes("Truble to find hotel")) {
              // localStorage.removeItem("hotelParam");
            }
          } else {
            setHotelData(data.result[0]);
            setError(null);
          }
        } else {
          setError("Received invalid data format from the hotel details API.");
        }
      } catch (err) {
        console.error("Failed to fetch hotel data:", err);
        setError(err.message || "An unknown network error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchHotelData();
  }, [hotelParam, urlParam]);

  // ✅ Loading UI
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-xl font-semibold">
        <BallTriangle
      height={100}
      width={100}
      radius={5}
      color="#3d52f2"
      ariaLabel="ball-triangle-loading"
      wrapperStyle={{}}
      wrapperClass=""
      visible={true}
/>
      </div>
    );
  }

  // ✅ Error UI
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-xl font-semibold text-red-600">
        Error: {error}
      </div>
    );
  }

  // ✅ Initial (no data) UI
  if (!hotelData) {
    return (
      <div className="flex items-center justify-center h-screen text-xl font-semibold">
        Please provide a hotel parameter in the URL.
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      <Navbar hotelData={hotelData} />
      <div className="h-fit relative">
        <Routes >
          {/* Redirect all unknown routes to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
          <Route path="/" element={<Home hotelData={hotelData} />} />
          <Route
            path="/allrooms"
            element={<AllRooms hotelData={hotelData} room />}
          />
          <Route
            path="/booking/new"
            element={<Booking hotelData={hotelData} />}
          />
          <Route path="/payment-success" element={<PaySuccess />} />
          <Route path="/payment-failure" element={<PayFailure />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
