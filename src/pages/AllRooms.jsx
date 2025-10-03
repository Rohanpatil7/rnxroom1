import React, { useState, useMemo,useEffect  } from 'react';
// MODIFIED: Import useLocation
import { useNavigate, useLocation } from 'react-router-dom';
import Roomcard from '../components/Roomcard';
import DatePricePicker from '../components/DatePricePicker';
import BookingCart from '../components/BookingCart';


// --- SESSION: Define keys for storing booking data ---
const BOOKING_CART_KEY = 'bookingCart';
const BOOKING_DETAILS_KEY = 'bookingDetails';

function AllRooms() {
  const navigate = useNavigate(); 
  const location = useLocation(); // ADD: Get the location object

  // MODIFIED: Update the initializer for bookingDetails state
  const [bookingDetails, setBookingDetails] = useState(() => {
    // 1. Prioritize state passed from the Home page
    const homePageDetails = location.state?.initialBookingDetails;
    if (homePageDetails && homePageDetails.checkIn && homePageDetails.checkOut) {
      return homePageDetails;
    }

    // 2. Fallback to sessionStorage
    const savedDetails = sessionStorage.getItem(BOOKING_DETAILS_KEY);
    if (savedDetails) {
      try {
        const parsedDetails = JSON.parse(savedDetails);
        // Ensure dates are Date objects
        return {
          ...parsedDetails,
          checkIn: parsedDetails.checkIn ? new Date(parsedDetails.checkIn) : null,
          checkOut: parsedDetails.checkOut ? new Date(parsedDetails.checkOut) : null,
        };
      } catch (e) {
        console.error("Could not parse booking details from session storage", e);
      }
    }
    
    // 3. Fallback to default values
    return {
      checkIn: null,
      checkOut: null,
      nights: 0,
      adults: 1, 
      children: 0,
    };
  });
  
  // --- SESSION: Initialize cart from sessionStorage or an empty array ---
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

    // --- SESSION: Save booking details and cart to sessionStorage whenever they change ---
    useEffect(() => {
      sessionStorage.setItem(BOOKING_DETAILS_KEY, JSON.stringify(bookingDetails));
      sessionStorage.setItem(BOOKING_CART_KEY, JSON.stringify(cart));
    }, [bookingDetails, cart]);
    
  // This would typically come from an API
  const rooms = useMemo(() => [
    { _id: "1", title: "Standard Room", description: "A cozy room with all the basic amenities for a comfortable stay.", pricePerNight: 3000, remainingRooms: 8, maxCapacity: 2 },
    { _id: "2", title: "Deluxe Room", description: "A more spacious room with premium furnishings and a city view.", pricePerNight: 3500, remainingRooms: 10, maxCapacity: 3 },
    { _id: "3", title: "Ultra Deluxe Room", description: "Experience luxury with our ultra deluxe room, complete with a bathtub and balcony.", pricePerNight: 4000, remainingRooms: 5, maxCapacity: 4 }
  ], []);

   // NEW: Memoized function to filter rooms based on guest count
  const filteredRooms = useMemo(() => {
    // If guests count is the default (1) or not set, show all rooms.
    if (!bookingDetails || !bookingDetails.guests || bookingDetails.guests <= 1) {
      return rooms;
    }
    // Filter rooms where max capacity is greater than or equal to the selected number of guests.
    return rooms.filter(room => room.maxCapacity >= bookingDetails.guests);
  }, [rooms, bookingDetails]);

  
  // Function to handle adding rooms to the cart
  const handleAddToCart = (baseRoom, mealOption) => {
    // Create a new, specific room object for the cart
    const roomToAdd = {
      ...baseRoom, // Copy base room properties
      _id: `${baseRoom._id}-${mealOption.desc.replace(/\s+/g, '')}`, // Create a unique ID, e.g., "2-room+Breakfast"
      title: `${baseRoom.title} (${mealOption.desc})`, // Create a descriptive title
      pricePerNight: mealOption.rate, // Use the meal plan's price
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
      if ( existingItem && existingItem.quantity === 1) {
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
    navigate('/booking', {
      state: {
        cart,
        bookingDetails,
        totalPrice
      }
    });
  };

  return (
    <div className='p-4 md:p-8 sm:p-4 pb-64'> 
      <div className='flex justify-center'>
        {/* MODIFIED: Pass initial dates to the DatePricePicker */}
        <DatePricePicker
          onDateChange={setBookingDetails}
          initialCheckIn={bookingDetails.checkIn}
          initialCheckOut={bookingDetails.checkOut}
        />
      </div>
      <div className='flex flex-col gap-4 mt-4 lg:pl-8 sm:px-0 lg:mx-24 md:mx-4 sm:mx-8 mb-4'>
        <h2 className="font-semibold justify-center flex lg:text-3xl lg:justify-start sm:text-2xl">Select Your Room</h2>
        {filteredRooms.map((room) => (
          <Roomcard
            key={room._id}
            room={room}
            bookingDetails={bookingDetails}
            onAddToCart={handleAddToCart}
          />
        ))}
      </div>

      <div className='mt-38 md:mt-42'>
      <BookingCart
        cart={cart}
        bookingDetails={bookingDetails}
        onRemove={handleRemoveFromCart}
        onAdd={(room) =>{ // The "+" button in the cart should add the same item, not a different meal plan.
             // We find the original meal option from the cart item's title to pass to handleAddToCart.
             // This is a simplification; in a real app, you might store mealOption in the cart item.
             const mealDesc = room.title.substring(room.title.indexOf('(') + 1, room.title.indexOf(')'));
             const mealOption = { desc: mealDesc, rate: room.pricePerNight };
             const baseRoomId = room._id.split('-')[0];
             const baseRoom = rooms.find(r => r._id === baseRoomId);
             if (baseRoom && mealOption) {
                handleAddToCart(baseRoom, mealOption);
             }
          }}
        totalPrice={totalPrice}
        onBookNow={handleProceedToBooking}
      />
      </div>
    </div>
  );
}

export default AllRooms;