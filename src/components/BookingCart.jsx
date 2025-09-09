import React from 'react';
import { useNavigate } from 'react-router-dom';

const BookingCart = ({ cart, bookingDetails, onRemove, onAdd, totalPrice }) => {
    const navigate = useNavigate();

    if (cart.length === 0) {
        return null;
    }

    const totalNights = bookingDetails.nights > 0 ? bookingDetails.nights : 0;

    const handleBookNow = () => {
        if (totalNights === 0 || cart.length === 0) {
            console.error("Booking cannot proceed: Dates not selected or cart is empty.");
            return;
        }

        const finalBookingDetails = {
            rooms: cart.map(item => ({
                roomId: item.room._id,
                title: item.room.title,
                quantity: item.quantity,
                pricePerNight: item.room.pricePerNight
            })),
            dates: {
                checkIn: bookingDetails.checkIn,
                checkOut: bookingDetails.checkOut,
                nights: totalNights,
            },
            // NEW: Add the guest counts selected on the previous page.
            guests: {
                adults: bookingDetails.adults,
                children: bookingDetails.children,
            },
            totalPrice: totalPrice,
        };

        console.log("Redirecting to booking page with details:", finalBookingDetails);
        navigate('/booking/new', { state: { bookingDetails: finalBookingDetails } });
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.2)] z-20">
            <div className="container mx-auto p-4 lg:px-24 md:px-16 sm:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex-grow w-full md:w-auto">
                        <h3 className="text-lg font-semibold mb-2 text-gray-300 hidden md:block">Your Selection</h3>
                        <div className="flex items-center gap-4 overflow-x-auto pb-2">
                            {cart.map(item => (
                                <div key={item.room._id} className="bg-gray-700 rounded-lg p-3 flex-shrink-0 flex items-center gap-4">
                                    <div>
                                        <p className="font-bold whitespace-nowrap">{item.room.title}</p>
                                        <p className="text-sm text-gray-400">
                                            ₹{item.room.pricePerNight.toLocaleString('en-IN')}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 bg-gray-800 rounded-full px-2">
                                        <button onClick={() => onRemove(item.room)} className="text-white font-bold text-lg w-6 h-6 rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors" aria-label={`Decrease quantity of ${item.room.title}`}>-</button>
                                        <span className='font-medium text-lg'>{item.quantity}</span>
                                        <button onClick={() => onAdd(item.room)} className="text-white font-bold text-lg w-6 h-6 rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors disabled:opacity-50" aria-label={`Increase quantity of ${item.room.title}`} disabled={item.quantity >= item.room.remainingRooms}>+</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="h-12 w-px bg-gray-600 hidden lg:block mx-4"></div>
                    
                    <div className="flex-shrink-0 flex items-center justify-between md:justify-center gap-4 w-full md:w-auto">
                         <div>
                            <p className="text-xl font-bold text-right">Total: ₹{totalPrice.toLocaleString('en-IN')}</p>
                            {totalNights > 0 && (<p className="text-sm text-gray-400 text-right">for {totalNights} {totalNights > 1 ? 'nights' : 'night'}</p>)}
                            {totalNights === 0 && (<p className="text-sm text-yellow-400 font-semibold text-right">Please select dates.</p>)}
                        </div>
                        <button
                            onClick={handleBookNow} 
                            className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
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

