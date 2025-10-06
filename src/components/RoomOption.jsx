// src/components/RoomOption.jsx

import React from 'react';

// --- HELPER (REFACTORED): Determines rate using an object lookup ---
const getRateForOccupancy = (rates, adults) => {
  if (!rates) return null;
  const numAdults = adults || 1;

  // Handle special case for more than 4 adults
  if (numAdults > 4) {
    if (rates.FourthOccupancy && rates.ExtraAdultRate) {
      return rates.FourthOccupancy + (numAdults - 4) * rates.ExtraAdultRate;
    }
    return rates.FourthOccupancy; // Fallback if no extra adult rate is defined
  }
  
  // Use an object as a map for standard occupancy
  const occupancyMap = {
    1: rates.SingleOccupancy,
    2: rates.DoubleOccupancy,
    3: rates.TripleOccupancy,
    4: rates.FourthOccupancy,
  };

  // Return the rate from the map, or a fallback for invalid numbers (e.g., 0)
  return occupancyMap[numAdults] ?? rates.SingleOccupancy;
};

function RoomOption({ room, mealOption, onAddToCart, isBookingDisabled, bookingDetails, policies }) {
  const rateForOccupancy = getRateForOccupancy(mealOption.Rates, bookingDetails.adults);
  
  const hasPrice = rateForOccupancy !== undefined && rateForOccupancy !== null;
  const finalPrice = hasPrice ? rateForOccupancy : 0;
  
  const key = mealOption.MealPlanID || `${room.RoomTypeID}-${mealOption.MealPlan}`;

  return (
    <div key={key} className="flex p-4 border-b border-gray-200 last:border-b-0 items-center hover:bg-gray-50/50">
      {/* Column 1: Room Option Details */}
      <div className="w-2/3 pr-4">
        <p className="font-semibold text-medium text-gray-800 sticky top-0 bg-white -z-0 py-2">{mealOption.MealPlan}</p>
         <ul className="list-disc list-inside text-xs text-gray-600 mt-2 space-y-1">
          {policies && policies.map((policy, index) => (
            <li key={index}>{policy}</li>
          ))}
          {/* You can still add dynamic checks based on the meal plan name if needed */}
          {mealOption.MealPlan.includes('Breakfast') && <li>Breakfast included</li>}
          {mealOption.MealPlan.includes('Lunch') && <li>Lunch included</li>}
          {mealOption.MealPlan.includes('Dinner') && <li>Dinner included</li>}
        </ul>
        <p className="text-red-500 text-sm mt-2 font-normal sm:text-xs">Non-Refundable</p>
        {/* <a href="#" className="text-blue-600 font-semibold text-sm mt-1 inline-block">
          View plan details & policies
        </a> */}
      </div>

      {/* Column 2: Price and Action Button */}
      <div className="w-1/3 text-right flex flex-col items-end">
        {hasPrice ? (
          <>
            <p className="text-md font-medium text-gray-900 mb-1">
              ₹{finalPrice.toLocaleString('en-IN', {minimumFractionDigits: 0, maximumFractionDigits: 0})}
            </p>
            <p className="text-xs text-gray-500 mb-3">For {bookingDetails.adults || 1} Adult(s) per night</p>
          </>
        ) : (
          <p className="text-gray-500 mb-3">Price not available</p>
        )}

        <button
          disabled={isBookingDisabled || !hasPrice}
          onClick={() => onAddToCart(room, mealOption)}
          className=" outline outline-indigo-500 text-sm xs:text-xs text-indigo-600 font-medium p-1 rounded hover:bg-indigo-600 hover:text-white disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200  max-w-[150px]  "
        >
          SELECT ROOM
        </button>
        {isBookingDisabled && <p className="text-xs text-indigo-500 mt-1">Select dates to book</p>}
        {/* <p className="text-blue-600 font-semibold text-xs mt-2">
          Login Now to unlock best deals and offers!
        </p> */}
      </div>
    </div>
  );
}

export default RoomOption;