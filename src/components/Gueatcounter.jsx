// src/components/Guestcounter.jsx - FINAL CORRECTED LOGIC

import React, { useState, useEffect, useCallback } from 'react';

// --- [REMOVED] CHILD_AGE_LIMIT is no longer a constant ---
// const CHILD_AGE_LIMIT = 12; 

// --- [NEW] Session storage keys for draft data ---
const TEMP_GUEST_COUNTS_KEY = 'tempGuestCounts';
const TEMP_CHILDREN_AGES_KEY = 'tempChildrenAges';

const MinusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
  </svg>
);

// --- [MODIFIED] Add onGuestChange prop
const Guestcounter = ({ rooms, dates, initialGuestCounts, initialChildrenAges, onConfirm, onGuestChange }) => {
  // --- [UPDATED] Lazy initialize state from session storage first, then props ---
  const [guestCounts, setGuestCounts] = useState(() => {
    try {
      const storedCounts = sessionStorage.getItem(TEMP_GUEST_COUNTS_KEY);
      return storedCounts ? JSON.parse(storedCounts) : (initialGuestCounts || {});
    } catch {
      return initialGuestCounts || {};
    }
  });

  const [childrenAges, setChildrenAges] = useState(() => {
    try {
      const storedAges = sessionStorage.getItem(TEMP_CHILDREN_AGES_KEY);
      return storedAges ? JSON.parse(storedAges) : (initialChildrenAges || {});
    } catch {
      return initialChildrenAges || {};
    }
  });
  // --- [END UPDATED] ---

  const [occupancyErrors, setOccupancyErrors] = useState({});
  const [formErrors, setFormErrors] = useState({});

  // --- [MODIFIED] Function to calculate costs with NEW business logic ---
  const calculateCostsAndGuests = useCallback((currentGuestCounts, currentChildrenAges) => {
    let totalExtraAdultCost = 0;
    let totalExtraChildCost = 0;
    let totalGuests = 0;
    const nights = dates?.nights || 0;

    if (rooms && nights > 0) {
      Object.entries(currentGuestCounts).forEach(([instanceId, counts]) => {
        totalGuests += (counts.adults || 0) + (counts.children || 0);

        const roomIndex = parseInt(instanceId.split('_')[1], 10);
        const roomData = rooms[roomIndex];
        if (!roomData) return;

        // Need rates for ExtraAdultRate and ExtraChildRate
        let rates = roomData.selectedMealPlan?.Rates;
        if (!rates) return;

        const extraAdultRate = parseFloat(rates.ExtraAdultRate || 0);
        const extraChildRate = parseFloat(rates.ExtraChildRate || 0);
        
        // --- [START NEW LOGIC USING FreeChildAge] ---
        
        // 1. Check for extra adults
        const maxAdults = roomData.room.maxCapacityAdult ;
        if (counts.adults > maxAdults) {
          const extraAdults = counts.adults - maxAdults;
          if (extraAdultRate > 0) {
            totalExtraAdultCost += (extraAdults * extraAdultRate * nights);
          }
        }

        // 2. Check children for age and capacity
        const maxChildren = roomData.room.maxCapacityChild || 0;
        // --- Get FreeChildAge from the room data ---
        const freeAgeLimit = roomData.room.FreeChildAge; 
        const childrenAgesForRoom = currentChildrenAges[instanceId] || [];
        
        let chargeableChildCount = 0; // Count children who are NOT free

        childrenAgesForRoom.forEach((age) => {
          const parsedAge = parseInt(age);

          // Check if age is greater than the free limit
          if (parsedAge > freeAgeLimit) { 
            chargeableChildCount++;
          }
        });

        // 3. Now, check if the *chargeable* children exceeded their capacity
        if (chargeableChildCount > maxChildren) {
          const extraChildren = chargeableChildCount - maxChildren;
          if (extraChildRate > 0) {
            totalExtraChildCost += (extraChildren * extraChildRate * nights);
          }
        }
        
        // --- [END NEW LOGIC] ---
      });
    }

    return {
      extraAdultCost: totalExtraAdultCost,
      extraChildCost: totalExtraChildCost,
      totalGuests: totalGuests,
    };
  }, [rooms, dates]);
  // --- [END MODIFIED] ---

  // --- [NEW] useEffect to call onGuestChange when counts change ---
  useEffect(() => {
    sessionStorage.setItem(TEMP_GUEST_COUNTS_KEY, JSON.stringify(guestCounts));
    
    // On change, calculate costs and notify parent
    if (onGuestChange) {
      const { extraAdultCost, extraChildCost, totalGuests } = calculateCostsAndGuests(guestCounts, childrenAges);
      onGuestChange({
        guestCounts,
        childrenAges,
        extraAdultCost,
        extraChildCost,
        totalGuests,
      });
    }
  // --- [MODIFIED] Add dependencies ---
  }, [guestCounts, childrenAges, onGuestChange, calculateCostsAndGuests]); 

  // --- [NEW] useEffect to call onGuestChange when ages change ---
  useEffect(() => {
    sessionStorage.setItem(TEMP_CHILDREN_AGES_KEY, JSON.stringify(childrenAges));
    
    // On change, calculate costs and notify parent
    if (onGuestChange) {
      const { extraAdultCost, extraChildCost, totalGuests } = calculateCostsAndGuests(guestCounts, childrenAges);
      onGuestChange({
        guestCounts,
        childrenAges,
        extraAdultCost,
        extraChildCost,
        totalGuests,
      });
    }
  // --- [MODIFIED] Add dependencies ---
  }, [childrenAges, guestCounts, onGuestChange, calculateCostsAndGuests]);
  // --- [END NEW] ---

  const handleCountChange = (instanceId, type, delta, roomDetails) => {
    setGuestCounts(prevCounts => {
      const currentCounts = { ...(prevCounts[instanceId] || { adults: 1, children: 0 }) };
      const newCount = currentCounts[type] + delta;

      if ((type === 'adults' && newCount < 1) || (type === 'children' && newCount < 0)) {
        return prevCounts;
      }
      
      const newAdults = (type === 'adults' ? newCount : currentCounts.adults);
      const newChildren = (type === 'children' ? newCount : currentCounts.children);
      const totalGuests = newAdults + newChildren;

      // --- [MODIFICATION START] ---
      // Instead of blocking the count, we now just set or clear the warning.
      // We check both total and individual capacities
      let errorMsg = null;
      // Use "|| roomDetails.maxOccupancy" as a fallback in case maxCapacityAdult/Child is missing
      const maxAdults = roomDetails.maxCapacityAdult || roomDetails.maxOccupancy;
      const maxChildren = roomDetails.maxCapacityChild || roomDetails.maxOccupancy;

      if (totalGuests > roomDetails.maxOccupancy) {
        errorMsg = `Exceeding max occupancy of ${roomDetails.maxOccupancy}. Extra guest charges may apply.`;
      } else if (newAdults > maxAdults) {
         errorMsg = `Exceeding max adults (${maxAdults}). Extra guest charges may apply.`;
      } else if (newChildren > maxChildren) {
         errorMsg = `Exceedwarning: max children (${maxChildren}) exceeded. Extra guest charges may apply.`;
      }

      setOccupancyErrors(prevErrors => {
        if (errorMsg) {
          return { ...prevErrors, [instanceId]: errorMsg };
        }
        // Clear the warning if the count is back within the limit
        const newErrors = { ...prevErrors };
        delete newErrors[instanceId];
        return newErrors;
      });
      // --- [MODIFICATION END] ---

      const updatedCounts = { ...prevCounts, [instanceId]: { ...currentCounts, [type]: newCount } };

      if (type === 'children') {
        setChildrenAges(prevAges => {
          const currentAges = prevAges[instanceId] || [];
          const newAges = new Array(newCount).fill('').map((_, i) => currentAges[i] || '');
          return { ...prevAges, [instanceId]: newAges };
        });
      }

      return updatedCounts;
    });
  };

  const handleChildAgeChange = (instanceId, childIndex, age) => {
    const newAge = Math.max(0, parseInt(age, 10) || 0);
    setChildrenAges(prevAges => {
      const updatedAges = [...(prevAges[instanceId] || [])];
      updatedAges[childIndex] = newAge;
      return { ...prevAges, [instanceId]: updatedAges };
    });

    if (formErrors[instanceId]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[instanceId];
        return newErrors;
      });
    }
  };

  const handleConfirmGuests = () => {
    const newErrors = {};
    let formIsValid = true;

    Object.keys(guestCounts).forEach(instanceId => {
      const ages = childrenAges[instanceId] || [];
      // --- [MODIFIED] Also allow 0 as a valid age ---
      if (ages.some(age => age === '' || age === null || parseInt(age, 10) < 0)) {
        newErrors[instanceId] = 'Please enter a valid age for each child (0 or greater).';
        formIsValid = false;
      }
    });

    setFormErrors(newErrors);
    if (!formIsValid) {
      console.warn('🚫 Guest form validation failed.', newErrors);
      return;
    }

    // --- [MODIFIED] Cost calculation is no longer needed here ---
    // The parent (Booking.jsx) already has the latest costs.
    
    if (onConfirm) {
      // --- [MODIFIED] No need to pass data, just confirm the step change ---
      onConfirm();

      // --- [NEW] Clear draft data from session storage after confirmation ---
      sessionStorage.removeItem(TEMP_GUEST_COUNTS_KEY);
      sessionStorage.removeItem(TEMP_CHILDREN_AGES_KEY);
      // --- [END NEW] ---
    }
  };

  if (!rooms || rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-2 text-center bg-white rounded-2xl shadow-lg mt-2 max-w-3xl mx-auto">
        <h3 className="text-2xl font-bold text-gray-800">Guest Information</h3>
        <p className="mt-2 text-gray-500">Your booking details could not be loaded. Please go back and select a room first.</p>
      </div>
    );
  }

  const roomInstances = rooms.flatMap((room, roomIndex) =>
    Array.from({ length: room.quantity }).map((_, i) => ({
      instanceId: `${room.roomId}_${roomIndex}_${i}`,
      details: room,
      instanceNum: i + 1,
    }))
  );

  return (
    <div className="w-full max-w-3xl mx-auto p-1 font-Rubik">
      <div className="bg-white p-2 sm:p-2 rounded-2xl shadow-xl">
        <div className="mb-6 text-center">
          <h2 className="text-xl sm:text-md font-bold text-gray-900">Guest Details</h2>
          <p className="text-sm sm:text-xs text-gray-500 mt-2">Specify the number of adults and children for each room.</p>
        </div>

        <div className="space-y-6 text-sm">
          {roomInstances.map(({ instanceId, details, instanceNum }) => {
            const currentGuestCount =
              (guestCounts[instanceId]?.adults || 0) +
              (guestCounts[instanceId]?.children || 0);
            
            return (
              <div key={instanceId} className="bg-gray-50 p-4 sm:p-5 rounded-xl border border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-gray-200 pb-4 mb-4">
                  <div>
                    <h4 className="text-md sm:text-md font-semibold text-gray-800">{details.title}</h4>
                    
                    {/* --- [THIS IS THE CORRECTED LINE WITH FALLBACK] --- */}
                    <p className="text-xs text-gray-500 mt-1">
                      Room {instanceNum} | 
                      {/* Check if maxCapacityAdult is a valid number greater than 0 */}
                      {(details.room.maxCapacityAdult && details.room.maxCapacityAdult > 0) ? (
                        // If yes, show the detailed view
                        ` Max: ${details.room.maxCapacityAdult} Adults, ${details.room.maxCapacityChild || 0} Children`
                      ) : (
                        // Otherwise, fall back to the total occupancy
                        ` Max Occupancy: ${details.room.maxOccupancy} guests`
                      )}
                    </p>
                    {/* --- [END CORRECTED LINE] --- */}

                  </div>
                  <div className="text-xs text-gray-600 mt-2 sm:mt-0 flex-shrink-0">
                    Total Guests: <span className="font-bold text-indigo-600">{currentGuestCount}</span>
                  </div>
                </div>

                {/* --- [MODIFIED] --- */}
                {/* Pass the specific room details to handleCountChange */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                  <div className="flex items-center justify-around gap-1">
                    <label className="text-sm font-medium text-gray-700">Adults</label>
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => handleCountChange(instanceId, 'adults', -1, details.room)}
                        className={`p-1 rounded-full transition-colors ${(guestCounts[instanceId]?.adults || 1) <= 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-300 cursor-pointer'
                          }`}
                        disabled={(guestCounts[instanceId]?.adults || 1) <= 1}
                      >
                        <MinusIcon />
                      </button>
                      <span className="text-md font-semibold w-6 text-center">{guestCounts[instanceId]?.adults || 1}</span>
                      
                      <button
                        onClick={() => handleCountChange(instanceId, 'adults', 1, details.room)}
                        className="p-1 rounded-full transition-colors bg-indigo-100 text-indigo-700 hover:bg-indigo-300 cursor-pointer"
                      >
                        <PlusIcon />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-around gap-1">
                    <label className="text-sm font-medium text-gray-700">Children</label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCountChange(instanceId, 'children', -1, details.room)}
                        className={`p-1 rounded-full transition-colors ${(guestCounts[instanceId]?.children || 0) <= 0
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-300 cursor-pointer'
                          }`}
                        disabled={(guestCounts[instanceId]?.children || 0) <= 0}
                      >
                        <MinusIcon />
                      </button>
                      <span className="text-md font-semibold w-4 text-center">{guestCounts[instanceId]?.children || 0}</span>
                      
                      <button
                        onClick={() => handleCountChange(instanceId, 'children', 1, details.room)}
                        className="p-1 rounded-full transition-colors bg-indigo-100 text-indigo-700 hover:bg-indigo-300 cursor-pointer"
                      >
                        <PlusIcon />
                      </button>
                    </div>
                  </div>
                </div>
                {/* --- [END MODIFIED] --- */}


                {occupancyErrors[instanceId] && (
                  <div className="mt-4 p-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 rounded-r-lg" role="alert">
                    <p className="font-semibold">Occupancy Notice</p>
                    {/* --- [MODIFIED] --- */}
                    {/* This message is now more intelligent, it will check all rules */}
                    <p className="text-sm">{occupancyErrors[instanceId]}</p>
                    {/* --- [END MODIFIED] --- */}
                  </div>
                )}

                {childrenAges[instanceId]?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Children's Ages</h5>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-0.5">
                      {childrenAges[instanceId].map((age, index) => {
                        // --- [NEW] Get free age limit for this specific room ---
                        const freeAgeLimit = details.room.FreeChildAge;
                        // --- [END NEW] ---
                        
                        return (
                          <div key={index}>
                            <label htmlFor={`child-age-${instanceId}-${index}`} className="block text-xs text-gray-500 mb-1">
                              Child {index + 1}
                            </label>
                            <input
                              type="number"
                              id={`child-age-${instanceId}-${index}`}
                              name={`child-age-${instanceId}-${index}`}
                              value={age}
                              onChange={e => handleChildAgeChange(instanceId, index, e.target.value)}
                              className={`w-full px-3 py-2 text-center bg-white border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition ${formErrors[instanceId] && (age === '' || age < 0)
                                ? 'border-red-500'
                                : 'border-gray-300'
                                }`}
                              placeholder="Age"
                              min="0"
                              max="17"
                            />
                            
                            {/* --- [MODIFIED] Use dynamic freeAgeLimit --- */}
                            {age > freeAgeLimit && (
                              <p className="text-xs text-orange-600 mt-1">Fee may apply (over {freeAgeLimit} yrs).</p>
                            )}
                            {/* --- [END MODIFIED] --- */}

                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {formErrors[instanceId] && (
                  <div className="mt-3 text-sm font-medium text-red-600" role="alert">
                    {formErrors[instanceId]}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8">
          <button
            type="button"
            onClick={handleConfirmGuests}
            className="w-full bg-gradient-to-b from-indigo-500 via-indigo-600 to-indigo-700  text-white font-medium py-3 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-all duration-300 ease-in-out transform hover:scale-101 cursor-pointer"
          >
            Confirm Guests
          </button>
        </div>
      </div>
    </div>
  );
};

export default Guestcounter;