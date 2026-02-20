// src/components/RoomOption.jsx
import React, { useState, useEffect } from 'react';

/** * Helper to find the correct rate based on number of adults 
 * from the API's paxRates array.
 */
const getRateForOccupancy = (paxRates, adults) => {
  if (!paxRates || !Array.isArray(paxRates)) return null;
  const numAdults = adults || 1;
  
  // Find exact match for the number of guests
  const exactMatch = paxRates.find(r => r.NoOfPax === numAdults);
  if (exactMatch) return exactMatch.Rate;
  
  // Fallback: If no exact match, use the highest available occupancy rate
  const maxPaxRate = paxRates.reduce((prev, current) => (prev.NoOfPax > current.NoOfPax) ? prev : current);
  
  if (numAdults > maxPaxRate.NoOfPax) {
    const extraPaxCount = numAdults - maxPaxRate.NoOfPax;
    return maxPaxRate.Rate + (extraPaxCount * (maxPaxRate.ExtraAdultRate || 0));
  }
  return maxPaxRate.Rate;
};

function RoomOption({ room, planGroup, onAddToCart, isBookingDisabled, bookingDetails }) {
  // 1. Manage the selected Rate Type (e.g., Refundable vs Non-Refundable)
  const [selectedRate, setSelectedRate] = useState(
    planGroup?.AvailableRates?.length > 0 ? planGroup.AvailableRates[0] : null
  );

  // 2. Manage the selected Pax (Adults) for this specific option
  const [selectedPax, setSelectedPax] = useState(bookingDetails.adults || 1);

  // Update selectedRate if the planGroup from props changes
  useEffect(() => {
    if (planGroup?.AvailableRates?.length > 0) {
      setSelectedRate(planGroup.AvailableRates[0]);
    }
  }, [planGroup]);

  // Generate Pax Options (1 Adult, 2 Adults, etc.) strictly from the API Rates
  const paxOptions = selectedRate?.Rates 
    ? selectedRate.Rates.map(r => r.NoOfPax).sort((a, b) => a - b) 
    : [];

  // Sync with global bookingDetails ONLY on initial load or if the global count changes
  useEffect(() => {
    if (paxOptions.length > 0) {
      if (paxOptions.includes(bookingDetails.adults)) {
        setSelectedPax(bookingDetails.adults);
      } else {
        // Fallback to first available option if global search exceeds room capacity
        setSelectedPax(paxOptions[0]);
      }
    }
  }, [bookingDetails.adults, selectedRate]);

  if (!selectedRate) return null;

  // 3. Calculate dynamic price based on the LOCAL selectedPax state
  const rateForOccupancy = getRateForOccupancy(selectedRate.Rates, selectedPax);
  const hasPrice = rateForOccupancy !== undefined && rateForOccupancy !== null;
  const finalPrice = hasPrice ? rateForOccupancy : 0;

  const handleRateTypeChange = (e) => {
    const uniqueId = e.target.value;
    const newRate = planGroup.AvailableRates.find(r => r.MealPlanID === uniqueId);
    if (newRate) setSelectedRate(newRate);
  };

  const handlePaxChange = (e) => {
    setSelectedPax(parseInt(e.target.value, 10));
  };

  const handleAddToCartClick = () => {
    // Pass the selectedPax to the cart so the total price is calculated correctly
    const rateWithPax = { ...selectedRate, userSelectedPax: selectedPax };
    onAddToCart(room, rateWithPax);
  };

  return (
    <div className="flex p-4 border-b border-gray-200 last:border-b-0 items-center hover:bg-gray-50/60 transition-colors duration-200">
      
      {/* COLUMN 1: Room & Rate Info (50%) */}
      <div className="w-1/2 pr-6">
        <div className='flex flex-col gap-1.5 mb-2'>
          <p className="font-bold text-base text-gray-800 tracking-tight">
            {planGroup.MealPlanName}
          </p>

          <div className="relative w-full max-w-[280px]">
            {planGroup.AvailableRates.length > 1 ? (
              <div className="relative group">
                {/* Styled Native Select */}
                <select
                  value={selectedRate.MealPlanID}
                  onChange={handleRateTypeChange}
                  className="appearance-none w-full bg-white border border-gray-300 text-sm text-gray-700 py-2.5 pl-3 pr-10 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer transition-all duration-200 hover:border-indigo-400"
                >
                  {planGroup.AvailableRates.map((rate, idx) => (
                    <option key={`${rate.MealPlanID}-${idx}`} value={rate.MealPlanID}>
                      {rate.RateType}
                    </option>
                  ))}
                </select>
                {/* Rate Dropdown Chevron - Increased Size */}
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-gray-600 group-hover:text-indigo-600 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </div>
            ) : (
              // Single option look
              <div className="inline-flex items-center bg-gray-100 border border-gray-200 text-sm text-gray-700 font-medium px-3 py-2 rounded-md">
                {selectedRate.RateType}
              </div>
            )}
          </div>

          <div className="text-xs text-gray-500 flex items-center mt-1 font-medium">
             {/* Capacity Icon - Increased Size */}
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-indigo-500 mr-1.5 opacity-90">
              <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" />
            </svg>
            <p>{`${room.maxCapacityAdult} Adults, ${room.maxCapacityChild} Children capacity`}</p>
          </div>
        </div>
        
        <ul className="space-y-1 mt-2">
          {selectedRate.Policies?.map((policy, index) => (
            <li key={`pol-${index}`} className="flex items-start text-xs text-gray-600">
              <span className="mr-1.5 mt-1 block w-1 h-1 rounded-full bg-gray-400 shrink-0"></span>
              {policy.Name}
            </li>
          ))}
        </ul>
      </div>

      {/* COLUMN 2: Occupancy Selector (25%) */}
      <div className="w-1/4 px-2 flex flex-col items-center justify-start border-l border-gray-100">
        <div className="relative inline-block group w-full max-w-[80px]">
           
           {/* 1. The Select is now an invisible overlay covering the entire parent div */}
           <select
              id={`pax-${room._id}`}
              value={selectedPax}
              onChange={handlePaxChange}
              disabled={isBookingDisabled}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 disabled:cursor-not-allowed"
           >
              {paxOptions.map(num => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
           </select>

           {/* 2. Visual "Pill" Container (The look and feel) */}
           {/* Added group-hover and group-focus-within to handle states triggered by the overlay select */}
           <div className="flex items-center justify-between bg-white border border-gray-300 rounded-lg px-1.5 py-1.5 shadow-sm group-hover:border-indigo-500 group-hover:ring-1 group-hover:ring-indigo-500 group-focus-within:ring-2 group-focus-within:ring-indigo-500 transition-all duration-200">
              
              {/* Guest User Icon */}
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="currentColor" 
                className="w-4 h-4 text-gray-600 group-hover:text-indigo-600 transition-colors flex-shrink-0"
              >
                <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
              </svg>

              {/* Display Value (Replacing the visible select) */}
              <span className="text-base font-semibold text-gray-800 text-center w-full px-1">
                {selectedPax}
              </span>

              {/* Guest Chevron */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gray-500 group-hover:text-indigo-600 transition-colors flex-shrink-0">
                 <path fillRule="evenodd" d="M12.53 16.28a.75.75 0 0 1-1.06 0l-7.5-7.5a.75.75 0 0 1 1.06-1.06L12 14.69l6.97-6.97a.75.75 0 1 1 1.06 1.06l-7.5 7.5Z" clipRule="evenodd" />
              </svg>
           </div>
        </div>
      </div>

      {/* COLUMN 3: Price & Action (25%) */}
      <div className="w-1/4 text-right flex flex-col items-end justify-center pl-4 border-l border-gray-100">
        {hasPrice ? (
          <div className="flex flex-col items-end">
             <p className="text-xl font-bold text-gray-900 leading-none">
              ₹{finalPrice.toLocaleString('en-IN')}
            </p>
            <p className="text-[10px] text-gray-500 mt-1">per night</p>
          </div>
        ) : (
          <p className="text-gray-500 mb-2 text-xs italic">Price unavailable</p>
        )}

        <button
          disabled={isBookingDisabled || !hasPrice}
          onClick={handleAddToCartClick}
          className="mt-3 w-full max-w-[100px] bg-white border cursor-pointer border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white text-sm font-semibold py-2 rounded-md shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-indigo-600"
        >
          Select
        </button>
      </div>
    </div>
  );
}

export default RoomOption;