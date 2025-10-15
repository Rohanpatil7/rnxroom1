import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Costcard from '../components/Costcard';
import Guestcounter from '../components/Gueatcounter';
import Guestinfo from '../components/Guestinfo';
import BillingContact from '../components/BillingContact';
import { getTaxes, initiatePayment } from '../api/api_services';
import initiateEasebuzzPayment from '../utils/easebuzz';

const BOOKING_DETAILS_KEY = 'currentBookingDetails';

function Booking({ hotelData }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [step, setStep] = useState('guest-count');
  const [bookingData, setBookingData] = useState({
    details: null,
    guestCounts: {},
    childrenAges: {},
  });
  
  const [guestInformation, setGuestInformation] = useState(null);
  const [taxData, setTaxData] = useState(null);
  
  // --- State for extra adult and child costs ---
  const [extraAdultCost, setExtraAdultCost] = useState(0);
  const [extraChildCost, setExtraChildCost] = useState(0);

  // src/pages/Booking.jsx

  // ... (imports and component definition)

  useEffect(() => {
    const initialDetails = location.state?.bookingDetails || JSON.parse(sessionStorage.getItem(BOOKING_DETAILS_KEY));
    
    if (initialDetails && initialDetails.rooms) {
        const initialCounts = {};
        const initialAges = {};
        
        initialDetails.rooms.forEach((room, roomIndex) => {
            // Loop through the quantity of each room type
            for (let i = 0; i < room.quantity; i++) {
                // ✅ CORRECTED: Create a unique three-part key for each room instance
                const instanceId = `${room.roomId}_${roomIndex}_${i}`;
                
                initialCounts[instanceId] = { adults: 1, children: 0 };
                initialAges[instanceId] = [];
            }
        });
        
        setBookingData({
            details: initialDetails,
            guestCounts: initialCounts,
            childrenAges: initialAges,
        });

        // Initialize extra costs if they exist
        if (initialDetails.extraAdultCost) {
            setExtraAdultCost(initialDetails.extraAdultCost);
        }
        if (initialDetails.extraChildCost) {
            setExtraChildCost(initialDetails.extraChildCost);
        }
        
    } else {
        console.error("No booking details found on initialization.");
        // Optional: Redirect if no data is available
        // navigate('/allrooms');
    }
  }, [location.state, navigate]);

  // ... (rest of the component)
  // --- Updated confirmation handler ---
  const handleGuestConfirm = ({ guestCounts, childrenAges, extraAdultCost, extraChildCost }) => {
    setBookingData(prev => ({
      ...prev,
      guestCounts,
      childrenAges,
    }));
    setExtraAdultCost(extraAdultCost);
    setExtraChildCost(extraChildCost);
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

  // --- Payment response handler ---
  const handlePaymentResponse = (response) => {
    console.log("Easebuzz Response:", response);
    if (response.status === "success") {
      console.log("✅ Payment Successful!");
      navigate('/paymentsuccess');
    } else {
      console.log("❌ Payment Failed or Cancelled.");
      navigate('/paymentfailure');
    }
  };
  
  const handleBookingSubmit = async (billingDetails) => {
    if (!bookingData.details || !guestInformation || !billingDetails) {
      alert("Please ensure all booking information is complete.");
      return;
    }

    const { totalPrice } = bookingData.details;
    const taxableAmount = totalPrice + extraAdultCost + extraChildCost;
    const serviceFee = 299;
    const totalGstAmount =
      taxData?.taxes?.reduce(
        (sum, tax) => sum + taxableAmount * (parseFloat(tax.Percentage) / 100),
        0
      ) || taxableAmount * 0.18;
    const grandTotal = taxableAmount + totalGstAmount + serviceFee;

    const paymentData = {
      txnid: `TXN-${Date.now()}`,
      amount: grandTotal,
      firstname: billingDetails.fullName,
      email: billingDetails.email,
      phone: billingDetails.phone,
      productinfo: "Hotel Room Booking",
    };

    try {
      const data = await initiatePayment(paymentData);

      if (data.status === 1 && data.data) {
        initiateEasebuzzPayment(data.data,handlePaymentResponse);
      } else {
        alert("Error initiating payment. Please try again.");
        console.error("API Error:", data.msg || data.error);
      }
    } catch (error) {
      console.error("Failed to connect to backend payment API:", error);
      alert("Could not connect to the payment server. Please check your internet connection and try again.");
    }
  };

  const guestInfoData = useMemo(() => {
    if (step !== 'guest-details' || !bookingData.details || !bookingData.guestCounts) {
      return [];
    }
    const roomInstanceDetails = bookingData.details.rooms.flatMap((room, roomIndex) => 
      Array.from({ length: room.quantity }).map((_, i) => ({
        instanceId: `${room.roomId}_${roomIndex}_${i}`,  // UNIQUE KEY FIX
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

  // --- Pass the latest extra costs to Costcard ---
  const finalBookingDetails = {
    ...bookingData.details,
    extraAdultCost,
    extraChildCost,
  };

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
                   <Costcard 
                      bookingDetails={finalBookingDetails} 
                      hotelData={hotelData} 
                      taxData={taxData} 
                   />
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Booking;
