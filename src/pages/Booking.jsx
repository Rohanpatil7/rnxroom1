// src/pages/Booking.jsx

import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Costcard from '../components/Costcard';
import Guestcounter from '../components/Gueatcounter';
// import Guestinfo from '../components/Guestinfo'; // Removed, component is not used
import BillingContact from '../components/BillingContact';
// import { getTaxes, initiatePayment } from '../api/api_services'; // Removed initiatePayment
import { getTaxes } from '../api/api_services'; // Cleaned up import
// import initiateEasebuzzPayment from '../utils/easebuzz'; // Removed, not used here
import { useHotelParam } from '../utils/useHotelParam';

const BOOKING_DETAILS_KEY = 'currentBookingDetails';

function Booking({ hotelData }) {
  const navigate = useNavigate();
  const location = useLocation();
  const hotelParam = useHotelParam();

  // 'step' state now controls which component (Guestcounter or Billing) is shown
  const [step, setStep] = useState('guest-count');
  const [bookingData, setBookingData] = useState({
    details: null,
    guestCounts: {},
    childrenAges: {},
  });

  // const [guestInformation, setGuestInformation] = useState(null); // Removed, unused
  const [taxData, setTaxData] = useState(null);
  const [totalGuestCount, setTotalGuestCount] = useState(0); // State for total guests

  useEffect(() => {
    // Load initial booking details (navigation state → sessionStorage fallback)
    let initialDetails = location.state?.bookingDetails;

    if (!initialDetails) {
      try {
        initialDetails = JSON.parse(sessionStorage.getItem(BOOKING_DETAILS_KEY));
      } catch (e) {
        console.error("Could not parse booking details from session storage", e);
      }
    }

    if (initialDetails && initialDetails.rooms) {
      sessionStorage.setItem(BOOKING_DETAILS_KEY, JSON.stringify(initialDetails));

      // --- [MODIFIED] Load guest counts from session storage if they exist ---
      const initialCounts = (() => {
        try {
          const stored = sessionStorage.getItem('tempGuestCounts');
          if (stored) return JSON.parse(stored);
        // eslint-disable-next-line no-empty
        } catch {}
        
        // --- MODIFIED: Use guest counts from deep link/previous page ---
        const counts = {};
        // Get defaults from the booking details (which got it from URL/session)
        const defaultAdults = initialDetails.guests?.adults || 1;
        const defaultChildren = initialDetails.guests?.children || 0;

        initialDetails.rooms.forEach((room, roomIndex) => {
          for (let i = 0; i < room.quantity; i++) {
            const instanceId = `${room.roomId}_${roomIndex}_${i}`;
            if (roomIndex === 0 && i === 0) {
              // Apply deep-linked/selected guests to the *first* room instance
              counts[instanceId] = { adults: defaultAdults, children: defaultChildren };
            } else {
              // Use default for all other room instances
              counts[instanceId] = { adults: 1, children: 0 };
            }
          }
        });
        return counts;
        // --- END MODIFIED ---
      })();

      const initialAges = (() => {
        try {
          const stored = sessionStorage.getItem('tempChildrenAges');
          if (stored) return JSON.parse(stored);
        // eslint-disable-next-line no-empty
        } catch {}

        // --- MODIFIED: Use children count from deep link/previous page ---
        const ages = {};
        const defaultChildren = initialDetails.guests?.children || 0;

        initialDetails.rooms.forEach((room, roomIndex) => {
          for (let i = 0; i < room.quantity; i++) {
            const instanceId = `${room.roomId}_${roomIndex}_${i}`;
             if (roomIndex === 0 && i === 0) {
               // Apply deep-linked/selected children to the *first* room instance
              ages[instanceId] = new Array(defaultChildren).fill('');
             } else {
              ages[instanceId] = [];
             }
          }
        });
        return ages;
        // --- END MODIFIED ---
      })();
      
      // Calculate initial total guests based on (potentially) stored counts
      let initialTotalGuests = 0;
      Object.values(initialCounts).forEach(counts => {
        initialTotalGuests += (counts.adults || 0) + (counts.children || 0);
      });
      // --- [END MODIFIED] ---

      setBookingData({
        details: {
          ...initialDetails,
          extraAdultCost: initialDetails.extraAdultCost || 0, // This will be updated live
          extraChildCost: initialDetails.extraChildCost || 0, // This will be updated live
        },
        guestCounts: initialCounts,
        childrenAges: initialAges,
      });
      setTotalGuestCount(initialTotalGuests); // Set initial total
    } else {
      console.error("No booking details found on initialization.");
      navigate('/allrooms');
    }
  }, [location.state, navigate]);

  // --- [DELETED] ---
  // The useEffect that listened for 'popstate' has been removed.
  // --- [END DELETED] ---

  // --- [DELETED] ---
  // The useEffect that called 'window.history.replaceState' has been removed.
  // --- [END DELETED] ---

  // --- [NEW] Handler for REAL-TIME updates from Guestcounter ---
  const handleGuestUpdate = ({ guestCounts, childrenAges, extraAdultCost, extraChildCost, totalGuests }) => {
    setBookingData(prev => ({
      ...prev,
      // Update details with new costs
      details: {
        ...prev.details,
        extraAdultCost,
        extraChildCost,
      },
      // Store the latest counts and ages
      guestCounts,
      childrenAges,
    }));
    setTotalGuestCount(totalGuests); // Set total from Guestcounter
  };
  // --- [END NEW] ---

  // --- [UPDATED] This function is now only responsible for changing the step ---
  const handleGuestConfirm = () => {
    // State is already up-to-date from handleGuestUpdate
    setStep('guest-details');

    // --- [DELETED] ---
    // The `window.history.pushState` call has been removed from here.
    // --- [END DELETED] ---
  };
  // --- [END UPDATED] ---

  useEffect(() => {
    const fetchTaxes = async () => {
      try {
        const data = await getTaxes(hotelParam);
        if (data?.result?.[0]?.Taxes) {
          const taxes = data.result[0].Taxes;
          setTaxData({
            taxes,
            totalGstPercentage: taxes.reduce((sum, tax) => sum + parseFloat(tax.Percentage), 0),
          });
        }
      } catch (error) {
        console.error("Failed to fetch tax data:", error);
      }
    };
    fetchTaxes();
  }, [hotelParam]);

  // const handleGuestInfoChange = useCallback((info) => { // Removed, unused
  //   setGuestInformation(info);
  // }, []);

  // One source of truth for service fee (match UI default 10 if not provided)
  const serviceFee = useMemo(() => {
    return Number(
      bookingData.details?.serviceFee ??
      hotelData?.serviceFee ??
      10
    );
  }, [bookingData.details?.serviceFee, hotelData?.serviceFee]);

  // Compute grandTotal using fetched taxes + service fee
  const grandTotal = useMemo(() => {
    const details = bookingData.details;
    if (!details) return 0;

    const baseTotal = Number(details.totalPrice || 0);
    // --- [MODIFIED] These values are now updated in real-time ---
    const extraAdultCost = Number(details.extraAdultCost || 0);
    const extraChildCost = Number(details.extraChildCost || 0);
    // --- [END MODIFIED] ---
    const taxable = baseTotal + extraAdultCost + extraChildCost;

    // Use fetched taxes if available; fallback to 18%
    const gstAmount =
      taxData?.taxes?.reduce(
        (sum, tax) => sum + taxable * (parseFloat(tax.Percentage) / 100),
        0
      ) ?? taxable * 0.18;

    return 1;
  }, [bookingData.details, taxData, serviceFee]);

  // ... (Removed unused payment/guest info handlers) ...

  if (!bookingData.details) {
    return (
      <div className="flex items-center justify-center h-screen text-xl font-semibold">
        Loading booking details...
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen sm:flex-col-reverse">
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 ">
        <div className="flex flex-col md:flex-row  md:gap-6 lg:gap-8">
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
                  onGuestChange={handleGuestUpdate} // <-- [NEW] Pass the live update handler
                />
              </section>
            )}

            {step === 'guest-details' && (
              <>
                <section aria-labelledby="billing-contact-heading">
                  <h2 id="billing-contact-heading" className="sr-only">Billing Contact</h2>
                  <BillingContact
                    hotelData={hotelData}
                    grandTotal={grandTotal}       // ensure gateway charges match UI
                    totalGuests={totalGuestCount}   // --- [NEW] Pass total guest count ---
                  />
                </section>
              </>
            )}
          </div>

          <div className="w-full md:w-2/5">
            <div className="lg:sticky lg:top-8 mt-6 md:mt-0">
              <section aria-labelledby="cost-summary-heading">
                <h2 id="cost-summary-heading" className="sr-only">Cost Summary</h2>
                <Costcard
                  bookingDetails={bookingData.details}
                  hotelData={hotelData}
                  taxData={taxData}
                  serviceFee={serviceFee}       // pass same fee used in total
                  grandTotal={grandTotal}       // (optional) for exact display
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