// src/pages/Booking.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import Costcard from '../components/Costcard';
import Guestcounter from '../components/Gueatcounter';
import Guestinfo from '../components/Guestinfo';
import BillingContact from '../components/BillingContact';
import axios from 'axios';

const BOOKING_DETAILS_KEY = 'currentBookingDetails';

function Booking({ hotelData }) {
  const location = useLocation();
  const [step, setStep] = useState('guest-count');
  const [bookingData, setBookingData] = useState({
    details: null,
    guestCounts: null,
    childrenAges: null,
  });
  
  const [guestInformation, setGuestInformation] = useState(null);

   // NEW STATE FOR TAX DATA
  const [taxData, setTaxData] = useState(null);

  useEffect(() => {
    const initialDetails = location.state?.bookingDetails || JSON.parse(sessionStorage.getItem(BOOKING_DETAILS_KEY));

    if (initialDetails) {
        setBookingData(prev => ({ ...prev, details: initialDetails }));
    } else {
        console.error("No booking details found.");
    }
  }, [location.state]);
const handleGuestConfirm = ({ guestCounts, childrenAges, extraAdultCost, extraChildCost }) => {
    setBookingData(prev => {
      // Create a new details object with the updated costs and preserve the original rooms data
      const updatedDetails = {
        ...prev.details,
        extraAdultCost,
        extraChildCost,
      };

      return {
        ...prev,
        details: updatedDetails,
        guestCounts,
        childrenAges,
      };
    });
    setStep('guest-details');
  };


    // ADD NEW USEEFFECT TO FETCH TAX DATA
 useEffect(() => {

    const req_body = { "UserName": "bookinguser", 
                       "Password": "booking@123", 
                       "Parameter": "QWVYSS9QVTREQjNLYzd0bjRZRTg4dz09" };

    const fetchTaxes = async () => {
      try {
        const response = await axios.post("/api/get_taxes.php", req_body);

        if (response.data && response.data.result && response.data.result[0].Taxes) {
          const taxes = response.data.result[0].Taxes;
          
          // Calculate the total GST by summing up the percentages
          const totalGstPercentage = taxes.reduce((sum, tax) => {
            return sum + parseFloat(tax.Percentage);
          }, 0);

          // Store both the individual taxes and the calculated total
          setTaxData({
            taxes: taxes,
            totalGstPercentage: totalGstPercentage,
          });
        }
      } catch (error) {
        console.error("Failed to fetch tax data:", error);
      }
    };

    fetchTaxes();
  }, []);


  // Wrap this function in useCallback
  const handleGuestInfoChange = useCallback((info) => {
    setGuestInformation(info);
  }, []); // Empty dependency array means the function is created only once
  
  const handleBookingSubmit = (billingDetails) => {
    if (!bookingData.details || !guestInformation || !billingDetails) {
      alert("Please ensure all booking information is complete.");
      return;
    }

    const { totalPrice, extraAdultCost = 0, extraChildCost = 0 } = bookingData.details;
    const gstAmount = (totalPrice + extraAdultCost + extraChildCost) * 0.12;
    const serviceFee = 299;
    const grandTotal = totalPrice + extraAdultCost + extraChildCost + gstAmount + serviceFee;

    const finalBookingPayload = {
      stayDetails: bookingData.details,
      guestCounts: bookingData.guestCounts,
      guestDetails: guestInformation.guestDetails,
      specialRequests: guestInformation.specialRequests,
      billingContact: billingDetails,
      costSummary: {
        totalRoomCost: totalPrice,
        extraAdultCost,
        extraChildCost,
        gstAmount,
        serviceFee,
        grandTotal,
      },
    };

    console.log("FINAL BOOKING PAYLOAD TO BE SENT TO PAYMENT:", finalBookingPayload);
    alert("Booking data has been compiled and logged to the console. Ready for payment processing!");
  };

  const guestInfoData = useMemo(() => {
    if (step !== 'guest-details' || !bookingData.details || !bookingData.guestCounts) {
      return [];
    }
    const roomTitleMap = new Map(
      bookingData.details.rooms.map(room => [room.roomId, room.title])
    );
    return Object.entries(bookingData.guestCounts).map(([instanceId, counts]) => {
      const lastUnderscoreIndex = instanceId.lastIndexOf('_');
      const roomId = instanceId.slice(0, lastUnderscoreIndex);
      return {
        instanceId,
        title: roomTitleMap.get(roomId) || 'Room',
        counts,
        childrenAges: bookingData.childrenAges?.[instanceId] || [],
      };
    });
  }, [step, bookingData.details, bookingData.guestCounts, bookingData.childrenAges]);

  if (!bookingData.details) {
    return (
        <div className="flex items-center justify-center h-screen">
            <div className="text-center">
                <p className="text-lg font-semibold text-gray-700">Loading booking details...</p>
            </div>
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
                  bookingDetails={bookingData.details}
                  onConfirm={handleGuestConfirm}
                  rooms={bookingData.details?.rooms}
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