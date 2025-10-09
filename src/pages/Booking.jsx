// src/pages/Booking.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import Costcard from '../components/Costcard';
import Guestcounter from '../components/Gueatcounter';
import Guestinfo from '../components/Guestinfo';
import BillingContact from '../components/BillingContact';
import { getTaxes } from '../api/api_services';
import initiateEasebuzzPayment from '../utils/easebuzz'; // Import the Easebuzz utility

const BOOKING_DETAILS_KEY = 'currentBookingDetails';

function Booking({ hotelData }) {
  const location = useLocation();
  const [step, setStep] = useState('guest-count');
  const [bookingData, setBookingData] = useState({
    details: null,
    guestCounts: {},
    childrenAges: {},
  });
  
  const [guestInformation, setGuestInformation] = useState(null);
  const [taxData, setTaxData] = useState(null);

  useEffect(() => {
    const initialDetails = location.state?.bookingDetails || JSON.parse(sessionStorage.getItem(BOOKING_DETAILS_KEY));
    if (initialDetails) {
        const initialCounts = {};
        const initialAges = {};
        if (initialDetails.rooms) {
            initialDetails.rooms.forEach(room => {
                for (let i = 0; i < room.quantity; i++) {
                    const instanceId = `${room.roomId}_${i}`;
                    initialCounts[instanceId] = { adults: 1, children: 0 };
                    initialAges[instanceId] = [];
                }
            });
        }
        setBookingData({
            details: initialDetails,
            guestCounts: initialCounts,
            childrenAges: initialAges,
        });
    } else {
        console.error("No booking details found.");
    }
  }, [location.state]);

  const handleGuestConfirm = ({ guestCounts, childrenAges, extraAdultCost, extraChildCost }) => {
    setBookingData(prev => {
      const updatedDetails = {
        ...prev.details,
        extraAdultCost,
        extraChildCost,
      };
      sessionStorage.setItem(BOOKING_DETAILS_KEY, JSON.stringify(updatedDetails));
      return {
        ...prev,
        details: updatedDetails,
        guestCounts,
        childrenAges,
      };
    });
    setStep('guest-details');
  };

  useEffect(() => {
    const fetchTaxes = async () => {
      try {
        const data = await getTaxes();
        if (data?.result?.[0]?.Taxes) {
          const taxes = data.result[0].Taxes;
          setTaxData({
            taxes: taxes,
            totalGstPercentage: taxes.reduce((sum, tax) => sum + parseFloat(tax.Percentage), 0),
          });
        } else {
          console.warn("Tax data not found in the expected format.", data);
        }
      } catch (error) {
        console.error("Failed to fetch tax data:", error);
      }
    };
    fetchTaxes();
  }, []);
  
  const handleGuestInfoChange = useCallback((info) => {
    setGuestInformation(info);
  }, []);

  // --- MODIFIED FUNCTION: Handles the final booking and payment initiation ---
  const handleBookingSubmit = async (billingDetails) => {
    if (!bookingData.details || !guestInformation || !billingDetails) {
      alert("Please ensure all booking information is complete.");
      return;
    }

    // --- 1. Calculate the final amount ---
    const { totalPrice, extraAdultCost = 0, extraChildCost = 0 } = bookingData.details;
    const taxableAmount = totalPrice + extraAdultCost + extraChildCost;
    const serviceFee = 299; // Default service fee
    const totalGstAmount = taxData?.taxes?.reduce((sum, tax) => sum + (taxableAmount * (parseFloat(tax.Percentage) / 100)), 0) || (taxableAmount * 0.18); // Default to 18%
    const grandTotal = taxableAmount + totalGstAmount + serviceFee;

    // --- 2. Prepare data to send to the backend ---
    const paymentData = {
        amount: grandTotal,
        firstname: billingDetails.fullName,
        email: billingDetails.email,
        phone: billingDetails.phone,
        productinfo: "Hotel Room Booking", // You can make this more descriptive
    };

    try {
        // --- 3. Call your backend to get the access_key ---
        const response = await fetch('http://localhost:5000/initiate-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paymentData),
        });

        const data = await response.json();

        if (data.access_key) {
            // --- 4. Initiate the payment with the received access_key ---
            initiateEasebuzzPayment(data.access_key, (paymentResponse) => {
                // --- 5. Handle the payment response from Easebuzz ---
                console.log("Easebuzz Response:", paymentResponse);
                if (paymentResponse.status === "success") {
                    // Handle a successful payment
                    alert("Payment Successful!");
                    // Here you would typically save the final booking to your database
                    // and navigate to a success page.
                } else {
                    // Handle a failed or cancelled payment
                    alert("Payment Failed or Cancelled.");
                }
            });
        } else {
            alert("Error initiating payment. Please try again.");
            console.error("API Error:", data.error);
        }
    } catch (error) {
        console.error("Failed to connect to the payment server:", error);
        alert("Could not connect to the payment server. Please check your connection and try again.");
    }
  };

  const guestInfoData = useMemo(() => {
    if (step !== 'guest-details' || !bookingData.details || !bookingData.guestCounts) {
      return [];
    }
    const roomInstanceDetails = bookingData.details.rooms.flatMap(room => 
      Array.from({ length: room.quantity }).map((_, i) => ({
        instanceId: `${room.roomId}_${i}`,
        title: room.title
      }))
    );
    return roomInstanceDetails.map(({ instanceId, title }) => ({
      instanceId,
      title,
      counts: bookingData.guestCounts[instanceId] || { adults: 1, children: 0 },
      childrenAges: bookingData.childrenAges?.[instanceId] || [],
    }));
  }, [step, bookingData.details, bookingData.guestCounts, bookingData.childrenAges]);

  if (!bookingData.details) {
    return (
        <div className="flex items-center justify-center h-screen text-xl font-semibold">
            Loading booking details...
        </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:gap-6 lg:gap-8">
          <div className="w-full md:w-3/5 space-y-6">
            {step === 'guest-count' && (
              <section aria-labelledby="guest-counter-heading">
                <h2 id="guest-counter-heading" className="sr-only">Guest and Room Selection</h2>
                <Guestcounter 
                  rooms={bookingData.details?.rooms}
                  dates={bookingData.details?.dates}
                  initialGuestCounts={bookingData.guestCounts}
                  initialChildrenAges={bookingData.childrenAges}
                  onConfirm={handleGuestConfirm}
                />
              </section>
            )}
            
            {step === 'guest-details' && (
              <>
                <section aria-labelledby="guest-info-heading">
                  <h2 id="guest-info-heading" className="sr-only">Guest Information</h2>
                  <Guestinfo 
                    guestInfoData={guestInfoData} 
                    onGuestInfoChange={handleGuestInfoChange} 
                  />
                </section>
                
                <section aria-labelledby="billing-contact-heading">
                  <h2 id="billing-contact-heading" className="sr-only">Billing Contact</h2>
                  <BillingContact onSubmitBooking={handleBookingSubmit} />
                </section>
              </>
            )}
          </div>
          <div className="w-full md:w-2/5">
            <div className="lg:sticky lg:top-8 mt-6 md:mt-0">
              <section aria-labelledby="cost-summary-heading">
                  <h2 id="cost-summary-heading" className="sr-only">Cost Summary</h2>
                  <Costcard bookingDetails={bookingData.details} hotelData={hotelData} taxData={taxData} />
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Booking;