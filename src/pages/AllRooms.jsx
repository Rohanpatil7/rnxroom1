// src/pages/AllRooms.jsx

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Roomcard from '../components/Roomcard';
import DatePricePicker from '../components/DatePricePicker';
import BookingCart from '../components/BookingCart';
import axios from 'axios';

// --- SESSION: Define keys for storing booking data ---
const BOOKING_CART_KEY = 'bookingCart';
const BOOKING_DETAILS_KEY = 'bookingDetails';

// --- HELPER (REFACTORED): Determines rate using an object lookup ---
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

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // CORRECTED STATE INITIALIZATION
  const [bookingDetails, setBookingDetails] = useState(() => {
    const homePageDetails = location.state?.initialBookingDetails;
    const savedDetails = sessionStorage.getItem(BOOKING_DETAILS_KEY);
    
    const defaultDetails = {
      checkIn: null,
      checkOut: null,
      nights: 0,
      adults: 1,
      children: 0,
    };

    try {
      const detailsFromStorage = savedDetails ? JSON.parse(savedDetails) : {};
      const mergedDetails = { ...defaultDetails, ...detailsFromStorage, ...homePageDetails };

      return {
        ...mergedDetails,
        checkIn: mergedDetails.checkIn ? new Date(mergedDetails.checkIn) : null,
        checkOut: mergedDetails.checkOut ? new Date(mergedDetails.checkOut) : null,
      };
    } catch (e) {
      console.error("Could not parse booking details", e);
      return defaultDetails;
    }
  });

  const [cart, setCart] = useState(() => {
    const savedCart = sessionStorage.getItem(BOOKING_CART_KEY);
    try {
      if (savedCart) {
        return JSON.parse(savedCart);
      }
    } catch (e) {
      console.error("Could not parse cart from session storage", e);
    }
    return [];
  });

  useEffect(() => {
    sessionStorage.setItem(BOOKING_DETAILS_KEY, JSON.stringify(bookingDetails));
    sessionStorage.setItem(BOOKING_CART_KEY, JSON.stringify(cart));
  }, [bookingDetails, cart]);

 useEffect(() => {
    const fetchRoomRates = async () => {
      if (!bookingDetails.checkIn) {
        setLoading(false);
        setRooms([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const requestBody = {
          "UserName": "bookinguser",
          "Password": "booking@123",
          "Parameter": "QWVYSS9QVTREQjNLYzd0bjRZRTg4dz09",
          "BookingDate": "2025-10-01"
        };

        const response = await axios.post("/api/get_room_rates.php", requestBody);
        
        console.log("RAW API RESPONSE:", response.data.result[0]);

        if (response.data?.result?.[0]?.Rooms) {
          const apiRooms = response.data.result[0].Rooms.map(room => ({
            _id: String(room.RoomTypeID), // Ensure RoomTypeID is always a string
            title: room.RoomCategory.trim(), 
            description: room.Description,
            images: room.RoomImages,
            amenities: room.Amenities || [], 
            roomPolicies: room.roomPolicies || [], 
            mealPlans: room.MealPlans,
            pricePerNight: room.MealPlans?.[0]?.Rates?.SingleOccupancy,
            remainingRooms: 10,
            maxCapacity: 4,
          }));
          setRooms(apiRooms);
        } else if (response.data?.result?.[0]?.Error) {
          setError(response.data.result[0].Error);
          setRooms([]);
        } else {
          setError("Invalid data format from room rates API.");
          setRooms([]);
        }
      } catch (err) {
        if (err.response) {
            setError(`Error: ${err.response.status} - ${err.response.data?.error || err.message}`);
        } else {
            setError(err.message || 'An unknown error occurred.');
        }
        setRooms([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRoomRates();
  }, [bookingDetails.checkIn]);

  const filteredRooms = useMemo(() => {
    return rooms;
  }, [rooms]);

  const handleAddToCart = (baseRoom, mealOption) => {
    const pricePerNight = getRateForOccupancy(mealOption.Rates, bookingDetails.adults);

    if (pricePerNight === undefined || pricePerNight === null) {
      console.error("Cannot add room to cart: Price is not available for the selected occupancy.", mealOption);
      alert("This meal option is currently unavailable for the selected number of guests.");
      return;
    }

    const roomToAdd = {
      ...baseRoom,
      _id: `${baseRoom._id}-${mealOption.MealPlan.replace(/\s+/g, '')}`,
      title: `${baseRoom.title} (${mealOption.MealPlan})`,
      pricePerNight: pricePerNight,
    };
  
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.room._id === roomToAdd._id);
      if (existingItem) {
        if (existingItem.quantity < roomToAdd.remainingRooms) {
          return prevCart.map(item =>
            item.room._id === roomToAdd._id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        }
        return prevCart;
      }
      return [...prevCart, { room: roomToAdd, quantity: 1 }];
    });
  };

  const handleRemoveFromCart = (roomToRemove) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.room._id === roomToRemove._id);
      if (existingItem && existingItem.quantity === 1) {
        return prevCart.filter(item => item.room._id !== roomToRemove._id);
      }
      return prevCart.map(item =>
        item.room._id === roomToRemove._id
          ? { ...item, quantity: item.quantity - 1 }
          : item
      );
    });
  };

  const totalNights = bookingDetails.nights > 0 ? bookingDetails.nights : 0;

  const totalPrice = useMemo(() => {
    const perNightTotal = cart.reduce((total, item) => {
      return total + (item.room.pricePerNight * item.quantity);
    }, 0);
    return perNightTotal * totalNights;
  }, [cart, totalNights]);

 const handleProceedToBooking = () => {
    const bookingDataForState = {
        rooms: cart.map(item => {
            const baseRoomId = item.room._id.split('-')[0];
            const originalRoom = rooms.find(r => r._id === baseRoomId); // No more type conversion needed

            return {
                roomId: baseRoomId,
                title: item.room.title,
                quantity: item.quantity,
                pricePerNight: item.room.pricePerNight,
                room: { maxOccupancy: item.room.maxCapacity || 4 },
                mealPlans: originalRoom ? originalRoom.mealPlans : []
            };
        }),
        dates: {
            checkIn: bookingDetails.checkIn,
            checkOut: bookingDetails.checkOut,
            nights: totalNights,
        },
        guests: {
            adults: bookingDetails.adults,
            children: bookingDetails.children,
        },
        totalPrice: totalPrice,
    };

    navigate('/booking/new', {
      state: { bookingDetails: bookingDataForState }
    });
  };
  
  const formatDate = (date) => {
    if (!date) return 'Not selected';
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year:'numeric'
    });
  };

  return ( 
    <div className='p-4 md:p-8 sm:p-4 pb-6 z-50 bg-white' >
      <div className="sticky top-16 z-50  p-3 bg-white mb-2 ">
        {isEditing ? (
          <div>
            <DatePricePicker
              onDateChange={setBookingDetails}
              initialCheckIn={bookingDetails.checkIn}
              initialCheckOut={bookingDetails.checkOut}
            />
            <div className="flex justify-center md:justify-end mt-4">
              <button
                onClick={() => setIsEditing(false)}
                className="px-5 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-row justify-between items-center gap-4">
            <div className="flex flex-row flex-nowrap items-center gap-x-3 sm:gap-x-4 text-xs lg:text-[14px] text-gray-600 min-w-0">
              <div className="truncate"><span className="font-semibold text-indigo-400">Check-In:</span> {formatDate(bookingDetails.checkIn)}</div>
              <div className="truncate"><span className="font-semibold text-indigo-400">Check-Out:</span> {formatDate(bookingDetails.checkOut)}</div>
            </div>
            
            <div className="flex-shrink-0">
              <button
                onClick={() => setIsEditing(true)}
                className="md:hidden text-xs text-indigo-600 font-semibold hover:underline"
              >
                Edit
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="hidden md:block px-4 py-1.5 text-xs font-medium text-indigo-600 outline outline-indigo-500 rounded-md hover:bg-blue-700 hover:text-white"
              >
                Edit
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className='flex flex-col gap-4 mt-4 lg:pl-8 sm:px-0 lg:mx-24 md:mx-4 sm:mx-8 mb-4'>
        <h2 className="font-semibold justify-center flex lg:text-3xl lg:justify-start sm:text-2xl">Select Your Room</h2>
        {loading ? (
            <div className="text-center p-10">Loading room rates...</div>
        ) : error ? (
            <div className="text-center p-10 text-red-500">Error: {error}</div>
        ) : filteredRooms.length > 0 ? (
          filteredRooms.map((room) => (
            <Roomcard
              key={room._id}
              room={room}
              bookingDetails={bookingDetails}
              onAddToCart={handleAddToCart}
            />
          ))
        ) : (
          <p className="text-center text-gray-500">No rooms available for the selected dates.</p>
        )}
      </div>

      <BookingCart
        cart={cart}
        bookingDetails={bookingDetails}
        onRemove={handleRemoveFromCart}
        onAdd={(room) => {
          const baseRoomId = room._id.split('-')[0];
          const baseRoom = rooms.find(r => r._id.toString() === baseRoomId);
          const mealPlanName = room.title.substring(room.title.indexOf('(') + 1, room.title.indexOf(')'));
          
          if (baseRoom?.mealPlans) {
            const mealOption = baseRoom.mealPlans.find(mp => mp.MealPlan === mealPlanName);
            if (mealOption) {
               handleAddToCart(baseRoom, mealOption);
            }
          }
        }}
        totalPrice={totalPrice}
        onBookNow={handleProceedToBooking}
      />
    </div>
  );
}

export default AllRooms;