import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import Paymentinfo from '../components/Paymentinfo.jsx';
import Costcard from '../components/Costcard.jsx';

function Payment() {
  const location = useLocation();

  // Extract the final booking data, specifically the summary needed for the cost card.
  const bookingSummaryData = location.state?.booking?.bookingSummary;

  // If a user navigates to this page directly without booking data, redirect them to the home page.
  if (!bookingSummaryData) {
    console.warn("Redirecting from Payment page because booking data is missing.");
    return <Navigate to="/" replace />;
  }

  return (
    <div className='container mx-auto px-4 py-12'>
      <div className="text-center mb-10">
        <h1 className='text-3xl md:text-4xl font-bold text-gray-800'>Complete Your Payment</h1>
        <p className='text-md text-gray-500 mt-2'>Securely enter your payment details to confirm your reservation.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* The main content area for the payment form */}
        <div className="lg:col-span-2">
          <Paymentinfo />
        </div>
        {/* The sidebar area for the cost summary */}
        <div className="lg:col-span-1">
          <Costcard bookingData={bookingSummaryData} />
        </div>
      </div>
    </div>
  );
}

export default Payment;