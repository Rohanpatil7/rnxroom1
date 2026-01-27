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
        <div className=' items-center gap-2 mb-1  '>
          <p className="font-semibold text-medium text-gray-800 sticky top-0 bg-white -z-0 ">{`${mealOption.MealPlan} ` }</p>
            <div className="text-xs font-normal text-black-700 flex ">
               <svg className="w-4 h-4 text-indigo-500  mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            <p>{`${room.maxCapacityAdult} Adults ${room.maxCapacityChild} Childs`}</p>
            </div>
        </div>
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
            <p className="text-xl font-medium text-gray-900 mb-1">
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
          className=" outline outline-indigo-500 text-sm sm:text-xs text-indigo-600 font-medium p-1 rounded hover:bg-indigo-600 hover:text-white disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200  max-w-[200px] hover:scale-110 cursor-pointer"
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
