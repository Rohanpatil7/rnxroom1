/* eslint-disable no-unsafe-finally */
// src/pages/AllRooms.jsx

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Roomcard from '../components/Roomcard';
import DatePricePicker from '../components/DatePricePicker';
import BookingCart from '../components/BookingCart';
import { getRoomRates } from '../api/api_services.js';
import { useHotelParam } from '../utils/useHotelParam'; // ✅
import {BallTriangle} from "react-loader-spinner";

const BOOKING_CART_KEY = 'bookingCart';
// --- [FIX 1] ---
// This key MUST match the key used in Booking.jsx
const BOOKING_DETAILS_KEY = 'currentBookingDetails';
// --- [END FIX 1] ---


// Helpers (formatDateForApi, getRateForOccupancy... same as before)
const formatDateForApi = (date) => {
  if (!date) return null;
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getRateForOccupancy = (rates, adults) => {
  if (!rates) return null;
  const numAdults = adults || 1;

  if (numAdults > 4) {
    if (rates.FourthOccupancy && rates.ExtraAdultRate) {
      return rates.FourthOccupancy + (numAdults - 4) * rates.ExtraAdultRate;
    }
    return rates.FourthOccupancy;
  }

  const occupancyMap = {
    1: rates.SingleOccupancy,
    2: rates.DoubleOccupancy,
    3: rates.TripleOccupancy,
    4: rates.FourthOccupancy,
  };

  return occupancyMap[numAdults] ?? rates.SingleOccupancy;
};


function AllRooms() {
  const navigate = useNavigate();
  const location = useLocation();
  const hotelParam = useHotelParam(); // ✅ preserved parameter

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasRoomsButNoRates, setHasRoomsButNoRates] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // --- MODIFICATION: Updated state initializer with new priority logic ---
  const [bookingDetails, setBookingDetails] = useState(() => {
    // Helper functions for defaults
    const getTomorrow = () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      return tomorrow;
    };

    const getDayAfterTomorrow = () => {
      const tomorrow = getTomorrow();
      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);
      return dayAfter;
    };
    
    const defaultDetails = {
      checkIn: getTomorrow(),
      checkOut: getDayAfterTomorrow(),
      nights: 1,
      adults: 1,
      children: 0,
    };

    // Priority 1: URL Parameters (Deep Link)
    const params = new URLSearchParams(window.location.search);
    const urlCheckIn = params.get('checkin');
    const urlCheckOut = params.get('checkout');
    const urlAdults = parseInt(params.get('adults'), 10);
    const urlChildren = parseInt(params.get('children'), 10);

    // Check for valid, non-past dates in URL
    if (urlCheckIn && urlCheckOut && new Date(urlCheckIn) > new Date()) {
        const checkIn = new Date(urlCheckIn);
        const checkOut = new Date(urlCheckOut);
        const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
            checkIn,
            checkOut,
            nights,
            adults: urlAdults || 1,
            children: urlChildren || 0,
        };
    }

    // Priority 2: State from Home page navigation
    const homePageDetails = location.state?.initialBookingDetails;
    if (homePageDetails) {
        // Ensure dates are Date objects
        return {
            ...defaultDetails,
            ...homePageDetails,
            checkIn: new Date(homePageDetails.checkIn),
            checkOut: new Date(homePageDetails.checkOut),
        };
    }

    // Priority 3: Session Storage (using the *correct* key)
    const savedDetails = sessionStorage.getItem(BOOKING_DETAILS_KEY);
    if (savedDetails) {
        try {
            const parsed = JSON.parse(savedDetails);
            // We only need the date/guest part for *this* page's state
            // This is safe because Booking.jsx saves the full object
            return {
                ...defaultDetails,
                checkIn: parsed.dates?.checkIn ? new Date(parsed.dates.checkIn) : defaultDetails.checkIn,
                checkOut: parsed.dates?.checkOut ? new Date(parsed.dates.checkOut) : defaultDetails.checkOut,
                nights: parsed.dates?.nights || 1,
                adults: parsed.guests?.adults || 1,
                children: parsed.guests?.children || 0,
            };
        } catch (e) {
            console.error('Could not parse booking details', e);
            // Fall through to defaults
        }
    }

    // Priority 4: Defaults
    return defaultDetails;
  });
  // --- END OF MODIFICATION ---

  // --- 1. NEW "DRAFT" STATE ---
  // This state will be controlled by the DatePricePicker
  const [tempBookingDetails, setTempBookingDetails] = useState(bookingDetails);

  const [cart, setCart] = useState(() => {
    // ... (same as before)
    const savedCart = sessionStorage.getItem(BOOKING_CART_KEY);
    try {
      if (savedCart) return JSON.parse(savedCart);
    } catch (e) {
      console.error('Could not parse cart from session storage', e);
    }
    return [];
  });

  useEffect(() => {
    // This effect now saves the *cart*, not the booking details,
    // as booking details are saved on proceeding.
    sessionStorage.setItem(BOOKING_CART_KEY, JSON.stringify(cart));
  }, [cart]);


  useEffect(() => {
    // This effect still uses the 'isCancelled' flag for robustness
    // (e.g., if the user navigates away or hotelParam changes)
    let isCancelled = false;

    const fetchRoomRates = async () => {
      // This hook now only depends on the "confirmed" bookingDetails
      const checkInDate = formatDateForApi(bookingDetails.checkIn);

      if (!checkInDate || !hotelParam) {
        setLoading(false);
        setRooms([]);
        return;
      }
      setLoading(true);
      setError(null);
      setHasRoomsButNoRates(false);

      try {
        const params = { BookingDate: checkInDate, HotelParameter: hotelParam };
        const responseData = await getRoomRates(params);

        if (isCancelled) return;

        if (responseData?.result?.[0]?.Rooms) {
          // ... (same logic as before)
           const allApiRooms = responseData.result[0].Rooms;
          const availableRooms = allApiRooms
            .map((room) => {
              const availableMealPlans = room.MealPlans?.filter((plan) => plan.Rates) || [];
              return {
                _id: String(room.RoomTypeID),
                title: room.RoomCategory.trim(),
                description: room.Description,
                images: room.RoomImages || [],
                amenities: room.Amenities || [],
                roomPolicies: room.roomPolicies || [],
                mealPlans: availableMealPlans,
                pricePerNight: availableMealPlans[0]?.Rates?.SingleOccupancy ?? 0,
                Rates: room.MealPlans?.[0]?.Rates || null,
                ExtraAdultRate: room.ExtraAdultRate ? parseFloat(room.ExtraAdultRate) : 0,
                ExtraChildRate: room.ExtraChildRate ? parseFloat(room.ExtraChildRate) : 0,
                taxInfo: room.TaxInfo || null,
                refundable: room.Refundable === 'Yes',
                remainingRooms: 10,
                maxCapacityAdult: room.RoomMaxCapacityAdult,
                maxCapacityChild: room.RoomMaxCapacityChild,
                // --- [MODIFIED: ADD FreeChildAge] ---
                FreeChildAge: room.FreeChildAge,
                // --- [END MODIFIED] ---
                maxCapacity: room.RoomMaxCapacityAdult + room.RoomMaxCapacityChild,
              };
            })
            .filter((room) => room.mealPlans.length > 0);

          if (allApiRooms.length > 0 && availableRooms.length === 0) {
            setHasRoomsButNoRates(true);
          }
          setRooms(availableRooms);
        } else if (responseData?.result?.[0]?.Error) {
          setError(responseData.result[0].Error);
          setRooms([]);
        } else {
          setError('Could not find room data in the API response.');
          setRooms([]);
        }
      } catch (err) {
        if (isCancelled) return;
        setError(err.message || 'An unknown error occurred.');
        setRooms([]);
      } finally {
        if (isCancelled) return;
        setLoading(false);
      }
    };

    fetchRoomRates();

    return () => {
      isCancelled = true;
    };
    // This effect ONLY runs when the *confirmed* checkIn date changes
  }, [bookingDetails.checkIn, hotelParam]); 

  
  // All other functions (handleAddToCart, handleRemoveFromCart, etc.)
  // are the same.
  // ... (handleAddToCart, handleRemoveFromCart, totalPrice, handleProceedToBooking)
  const filteredRooms = useMemo(() => rooms, [rooms]);

  const handleAddToCart = (baseRoom, mealOption) => {
    // --- MODIFICATION: Use confirmed bookingDetails for rate calculation ---
    const pricePerNight = getRateForOccupancy(mealOption.Rates, bookingDetails.adults);

    if (pricePerNight === undefined || pricePerNight === null) {
      alert('This meal option is currently unavailable for the selected number of guests.');
      return;
    }

    const roomToAdd = {
      ...baseRoom,
      _id: `${baseRoom._id}-${mealOption.MealPlan.replace(/\s+/g, '')}`,
      title: `${baseRoom.title} (${mealOption.MealPlan})`,
      pricePerNight,
      selectedMealPlan: mealOption,
    };

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.room._id === roomToAdd._id);
      if (existingItem) {
        if (existingItem.quantity < roomToAdd.remainingRooms) {
          return prevCart.map((item) =>
            item.room._id === roomToAdd._id ? { ...item, quantity: item.quantity + 1 } : item
          );
        }
        return prevCart;
      }
      return [...prevCart, { room: roomToAdd, quantity: 1 }];
    });
  };

  const handleRemoveFromCart = (roomToRemove) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.room._id === roomToRemove._id);
      if (existingItem && existingItem.quantity === 1) {
        return prevCart.filter((item) => item.room._id !== roomToRemove._id);
      }
      return prevCart.map((item) =>
        item.room._id === roomToRemove._id ? { ...item, quantity: item.quantity - 1 } : item
      );
    });
  };

  const totalNights = bookingDetails.nights > 0 ? bookingDetails.nights : 0;

  const totalPrice = useMemo(() => {
    const perNightTotal = cart.reduce((total, item) => {
      return total + item.room.pricePerNight * item.quantity;
    }, 0);
    return perNightTotal * totalNights;
  }, [cart, totalNights]);

  const handleProceedToBooking = () => {
    if (loading) {
      console.warn("Booking aborted: Rates are still loading.");
      return;
    }

    // --- (This logic remains the same) ---
    const bookingDataForState = {
      rooms: cart.map((item) => {
        
        const mealPlanNameMatch = item.room.title.match(/\(([^)]+)\)/);
        const selectedMealPlanName = mealPlanNameMatch ? mealPlanNameMatch[1] : null;
        const selectedMealPlan = item.room.mealPlans.find((mp) => mp.MealPlan === selectedMealPlanName);

        return {
          roomId: item.room._id.split('-')[0],
          instanceRoomId: item.room._id,
          title: item.room.title,
          quantity: item.quantity,
          pricePerNight: item.room.pricePerNight,
          room: {
            maxOccupancy: item.room.maxCapacity,
            maxCapacityAdult: item.room.maxCapacityAdult,
            maxCapacityChild: item.room.maxCapacityChild,
            FreeChildAge: item.room.FreeChildAge, 
            ExtraAdultRate: item.room.ExtraAdultRate,
            ExtraChildRate: item.room.ExtraChildRate,
          },
          selectedMealPlan,
        };
      }).filter(Boolean),
      // --- (End of this logic) ---
      
      dates: {
        checkIn: bookingDetails.checkIn,
        checkOut: bookingDetails.checkOut,
        nights: totalNights,
      },
      guests: {
        adults: bookingDetails.adults,
        children: bookingDetails.children,
      },
      totalPrice,
    };

    if (bookingDataForState.rooms.length === 0) {
        alert("Your cart items are no longer valid for the selected dates. Please add rooms again.");
        setCart([]);
        return;
    }

    // --- [FIX 2] ---
    // Save the FULL booking data object (bookingDataForState) to session storage,
    // using the CORRECT key.
    sessionStorage.setItem(BOOKING_DETAILS_KEY, JSON.stringify(bookingDataForState));
    // --- [END FIX 2] ---

    sessionStorage.setItem(BOOKING_CART_KEY, JSON.stringify(cart));

    navigate('/booking/new', {
      state: { bookingDetails: bookingDataForState },
    });
  };
  

  // --- 2. MODIFIED UI HELPERS ---

  const openEditor = () => {
    // When editing starts, copy the "confirmed" state to the "draft" state
    setTempBookingDetails(bookingDetails);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeEditor = () => {
    setIsEditing(false);
    setCart([]); // Clear cart
    // ---
    // COMMIT the "draft" state to the "confirmed" state
    // This will trigger the useEffect to fetch rooms
    // ---
    setBookingDetails(tempBookingDetails);
  };


  const formatDate = (date) => {
    // ... (same as before)
    if (!date) return 'Not selected';
    return new Date(date).toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="p-1 md:p-1 sm:p-1 z-50 bg-white">
      {/* Sticky header */}
      <div className="sticky top-18 z-50 p-1 bg-white mb-2">
        {isEditing ? (
          <div>
            {/* --- 3. MODIFIED PICKER --- */}
            <DatePricePicker
              // The picker now updates the "draft" state
              onDateChange={(newDateInfo) => {
                setTempBookingDetails(prevDetails => ({
                  ...prevDetails,
                  ...newDateInfo
                }));
              }}
              // It reads its initial value from the "draft" state
              initialCheckIn={tempBookingDetails.checkIn}
              initialCheckOut={tempBookingDetails.checkOut}
            />
            <div className="flex justify-center items-center mt-4">
              <button
                // The "Set Dates" button now confirms the change
                onClick={closeEditor} 
                className="px-5 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
              >
                Set Dates
              </button>
            </div>
          </div>
        ) : (
          // This part is the same, it reads from the "confirmed" bookingDetails
          <div className="flex justify-center px-1">
            {/* ... (same as before) ... */}
            <div className="flex flex-col w-full  items-center justify-around gap-1  px-4 py-1">

              <div className="flex flex-row items-center gap-x-2 gap-y-1  md:text-md text-gray-700">
               
                <span className="truncate">
                  <span className="font-semibold text-indigo-500">Check-In:</span>{' '}
                  {formatDate(bookingDetails.checkIn)}
                </span>

                <span className="truncate">
                  <span className="font-semibold text-indigo-500">Check-Out:</span>{' '}
                  {formatDate(bookingDetails.checkOut)}
                </span>

                {/* --- NEW: Display Guest Count --- */}
                {/* <span className="truncate">
                  <span className="font-semibold text-indigo-500">Guests:</span>{' '}
                  {bookingDetails.adults} A, {bookingDetails.children} C
                </span> */}
                 {/* --- END NEW --- */}
              </div>

              <button
                onClick={openEditor}
                className="shrink-0 cursor-pointer text-sm md:text-md font-medium text-indigo-600 rounded px-1 hover:bg-indigo-600 hover:text-white transition"
              >
                Edit Details
              </button>

            </div>
          </div>
        )}
      </div>

      {/* Rooms (same as before) */}
      <div className="flex flex-col gap-4 mt-4 lg:pl-8 sm:px-0 lg:mx-24 md:mx-4 sm:mx-8 mb-4">
        {/* ... (same loading/error/room list logic) ... */}
         <h2 className="font-semibold flex lg:text-2xl lg:justify-start sm:text-xl">
         Rooms
        </h2>
        {loading ? (
          <div className="text-center p-10 justify-center flex align-baseline">
            <BallTriangle
              height={100}
              width={100}
              radius={5}
              color="#3d52f2"
              ariaLabel="ball-triangle-loading"
              wrapperStyle={{}}
              wrapperClass=""
              visible={true}
            />
          </div>
        ) : error ? (
          <div className="text-center p-10 text-red-500">Error: {error}</div>
        ) : filteredRooms.length > 0 ? (
          filteredRooms.map((room) => (
            <Roomcard
              key={room._id}
              room={room}
              bookingDetails={bookingDetails} // Pass confirmed details to cards
              onAddToCart={handleAddToCart}
            />
          ))
        ) : hasRoomsButNoRates ? (
          <p className="text-center text-gray-500">
            Rooms are available, but rates have not been set for this date. Please select another day.
          </p>
        ) : (
          <p className="text-center text-gray-500">
            No rooms of any kind were found for the selected dates. Please try another day.
          </p>
        )}
      </div>

      {/* Cart (same as before) */}
      <BookingCart
        cart={cart}
        bookingDetails={bookingDetails} // Pass confirmed details to cart
        onRemove={handleRemoveFromCart}
        onAdd={(room) => {
          const baseRoomId = room._id.split('-')[0];
          const baseRoom = rooms.find((r) => r._id.toString() === baseRoomId);
          const mealPlanName = room.title.substring(
            room.title.indexOf('(') + 1,
            room.title.indexOf(')')
          );

          if (baseRoom?.mealPlans) {
            const mealOption = baseRoom.mealPlans.find((mp) => mp.MealPlan === mealPlanName);
            if (mealOption) {
              handleAddToCart(baseRoom, mealOption);
            }
          }
        }}
        totalPrice={totalPrice}
        onBookNow={handleProceedToBooking}
        isLoading={loading} 
      />
    </div>
  );
}

export default AllRooms;