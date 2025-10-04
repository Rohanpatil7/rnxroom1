// src/App.jsx

import React from 'react';
import Navbar from './components/Navbar.jsx';
// import Footer from './components/Footer.jsx';
import { Routes, Route,  } from 'react-router-dom';
import  { useEffect, useState, useMemo } from "react";
import axios from "axios";
import AllRooms from './pages/AllRooms.jsx';
import Home from './pages/Home.jsx';
import Booking from './pages/Booking.jsx';
// import Payment from './pages/Payment.jsx';


function App() {
  const [hotelData, setHotelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingDetails, setBookingDetails] = useState(null); 

  const requestBody = useMemo(() => {
    return {
      "UserName": "bookinguser",
      "Password": "booking@123",
      "Parameter": "QWVYSS9QVTREQjNLYzd0bjRZRTg4dz09"
    }
  }, []);

   useEffect(() => {
    axios.post("/api/get_hotel_details.php", requestBody)
      .then((response) => {
        if (response.data && response.data.result && response.data.result.length > 0) {
          setHotelData(response.data.result[0]);
        } else {
          setError("Received invalid data format from API.");
        }
        setLoading(false);
      })
      .catch((err) => {
        if (err.response) {
          setError(`Error: ${err.response.status} - ${err.message}`);
        } else {
          setError(err.message);
        }
        setLoading(false);
      });
  }, [requestBody]);

  if (loading) return <div className="status">Loading...</div>;
  if (error) return <div className="status error">Error: {error}</div>;

  return (
    <div className='bg-gray-50 '>
       <Navbar hotelData={hotelData} loading={loading} error={error} />
      <div className='h-fit relative'>
        <Routes>
          {/* 1. Pass the 'setBookingDetails' function to pages that will create a booking. */}
          <Route path='/' element={<Home hotelData={hotelData} loading={loading} error={error} setBookingDetails={setBookingDetails} />} />
          <Route path='/allrooms' element={<AllRooms  hotelData={hotelData} loading={loading} error={error} setBookingDetails={setBookingDetails} />} />

          {/* 2. Pass the 'bookingDetails' state object to the Booking page.*/}
          <Route path='/booking/new' element={<Booking hotelData={hotelData} loading={loading} error={error} bookingDetails={bookingDetails}  />} />
          {/* <Route path='/payment' element={<Payment hotelData={hotelData} loading={loading} error={error} /> */}
        </Routes>
      </div>
    </div>
  );
}

export default App;