import React, { useState, useEffect, useMemo, useCallback } from 'react'; // 1. Import useCallback
import { useNavigate } from 'react-router-dom';
import Costcard from '../components/Costcard';
import Guestcounter from '../components/Gueatcounter';
import Guestinfo from '../components/Guestinfo';
import BillingContact from '../components/BillingContact';
import SessionTimer from '../components/SessionTimer';
import { toast } from 'react-toastify';

const BOOKING_DETAILS_KEY = 'currentBookingDetails';
const SESSION_EXPIRY_KEY = 'sessionExpiry';

function Booking() {
  const navigate = useNavigate();
  const [step, setStep] = useState('guest-count');
  const [bookingData, setBookingData] = useState({
    details: null,
    guestCounts: null,
    childrenAges: null,
  });
  
  const [guestInformation, setGuestInformation] = useState(null);
  const [sessionExpiry, setSessionExpiry] = useState(() => {
    return sessionStorage.getItem(SESSION_EXPIRY_KEY);
  });

  // 2. Wrap the function in useCallback
  const handleSessionExpiry = useCallback(() => {
    setBookingData({ details: null, guestCounts: null, childrenAges: null });
    setSessionExpiry(null);
    sessionStorage.removeItem(BOOKING_DETAILS_KEY);
    sessionStorage.removeItem('bookingCart');
    sessionStorage.removeItem(SESSION_EXPIRY_KEY);
    sessionStorage.removeItem('guestCounterFormState');
    toast.error("Your booking session has expired. Redirecting...");
    setTimeout(() => navigate('/allrooms'), 2000);
  }, [navigate]);

  useEffect(() => {
    const savedBookingDetails = sessionStorage.getItem(BOOKING_DETAILS_KEY);
    if (!savedBookingDetails) {
      handleSessionExpiry();
    }

    const expiryTime = sessionStorage.getItem(SESSION_EXPIRY_KEY);
    if (!expiryTime || new Date().getTime() > expiryTime) {
      handleSessionExpiry();
    }
  }, [handleSessionExpiry]); // 3. Add the function to the dependency array

  // ... (the rest of the component remains the same)
  const handleGuestConfirm = ({ guestCounts, childrenAges, extraAdultCost, extraChildCost }) => {
    setBookingData(prev => {
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

  const handleGuestInfoChange = (info) => {
    setGuestInformation(info);
  };
  
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

  return (
    <div className="bg-gray-50 min-h-screen">
       {sessionExpiry && <SessionTimer expiryTimestamp={sessionExpiry} onExpiry={handleSessionExpiry} />}
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
                  <Costcard bookingDetails={bookingData.details} />
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Booking;