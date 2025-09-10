import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom'; // 1. Import useNavigate
import Roomcard from '../components/Roomcard';
import DatePricePicker from '../components/DatePricePicker';
import BookingCart from '../components/BookingCart';

function AllRooms() {
  const navigate = useNavigate(); // 2. Initialize the navigate function
  const [bookingDetails, setBookingDetails] = useState({
    checkIn: null,
    checkOut: null,
    nights: 0,
    guests: 1,
  });

  const [cart, setCart] = useState([]);

  // This would typically come from an API
  const rooms = [
    { _id: "1", title: "Standard Room", description: "A cozy room with all the basic amenities for a comfortable stay.", pricePerNight: 3000, remainingRooms: 8, maxCapacity: 2 },
    { _id: "2", title: "Deluxe Room", description: "A more spacious room with premium furnishings and a city view.", pricePerNight: 3500, remainingRooms: 10, maxCapacity: 3 },
    { _id: "3", title: "Ultra Deluxe Room", description: "Experience luxury with our ultra deluxe room, complete with a bathtub and balcony.", pricePerNight: 4000, remainingRooms: 5, maxCapacity: 4 }
  ];

  const handleAddToCart = (roomToAdd) => {
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
      if (existingItem.quantity === 1) {
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

  // 3. Create the function to handle the redirect and data passing
  const handleProceedToBooking = () => {
    // Navigate to the '/booking' page and pass all necessary data in the 'state' object
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
        <DatePricePicker onDateChange={setBookingDetails} />
      </div>
      <div className='flex flex-col gap-4 mt-4 lg:pl-8 sm:px-0 lg:mx-24 md:mx-16 sm:mx-8 mb-4'>
        <h2 className="font-semibold justify-center flex lg:text-4xl lg:justify-start sm:text-2xl">Select Your Room</h2>
        {rooms.map((room) => (
          <Roomcard
            key={room._id}
            room={room}
            bookingDetails={bookingDetails}
            onAddToCart={() => handleAddToCart(room)}
          />
        ))}
      </div>

      <BookingCart
        cart={cart}
        bookingDetails={bookingDetails}
        onRemove={handleRemoveFromCart}
        onAdd={handleAddToCart}
        totalPrice={totalPrice}
        onBookNow={handleProceedToBooking} // 4. Pass the function as a prop
      />
    </div>
  );
}

export default AllRooms;