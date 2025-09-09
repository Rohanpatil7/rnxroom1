import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

function Costcard({ bookingData }) {
  if (!bookingData || !bookingData.dates || !bookingData.rooms) {
    return null;
  }

  const { rooms, dates, totalPrice } = bookingData;

  const roomCount = rooms.reduce((sum, room) => sum + room.quantity, 0);
  const totalGuests = 1; 

  const basePrice = totalPrice;
  const taxes = basePrice * 0.12; 
  const serviceFee = 299;
  const grandTotal = basePrice + taxes + serviceFee;

  const checkInDate = dates.checkIn ? format(new Date(dates.checkIn), 'dd MMM yyyy') : 'N/A';
  const checkOutDate = dates.checkOut ? format(new Date(dates.checkOut), 'dd MMM yyyy') : 'N/A';

  return (
    <div className='flex flex-col gap-4 shadow-md rounded-2xl bg-white '>
       <div className="img-div flex w-full">
            <img className='rounded-t-2xl object-cover h-48 w-full' src="https://images.pexels.com/photos/271639/pexels-photo-271639.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" alt="Hotel Lobby" />
       </div>

       <div className="textdata flex flex-col px-6 pt-4 space-y-2 w-full">
          <div>
               <p className='text-2xl font-semibold'>Your Stay Summary</p>
               <p className='text-gray-500 font-medium text-sm'>{roomCount} {roomCount > 1 ? 'Rooms' : 'Room'} Booked</p>
          </div>
           
           <div className='flex gap-0 my-2 font-medium flex-col'>
                <div className="date-see flex gap-1.5 mb-0">
                    <p>{checkInDate}</p><span>-</span>
                    <p>{checkOutDate}</p>
                </div>

               <div className="guest-count flex gap-2.5 mb-0">
                    <p>{dates.nights} Night{dates.nights > 1 ? 's' : ''}</p>
                    <p>Guests: {totalGuests}</p>
               </div>
           </div>

           <div className='text-gray-500 italic font-medium text-[12px] mt-1'>
                <p> ← <Link to="/rooms" className="hover:underline">Edit Stay Details</Link></p>
           </div>
       </div>

       <div className='my-2 flex justify-center px-6'>
         <hr className='w-full' />
       </div>

       <div className='flex flex-col gap-2 px-6 pb-4'>
           <h3 className='font-semibold text-lg'>Charges Summary</h3>

           {/* --- CHANGE: Dynamically list each room type from the cart --- */}
           {rooms.map((room) => (
             <div key={room.roomId} className='flex justify-between text-gray-600 text-sm'>
                <p>{room.quantity} x {room.title}</p>
                <p>₹{(room.quantity * room.pricePerNight * dates.nights).toLocaleString('en-IN')}</p>
             </div>
           ))}
           {/* --- End of Change --- */}

           <hr className='my-1 border-dashed' />

           <div className='flex justify-between text-gray-800 font-medium'>
                <p>Total Room Cost</p>
                <p>₹{basePrice.toLocaleString('en-IN')}</p>
           </div>

           <div className='flex justify-between text-gray-600'>
                <p>GST (12%)</p>
                <p>₹{taxes.toFixed(0).toLocaleString('en-IN')}</p>
           </div>
           <div className='flex justify-between text-gray-600'>
                <p>Service Fee</p>
                <p>₹{serviceFee.toLocaleString('en-IN')}</p>
           </div>
           <hr className='my-2' />
           <div className='flex justify-between font-bold text-black'>
                <p>Grand Total</p>
                <p>₹{grandTotal.toFixed(0).toLocaleString('en-IN')}</p>
           </div>
       </div>
    </div>
  )
}

export default Costcard;

