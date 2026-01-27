/* eslint-disable no-unused-vars */
// src/pages/Booking.jsx

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Costcard from '../components/Costcard';
import Guestcounter from '../components/Gueatcounter';
import BillingContact from '../components/BillingContact';
import { getTaxes } from '../api/api_services';
import { useHotelParam } from '../utils/useHotelParam';

const BOOKING_DETAILS_KEY = 'currentBookingDetails';
const TEMP_GUEST_COUNTS_KEY = 'tempGuestCounts';
const TEMP_CHILDREN_AGES_KEY = 'tempChildrenAges';

function Booking({ hotelData }) {
  const navigate = useNavigate();
  const location = useLocation();
  const hotelParam = useHotelParam();

  // ✅ Derive step from React Router location state
  const step = location.state?.step || 'guest-count';

  const [bookingData, setBookingData] = useState({
    details: null,
    guestCounts: {},
    childrenAges: {},
  });

  const [taxData, setTaxData] = useState(null);
  const [totalGuestCount, setTotalGuestCount] = useState(0);

  // Load booking details (from navigation state or sessionStorage)
  useEffect(() => {
    let initialDetails = location.state?.bookingDetails;

    if (!initialDetails) {
      try {
        initialDetails = JSON.parse(sessionStorage.getItem(BOOKING_DETAILS_KEY));

        if (
          initialDetails &&
          (initialDetails.dates === undefined ||
            initialDetails.guests === undefined ||
            initialDetails.rooms === undefined)
        ) {
          console.warn(
            'Polluted state detected in sessionStorage. Discarding.',
            initialDetails
          );
          initialDetails = null;
        }
      } catch (e) {
        console.error('Could not parse booking details from session storage', e);
        initialDetails = null;
      }
    }

    if (initialDetails && initialDetails.rooms) {
      // Save the raw details back (in case they came from navigation)
      sessionStorage.setItem(BOOKING_DETAILS_KEY, JSON.stringify(initialDetails));

      // Guest counts
      const initialCounts = (() => {
        try {
          const stored = sessionStorage.getItem(TEMP_GUEST_COUNTS_KEY);
          if (stored) return JSON.parse(stored);
        } catch {
          // ignore
        }

        const counts = {};
        const defaultAdults = initialDetails.guests?.adults || 1;
        const defaultChildren = initialDetails.guests?.children || 0;

        initialDetails.rooms.forEach((room, roomIndex) => {
          for (let i = 0; i < room.quantity; i++) {
            const instanceId = `${room.roomId}_${roomIndex}_${i}`;
            if (roomIndex === 0 && i === 0) {
              counts[instanceId] = {
                adults: defaultAdults,
                children: defaultChildren,
              };
            } else {
              counts[instanceId] = { adults: 1, children: 0 };
            }
          }
        });
        return counts;
      })();

      // Children ages
      const initialAges = (() => {
        try {
          const stored = sessionStorage.getItem(TEMP_CHILDREN_AGES_KEY);
          if (stored) return JSON.parse(stored);
        } catch {
          // ignore
        }

        const ages = {};
        const defaultChildren = initialDetails.guests?.children || 0;

        initialDetails.rooms.forEach((room, roomIndex) => {
          for (let i = 0; i < room.quantity; i++) {
            const instanceId = `${room.roomId}_${roomIndex}_${i}`;
            if (roomIndex === 0 && i === 0) {
              ages[instanceId] = new Array(defaultChildren).fill('');
            } else {
              ages[instanceId] = [];
            }
          }
        });
        return ages;
      })();

      // Initial total guests
      let initialTotalGuests = 0;
      Object.values(initialCounts).forEach((counts) => {
        initialTotalGuests += (counts.adults || 0) + (counts.children || 0);
      });

      setBookingData({
        details: {
          ...initialDetails,
          extraAdultCost: initialDetails.extraAdultCost || 0,
          extraChildCost: initialDetails.extraChildCost || 0,
        },
        guestCounts: initialCounts,
        childrenAges: initialAges,
      });
      setTotalGuestCount(initialTotalGuests);
    } else {
      console.error(
        'No booking details found on initialization (or state was polluted). Navigating to rooms.'
      );
      navigate('/allrooms');
    }
    // ✅ Only re-run when URL (path/search) changes, not when location.state.step changes
  }, [location.state?.bookingDetails, navigate]);

  // 🔑 REAL-TIME updates from Guestcounter
  const handleGuestUpdate = useCallback(
    ({
      guestCounts,
      childrenAges,
      extraAdultCost,
      extraChildCost,
      totalGuests,
    }) => {
      setBookingData((prev) => {
        if (!prev.details) return prev;

        const updatedDetails = {
          ...prev.details,
          extraAdultCost,
          extraChildCost,
        };

        const nextState = {
          ...prev,
          details: updatedDetails,
          guestCounts,
          childrenAges,
        };

        // ✅ Persist EVERYTHING so back/forward restores latest state
        try {
          sessionStorage.setItem(
            BOOKING_DETAILS_KEY,
            JSON.stringify(updatedDetails)
          );
          sessionStorage.setItem(
            TEMP_GUEST_COUNTS_KEY,
            JSON.stringify(guestCounts)
          );
          sessionStorage.setItem(
            TEMP_CHILDREN_AGES_KEY,
            JSON.stringify(childrenAges)
          );
        } catch (e) {
          console.warn('Failed to persist booking state to sessionStorage', e);
        }

        return nextState;
      });

      setTotalGuestCount(totalGuests);
    },
    []
  );

  // Move from guest count to guest details
  const handleGuestConfirm = () => {
    // ✅ FIX: Pass the updated bookingData.details (containing calculated costs)
    // instead of relying on the potentially stale location.state.
    navigate('.', {
      state: {
        ...(location.state || {}),
        bookingDetails: bookingData.details, // <--- Passing the updated state here
        step: 'guest-details',
      },
    });
  };

  // Fetch taxes
  useEffect(() => {
    const fetchTaxes = async () => {
      try {
        const data = await getTaxes(hotelParam);
        if (data?.result?.[0]?.Taxes) {
          const taxes = data.result[0].Taxes;
          setTaxData({
            taxes,
            totalGstPercentage: taxes.reduce(
              (sum, tax) => sum + parseFloat(tax.Percentage),
              0
            ),
          });
        }
      } catch (error) {
        console.error('Failed to fetch tax data:', error);
      }
    };
    fetchTaxes();
  }, [hotelParam]);

  // Service fee
  const serviceFee = useMemo(() => {
    const details = bookingData.details;
    if (!details) return 0;
    return Number(
      details.serviceFee ??
        hotelData?.ServiceCharges ??
        hotelData?.serviceFee ??
        10
    );
  }, [bookingData.details, hotelData?.ServiceCharges, hotelData?.serviceFee]);

  // Grand total (base + extras + tax + service)
  const grandTotal = useMemo(() => {
    const details = bookingData.details;
    if (!details) return 0;

    const baseTotal = Number(details.totalPrice || 0);
    const extraAdultCost = Number(details.extraAdultCost || 0);
    const extraChildCost = Number(details.extraChildCost || 0);
    const taxable = baseTotal + extraAdultCost + extraChildCost;

    const gstAmount =
      taxData?.taxes?.reduce(
        (sum, tax) => sum + taxable * (parseFloat(tax.Percentage) / 100),
        0
      ) ?? taxable * 0.18;

    return 1;
  }, [bookingData.details, taxData, serviceFee]);

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
        <div className="flex flex-col md:flex-row md:gap-6 lg:gap-8">
          {/* LEFT: step content */}
          <div className="w-full md:w-3/5 space-y-6">
            {step === 'guest-count' && (
              <section aria-labelledby="guest-counter-heading">
                <h2 id="guest-counter-heading" className="sr-only">
                  Guest and Room Selection
                </h2>
                <Guestcounter
                  rooms={bookingData.details?.rooms}
                  dates={bookingData.details?.dates}
                  initialGuestCounts={bookingData.guestCounts}
                  initialChildrenAges={bookingData.childrenAges}
                  onConfirm={handleGuestConfirm}
                  onGuestChange={handleGuestUpdate}
                />
              </section>
            )}

            {step === 'guest-details' && (
              <section aria-labelledby="billing-contact-heading">
                <h2 id="billing-contact-heading" className="sr-only">
                  Billing Contact
                </h2>
                <BillingContact
                  hotelData={hotelData}
                  grandTotal={grandTotal}
                  totalGuests={totalGuestCount}
                />
              </section>
            )}
          </div>

          {/* RIGHT: Cost summary (always visible) */}
          <div className="w-full md:w-2/5">
            <div className="lg:sticky lg:top-8 mt-6 md:mt-0">
              <section aria-labelledby="cost-summary-heading">
                <h2 id="cost-summary-heading" className="sr-only">
                  Cost Summary
                </h2>
                <Costcard
                  bookingDetails={bookingData.details}
                  hotelData={hotelData}
                  taxData={taxData}
                  serviceFee={serviceFee}
                  grandTotal={grandTotal}
                  extraAdultCost={bookingData.details?.extraAdultCost || 0}
                  extraChildCost={bookingData.details?.extraChildCost || 0}
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