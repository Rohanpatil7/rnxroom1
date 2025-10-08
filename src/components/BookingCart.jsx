// src/components/BookingCart.jsx

import React, { useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';

const BOOKING_DETAILS_KEY = 'currentBookingDetails';

const BookingCart = ({ cart, bookingDetails, onRemove, onAdd, totalPrice, onBookNow }) => {
    const totalNights = bookingDetails.nights > 0 ? bookingDetails.nights : 0;

    useEffect(() => {
        const currentBookingDetails = {
            rooms: cart.map(item => ({
                roomId: item.room._id.split('-')[0],
                title: item.room.title,
                quantity: item.quantity,
                pricePerNight: item.room.pricePerNight,
                room: {
                    maxOccupancy: item.room.maxCapacity || 4
                }
            })),
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
        
        sessionStorage.setItem(BOOKING_DETAILS_KEY, JSON.stringify(currentBookingDetails));

    }, [cart, bookingDetails, totalPrice, totalNights]);

    const handleBookNow = () => {
        if (totalNights === 0 || cart.length === 0) {
            console.error("Booking cannot proceed: Dates not selected or cart is empty.");
            return;
        }
        
        onBookNow(); 
    };

    if (cart.length === 0) {
        return null;
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.2)] z-20">
            <div className="container mx-auto p-2 md:p-4 lg:px-24 md:px-16 sm:px-4">
                <div className="flex flex-col md:flex-row justify-between items-center gap-2 md:gap-4">
                    
                    <div className="flex-grow w-full md:w-auto">
                        <h3 className="text-lg font-semibold mb-2 text-gray-300 hidden md:block">Your Selection</h3>
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 ">
                            {cart.map(item => (
                                <div key={item.room._id || item.room.id} className="bg-gray-700 rounded-lg p-2 flex-shrink-0 flex flex-col items-center gap-2 over max-w-[250px]">
                                    <div className='flex flex-col gap-1 items-center' >
                                        <p className="text-sm md:text-base font-semibold whitespace-wrap">{item.room.title}</p>
                                           
                                        <div className="flex items-center gap-2  px-2">
                                            <div> <p className="text-xs md:text-sm  text-indigo-300">
                                                ₹{item.room.pricePerNight.toLocaleString('en-IN')}
                                            </p>
                                            </div>

                                            <div className='flex items-center gap-2 bg-gray-800 rounded-full'>
                                            <button onClick={() => onRemove(item.room)} className="text-white font-bold text-base w-5 h-5 sm:text-lg sm:w-6 sm:h-6 rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors cursor-pointer" aria-label={`Decrease quantity of ${item.room.title}`}>-</button>
                                            <span className='font-medium text-base sm:text-xs'>{item.quantity}</span>
                                            <button onClick={() => onAdd(item.room)} className="text-white font-bold text-base w-5 h-5 sm:text-lg sm:w-6 sm:h-6 rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors disabled:opacity-50 cursor-pointer" aria-label={`Increase quantity of ${item.room.title}`} disabled={item.quantity >= item.room.remainingRooms}>+</button>
                                            </div>
                                           
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="h-12 w-px bg-gray-600 hidden lg:block mx-4"></div>
                    
                    <div className="flex-shrink-0 flex items-center justify-between md:justify-center gap-4 w-full md:w-auto">
                         <div>
                            <p className="text-lg md:text-xl font-bold text-right">Total: ₹{totalPrice.toLocaleString('en-IN')}</p>
                            {totalNights > 0 && (<p className="text-xs md:text-sm text-gray-400 text-right">for {totalNights} {totalNights > 1 ? 'nights' : 'night'}</p>)}
                            {totalNights === 0 && (<p className="text-xs md:text-sm text-yellow-400 font-semibold text-right">Please select dates.</p>)}
                        </div>
                        <button
                            onClick={handleBookNow} 
                            className="bg-indigo-600 text-white font-bold text-sm md:text-base py-2 px-5 md:py-3 md:px-8 rounded-xl hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors whitespace-nowrap cursor-pointer"
                            disabled={totalNights === 0 || totalPrice === 0}
                        >
                            Book Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingCart;