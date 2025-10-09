import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';
import AllRooms from './pages/AllRooms.jsx';
import Booking from './pages/Booking.jsx';
// This import is crucial. It uses the centralized API service.
import { getHotelDetails } from './api/api_services.js';

function App() {
  const [hotelData, setHotelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // Using an async function inside useEffect is the modern standard for fetching data.
    const fetchHotelData = async () => {
      try {
        setLoading(true);
        // Call the centralized API function. This function should use the proxy.
        const data = await getHotelDetails();

        // Check the response structure for data or an error message from the API.
        if (data?.result?.[0]) {
          if (data.result[0].Error) {
            setError(`API Error: ${data.result[0].Error}`);
          } else {
            setHotelData(data.result[0]);
            setError(null); // Clear previous errors on success
          }
        } else {
          // Handle cases where the response format is unexpected.
          setError("Received invalid data format from the hotel details API.");
        }
      } catch (err) {
        // This catches network errors (like the CORS issue) or other exceptions.
        console.error("Failed to fetch hotel data:", err);
        setError(err.message || 'An unknown network error occurred. Please check the console.');
      } finally {
        // Ensure loading is set to false whether the call succeeds or fails.
        setLoading(false);
      }
    };

    fetchHotelData();
  }, []); // The empty dependency array [] ensures this effect runs only once when the component mounts.

  // Render a loading state while the API call is in progress.
  if (loading) {
    return <div className="flex items-center justify-center h-screen text-xl font-semibold">Loading Hotel Information...</div>;
  }

  // Render an error message if the API call fails.
  if (error) {
    return <div className="flex items-center justify-center h-screen text-xl font-semibold text-red-600">Error: {error}</div>;
  }

  return (
    <div className='bg-gray-50'>
      <Navbar hotelData={hotelData} />
      <div className='h-fit relative'>
        <Routes>
          {/* Pass hotelData to the routes that need it. */}
          <Route path='/' element={<Home hotelData={hotelData} />} />
          <Route path='/allrooms' element={<AllRooms />} />
          <Route path='/booking/new' element={<Booking hotelData={hotelData} />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;

