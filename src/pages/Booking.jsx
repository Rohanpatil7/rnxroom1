import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import Reviewinfo from '../components/Reviewinfo';

function Booking() {
  const location = useLocation();
  
  // 1. Correctly extract the nested bookingDetails object from the navigation state.
  const { bookingDetails } = location.state || {};

  // 2. Update the check to look for the correct properties (`.rooms` instead of `.cart`).
  //    This now matches the data structure sent from BookingCart.
  if (!bookingDetails || !bookingDetails.rooms || bookingDetails.rooms.length === 0) {
    console.warn("Redirecting because booking details are missing:", bookingDetails);
    return (
      <div className='flex justify-center items-center h-screen'>
        <div className="text-center">
            <h1 className='text-2xl font-semibold mb-2'>No booking details found.</h1>
            <p className="text-gray-600">Please select a room first.</p>
            <Navigate to="/" replace /> 
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col xl:mx-24 lg:mx-16 md:mx-8 sm:mx-4 px-4 py-6 '>
      <div className='my-4 px-4 sm:px-24 text-center'><h1 className='text-xl md:text-3xl font-semibold'>Confirm Your Booking</h1></div>
      <div className='flex justify-center'> 
        {/* 3. Pass the correctly extracted `bookingDetails` object to Reviewinfo. */}
        <Reviewinfo bookingDetails={bookingDetails} />
      </div>
    </div>
  )
}

export default Booking;
