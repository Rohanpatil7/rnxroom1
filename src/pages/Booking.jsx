import React, { useState, useEffect, useMemo } from 'react';
import Costcard from '../components/Costcard';
import Guestcounter from '../components/Guestcounter';
import Guestinfo from '../components/Guestinfo';
import BillingContact from '../components/BillingContact';

const BOOKING_DETAILS_KEY = 'currentBookingDetails';
// +++ NEW: Constants for cost calculation +++
const CHILD_AGE_LIMIT = 12;
const EXTRA_BED_COST_PER_NIGHT = 1000; // Cost in INR

function Booking() {
  const [step, setStep] = useState('guest-count');
  const [bookingData, setBookingData] = useState({
    details: null,
    guestCounts: null,
    childrenAges: null,
  });
  
  const [guestInformation, setGuestInformation] = useState(null);

  useEffect(() => {
    const savedBookingDetails = sessionStorage.getItem(BOOKING_DETAILS_KEY);
    if (savedBookingDetails) {
      try {
        const parsedDetails = JSON.parse(savedBookingDetails);
        setBookingData(prev => ({ ...prev, details: parsedDetails }));
      } catch (error) {
        console.error("Failed to parse booking details from sessionStorage:", error);
        setBookingData(prev => ({ ...prev, details: null }));
      }
    }
  }, []);

  // +++ MODIFIED: This function now calculates and stores the extra cost +++
  const handleGuestConfirm = ({ guestCounts, childrenAges }) => {
    setBookingData(prev => {
      const nights = prev.details?.dates?.nights || 0;
      let extraBedCost = 0;

      // Calculate extra cost based on children ages
      if (childrenAges && nights > 0) {
        Object.values(childrenAges).forEach(ageArray => {
          const olderChildrenCount = ageArray.filter(age => age > CHILD_AGE_LIMIT).length;
          extraBedCost += olderChildrenCount * EXTRA_BED_COST_PER_NIGHT * nights;
        });
      }

      // Create an updated details object that includes the new cost
      const updatedDetails = {
        ...prev.details,
        extraBedCost: extraBedCost,
      };

      return {
        ...prev,
        details: updatedDetails, // Use the new object with the extra cost
        guestCounts,
        childrenAges,
      };
    });
    setStep('guest-details');
  };

  const handleGuestInfoChange = (info) => {
    setGuestInformation(info);
  };
  
  // +++ MODIFIED: The final payload now includes the extra cost in its calculations +++
  const handleBookingSubmit = (billingDetails) => {
    if (!bookingData.details || !guestInformation || !billingDetails) {
      alert("Please ensure all booking information is complete.");
      return;
    }

    const { totalPrice, extraBedCost = 0 } = bookingData.details;
    const gstAmount = (totalPrice + extraBedCost) * 0.12; // GST is applied to the total service cost
    const serviceFee = 299;
    const grandTotal = totalPrice + extraBedCost + gstAmount + serviceFee;

    const finalBookingPayload = {
      stayDetails: bookingData.details,
      guestCounts: bookingData.guestCounts,
      guestDetails: guestInformation.guestDetails,
      specialRequests: guestInformation.specialRequests,
      billingContact: billingDetails,
      costSummary: {
        totalRoomCost: totalPrice,
        extraBedCost: extraBedCost,
        gstAmount,
        serviceFee,
        grandTotal,
      },
    };

    console.log("FINAL BOOKING PAYLOAD TO BE SENT TO PAYMENT:", finalBookingPayload);
    alert("Booking data has been compiled and logged to the console. Ready for payment processing!");
  };

  // The useMemo hook for guestInfoData remains unchanged
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
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:gap-6 lg:gap-8">
          <div className="w-full md:w-3/5 space-y-6">
            {step === 'guest-count' && (
              <section aria-labelledby="guest-counter-heading">
                <h2 id="guest-counter-heading" className="sr-only">Guest and Room Selection</h2>
                <Guestcounter 
                  bookingDetails={bookingData.details}
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
                  {/* The updated bookingData.details is passed to Costcard */}
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