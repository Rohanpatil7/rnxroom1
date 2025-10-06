// src/App.jsx

import React from 'react';
import Navbar from './components/Navbar.jsx';
import { Routes, Route } from 'react-router-dom';
import { useEffect, useState } from "react";
import axios from "axios";
import AllRooms from './pages/AllRooms.jsx';
import Home from './pages/Home.jsx';
import Booking from './pages/Booking.jsx';

function App() {
  const [hotelData, setHotelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingDetails, setBookingDetails] = useState(null);

  useEffect(() => {
    // Revert to sending a plain JavaScript object
    const requestBody = {
      // ==> IMPORTANT: REPLACE WITH YOUR REAL CREDENTIALS <==
      "UserName": "bookinguser",
      "Password": "booking@123",
      "Parameter": "QWVYSS9QVTREQjNLYzd0bjRZRTg4dz09",
    };

    axios.post("/api/get_hotel_details.php", requestBody)
      .then((response) => {
        if (response.data && response.data.result && response.data.result.length > 0) {
          setHotelData(response.data.result[0]);
        } else if (response.data?.result?.[0]?.Error) {
          setError(response.data.result[0].Error);
        } else {
          setError("Received invalid data format from API.");
        }
        setLoading(false);
      })
      .catch((err) => {
        if (err.response) {
          setError(`Error: ${err.response.status} - ${err.response.data?.error || err.message}`);
        } else {
          setError(err.message);
        }
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="status">Loading...</div>;
  if (error) return <div className="status error">Error: {error}</div>;

  return (
    <div className='bg-gray-50 '>
       <Navbar hotelData={hotelData} loading={loading} error={error} />
      <div className='h-fit relative'>
        <Routes>
          <Route path='/' element={<Home hotelData={hotelData} loading={loading} error={error} setBookingDetails={setBookingDetails} />} />
          <Route path='/allrooms' element={<AllRooms  hotelData={hotelData} loading={loading} error={error} setBookingDetails={setBookingDetails} />} />
          <Route path='/booking/new' element={<Booking hotelData={hotelData} loading={loading} error={error} bookingDetails={bookingDetails}  />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;