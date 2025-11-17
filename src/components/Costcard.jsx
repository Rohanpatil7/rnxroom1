// src/components/Costcard.jsx

import React from 'react';

const formatDate = (date) => {
  if (!date) return 'Select Date';
  return new Date(date).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

function Costcard({
  bookingDetails,
  hotelData,
  taxData,
  // overrides coming from Booking.jsx
  serviceFee: serviceFeeProp,
  grandTotal: grandTotalProp,
  extraAdultCost: extraAdultCostProp,
  extraChildCost: extraChildCostProp,
}) {
  console.log('=== Costcard render ===');
  console.log('bookingDetails:', bookingDetails);
  console.log('serviceFeeProp:', serviceFeeProp);
  console.log('grandTotalProp:', grandTotalProp);
  console.log('extraAdultCostProp:', extraAdultCostProp);
  console.log('extraChildCostProp:', extraChildCostProp);

  if (!bookingDetails) return null;

  const {
    rooms = [],
    dates = {},
    totalPrice = 0,
    // values stored inside bookingDetails (fallbacks)
    extraAdultCost: extraAdultCostFromDetails = 0,
    extraChildCost: extraChildCostFromDetails = 0,
  } = bookingDetails;

  const { checkIn, checkOut, nights = 0 } = dates;
  const totalRooms = rooms.reduce((sum, item) => sum + item.quantity, 0);

  // ✅ use props if provided, else fall back to bookingDetails values
  const extraAdultCost =
    extraAdultCostProp ?? extraAdultCostFromDetails ?? 0;
  const extraChildCost =
    extraChildCostProp ?? extraChildCostFromDetails ?? 0;

  const serviceFee =
    serviceFeeProp ??
    hotelData?.ServiceCharges ??
    hotelData?.serviceFee ??
    0;

  const taxableAmount = totalPrice + extraAdultCost + extraChildCost;

  const totalGstAmount =
    taxData?.taxes?.reduce(
      (sum, tax) =>
        sum + taxableAmount * (parseFloat(tax.Percentage) / 100),
      0
    ) || taxableAmount * 0.18;

  const grandTotal =
    grandTotalProp ??
    (taxableAmount + totalGstAmount + serviceFee);

  console.log('Computed extraAdultCost:', extraAdultCost);
  console.log('Computed extraChildCost:', extraChildCost);
  console.log('Computed serviceFee:', serviceFee);
  console.log('Computed grandTotal:', grandTotal);

  const hotelImage = hotelData?.HotelImages?.[0];

  return (
    <div className="max-w-screen rounded-xl md:w-full bg-white font-sans shadow-lg overflow-hidden mb-12 ">
      {/* Hotel Image */}
      {hotelImage && (
        <img className="w-full h-48 object-cover" src={hotelImage} alt="Hotel" />
      )}

      <div className="p-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Your Stay Summary</h2>
          <p className="text-sm text-gray-500">
            {totalRooms} Room{totalRooms !== 1 ? 's' : ''}
          </p>
          <p className="mt-3 text-sm font-medium text-gray-800">
            {formatDate(checkIn)} ----- {nights} Night{nights !== 1 ? 's' : ''} ----- {formatDate(checkOut)}
          </p>
        </div>

        <hr className="my-2" />

        {/* Room Cost Summary */}
        <div>
          <div className="space-y-2">
            {rooms.map((item, index) => (
              <div
                key={`room_${item.roomId}_${index}`}
                className="flex items-center justify-between text-sm"
              >
                <p className="text-indigo-600 pr-2">
                  {item.quantity} x {item.title}
                </p>
                <p className="font-medium text-gray-700 whitespace-nowrap">
                  {formatCurrency(item.quantity * item.pricePerNight * nights)}
                </p>
              </div>
            ))}
          </div>

          <hr className="my-2 border border-dotted border-black" />

          {/* Cost Breakdown */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Total Room Cost</p>
              <p className="font-medium text-gray-800">
                {formatCurrency(totalPrice)}
              </p>
            </div>

            {extraAdultCost > 0 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">Extra Adult Cost</p>
                <p className="font-medium text-gray-800">
                  {formatCurrency(extraAdultCost)}
                </p>
              </div>
            )}

            {extraChildCost > 0 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">Extra Child Cost</p>
                <p className="font-medium text-gray-800">
                  {formatCurrency(extraChildCost)}
                </p>
              </div>
            )}

            {/* Taxes */}
            {taxData?.taxes?.map((tax, i) => (
              <div
                key={`${tax.TaxGroupID || tax.TaxGroupName}_${i}`}
                className="flex items-center justify-between"
              >
                <p className="text-sm text-gray-600">
                  {tax.TaxGroupName} ({parseFloat(tax.Percentage)}%)
                </p>
                <p className="font-medium text-gray-800">
                  {formatCurrency(
                    taxableAmount * (parseFloat(tax.Percentage) / 100)
                  )}
                </p>
              </div>
            ))}

            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Service Fee</p>
              <p className="font-medium text-gray-800">
                {formatCurrency(serviceFee)}
              </p>
            </div>
          </div>

          <hr className="my-2" />

          {/* Grand Total */}
          <div className="flex items-center justify-between">
            <p className="text-xl font-semibold text-indigo-700">Grand Total</p>
            <p className="text-xl font-semibold text-indigo-700">
              {formatCurrency(grandTotal)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Costcard;
