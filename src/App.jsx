import React, { useEffect, useState } from 'react';
import { Routes, Route, useSearchParams } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';
import AllRooms from './pages/AllRooms.jsx';
import Booking from './pages/Booking.jsx';
import { getHotelDetails } from './api/api_services.js';

// Import the success and failure components
import PaySuccess from './pages/Paysuccess.jsx';
import PayFailure from './pages/Payfailure.jsx';

function App() {
  const [hotelData, setHotelData] = useState(null);
  const [loading, setLoading] = useState(false); // Set initial loading to false
  const [error, setError] = useState(null);
  const [searchParams,setSearchParams] = useSearchParams();

  // This will dynamically get whatever 'parameter' is in the URL
  const encodedParam = searchParams.get("parameter");

  useEffect(() => {
    const fetchHotelData = async () => {

      // This will cause a re-render, and the effect will run again.
      if (!encodedParam) {
        setSearchParams({ parameter: "QWVYSS9QVTREQjNLYzd0bjRZRTg4dz09" });
        return; // Stop execution for this render
      }


     // If we have a parameter, proceed to fetch the data.
      try {
        setLoading(true);
        const data = await getHotelDetails(encodedParam);

        if (data?.result?.[0]) {
          if (data.result[0].Error) {
            setError(`API Error: ${data.result[0].Error}`);
          } else {
            setHotelData(data.result[0]);
            setError(null);
          }
        } else {
          setError("Received invalid data format from the hotel details API.");
        }
      } catch (err) {
        console.error("Failed to fetch hotel data:", err);
        setError(err.message || 'An unknown network error occurred. Please check the console.');
      } finally {
        setLoading(false);
      }
    };

    fetchHotelData();
  }, [encodedParam, setSearchParams]); // Effect depends on the parameter

  // Show a loading message only when a fetch is in progress
  if (loading) {
    return <div className="flex items-center justify-center h-screen text-xl font-semibold">Loading Hotel Information...</div>;
  }

  // If there's an error (including a missing parameter), show the error.
  if (error) {
    return <div className="flex items-center justify-center h-screen text-xl font-semibold text-red-600">Error: {error}</div>;
  }

  // If there's no data and no error (initial state), you can show a generic message.
  if (!hotelData) {
      return <div className="flex items-center justify-center h-screen text-xl font-semibold">Please provide a hotel parameter in the URL.</div>
  }

  return (
    <div className='bg-gray-50'>
      <Navbar hotelData={hotelData} />
      <div className='h-fit relative'>
        <Routes>
          <Route path='/' element={<Home hotelData={hotelData} />} />
          <Route path='/allrooms' element={<AllRooms hotelData={hotelData} />} />
          <Route path='/booking/new' element={<Booking hotelData={hotelData} />} />
          
           {/* Add routes for payment status pages */}
          <Route path='/paymentsuccess' element={<PaySuccess />} />
          <Route path='/paymentfailure' element={<PayFailure />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;