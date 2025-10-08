import React from 'react';
import { NavLink } from 'react-router-dom';

// Helper to format dates
const formatDate = (date) => {
  if (!date) return 'Select Date';
  return new Date(date).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// Helper to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

function Costcard({ bookingDetails, hotelData ,taxData}) {
  if (!bookingDetails) {
    return null;
  }
  
  const { rooms = [], dates = {}, totalPrice = 0, extraAdultCost = 0, extraChildCost = 0 } = bookingDetails;
  const { checkIn, checkOut, nights = 0 } = dates;
  

  // Set a default service fee, as it's not in the tax API
  
  

  const totalRooms = rooms.reduce((sum, item) => sum + item.quantity, 0);
  
   // Set a default service fee, as it's not in the tax API
  const serviceFee = 299; 
  const taxableAmount = totalPrice + extraAdultCost + extraChildCost;
  
  // Calculate the total GST amount from all individual taxes
  const totalGstAmount = taxData?.taxes?.reduce((sum, tax) => {
    return sum + (taxableAmount * (parseFloat(tax.Percentage) / 100));
  }, 0) || (taxableAmount * 0.18); // Default to 18% if data not loaded
  const grandTotal = taxableAmount + totalGstAmount + serviceFee;
  
  // Use the first hotel image, with a fallback
  const hotelImage = hotelData?.HotelImages?.[0] || "https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1925&auto=format&fit=crop";

  return (
    <div className="max-w-sm rounded-xl bg-white font-sans shadow-lg overflow-hidden ">
      <img
        className="w-full h-48 object-cover"
        src={hotelImage}
        alt="Hotel"
      />
      <div className="p-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Your Stay Summary</h2>
          <p className=" text-sm text-gray-500">{totalRooms} Room{totalRooms !== 1 ? 's' : ''} Selected</p>
          <p className="mt-3 text-sm font-medium text-gray-800">
            {formatDate(checkIn)} ----- {nights > 0 ? nights : '0'} Night{nights !== 1 ? 's' : ''} ----- {formatDate(checkOut)}
          </p>

          <NavLink to="/allrooms" className="mt-2 cursor-pointer text-xs font-medium text-indigo-400 hover:text-indigo-500">
            &larr; Edit Stay Details
          </NavLink>
        </div>

        <hr className="my-2" />

        <div>
          <div className="space-y-2">
            {rooms.map(item => (
              <div key={item.roomId} className="flex items-center justify-between text-sm">
                <p className="text-indigo-600 pr-2">{item.quantity} x {item.title}</p>
                <p className="font-medium text-gray-700 whitespace-nowrap">
                  {formatCurrency(item.quantity * item.pricePerNight * nights)}
                </p>
              </div>
            ))}
          </div>
          
          <hr className="my-2 border-t border-dotted border-gray-300" />
          
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <p className=" text-sm text-gray-600">Total Room Cost</p>
              <p className="font-medium text-gray-800">{formatCurrency(totalPrice)}</p>
            </div>
            
            {extraAdultCost > 0 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">Extra Adult Cost</p>
                    <p className="font-medium text-gray-800">{formatCurrency(extraAdultCost)}</p>
                </div>
            )}

            {extraChildCost > 0 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">Paid Child Cost</p>
                    <p className="font-medium text-gray-800">{formatCurrency(extraChildCost)}</p>
                </div>
            )}

            {/* UPDATED: Dynamically display each tax from the API */}
          {taxData?.taxes?.map(tax => (
            <div key={tax.TaxGroupID} className="flex items-center justify-between">
              <p className="text-sm text-gray-600">{tax.TaxGroupName} ({parseFloat(tax.Percentage)}%)</p>
              <p className="font-medium text-gray-800">
                {formatCurrency(taxableAmount * (parseFloat(tax.Percentage) / 100))}
              </p>
            </div>
          ))}

            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Service Fee</p>
              <p className="font-medium text-gray-800">{formatCurrency(serviceFee)}</p>
            </div>
          </div>

          <hr className="my-2" />

          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold text-indigo-700">Grand Total</p>
            <p className="text-lg font-semibold text-indigo-700">{formatCurrency(grandTotal)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Costcard;