import React from 'react';

// Helper to format dates (unchanged)
const formatDate = (date) => {
  if (!date) return 'Select Date';
  return new Date(date).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// Helper to format currency (unchanged)
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

function Costcard({ bookingDetails }) {
  if (!bookingDetails) {
    return null;
  }
  
  // Destructure the new extra cost properties
  const { rooms = [], dates = {}, totalPrice = 0, extraAdultCost = 0, extraChildCost = 0 } = bookingDetails;
  const { checkIn, checkOut, nights = 0 } = dates;

  const totalRooms = rooms.reduce((sum, item) => sum + item.quantity, 0);
  
  // GST and Grand Total now include the extra costs
  const gstAmount = (totalPrice + extraAdultCost + extraChildCost) * 0.12;
  const serviceFee = 299;
  const grandTotal = totalPrice + extraAdultCost + extraChildCost + gstAmount + serviceFee;
  
  return (
    <div className="max-w-sm rounded-xl bg-white font-sans shadow-lg overflow-hidden ">
      <img
        className="w-full h-48 object-cover"
        src="https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1925&auto=format&fit=crop"
        alt="A hand opening a hotel room door"
      />
      <div className="p-6">
        {/* Top section is unchanged */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Your Stay Summary</h2>
          <p className="mt-1 text-sm text-gray-500">{totalRooms} Room{totalRooms !== 1 ? 's' : ''} Selected</p>
          <p className="mt-3 text-sm text-gray-800">
            {formatDate(checkIn)} - {formatDate(checkOut)}
          </p>
          <p className="text-sm text-gray-800">
            {nights > 0 ? nights : '0'} Night{nights !== 1 ? 's' : ''}
          </p>
          <p className="mt-2 cursor-pointer text-sm text-gray-500 hover:text-gray-700">
            &larr; Edit Stay Details
          </p>
        </div>

        <hr className="my-4" />

        <div>
          {/* Room breakdown is unchanged */}
          <div className="space-y-2">
            {rooms.map(item => (
              <div key={item.roomId} className="flex items-center justify-between text-sm">
                <p className="text-blue-600 pr-2">{item.quantity} x {item.title}</p>
                <p className="font-medium text-gray-700 whitespace-nowrap">
                  {formatCurrency(item.quantity * item.pricePerNight * nights)}
                </p>
              </div>
            ))}
          </div>
          
          <hr className="my-4 border-t border-dotted border-gray-300" />
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-gray-600">Total Room Cost</p>
              <p className="font-medium text-gray-800">{formatCurrency(totalPrice)}</p>
            </div>
            
            {/* Conditionally render the Extra Adult Cost */}
            {extraAdultCost > 0 && (
                <div className="flex items-center justify-between">
                    <p className="text-gray-600">Extra Adult Cost</p>
                    <p className="font-medium text-gray-800">{formatCurrency(extraAdultCost)}</p>
                </div>
            )}

            {/* Conditionally render the Extra Child Cost */}
            {extraChildCost > 0 && (
                <div className="flex items-center justify-between">
                    <p className="text-gray-600">Extra Child Cost</p>
                    <p className="font-medium text-gray-800">{formatCurrency(extraChildCost)}</p>
                </div>
            )}

            <div className="flex items-center justify-between">
              <p className="text-gray-600">GST (12%)</p>
              <p className="font-medium text-gray-800">{formatCurrency(gstAmount)}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-gray-600">Service Fee</p>
              <p className="font-medium text-gray-800">{formatCurrency(serviceFee)}</p>
            </div>
          </div>

          <hr className="my-4" />

          <div className="flex items-center justify-between">
            <p className="text-lg font-bold text-gray-900">Grand Total</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(grandTotal)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Costcard;