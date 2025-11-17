// src/components/Gueatcounter.jsx - FINAL CORRECTED LOGIC

import React, { useState, useEffect, useCallback, useMemo } from 'react';

const TEMP_GUEST_COUNTS_KEY = 'tempGuestCounts';
const TEMP_CHILDREN_AGES_KEY = 'tempChildrenAges';

// Max allowed child age
const MAX_CHILD_AGE = 6;

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

const Guestcounter = ({ rooms, dates, initialGuestCounts, initialChildrenAges, onConfirm, onGuestChange }) => {
  // Lazy initialize from sessionStorage, then props
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

  const [occupancyErrors, setOccupancyErrors] = useState({});
  const [formErrors, setFormErrors] = useState({});

  // Persist drafts
  useEffect(() => {
    sessionStorage.setItem(TEMP_GUEST_COUNTS_KEY, JSON.stringify(guestCounts));
  }, [guestCounts]);

  useEffect(() => {
    sessionStorage.setItem(TEMP_CHILDREN_AGES_KEY, JSON.stringify(childrenAges));
  }, [childrenAges]);

  // Cost + guests calculation
  const calculateCostsAndGuests = useCallback((currentGuestCounts) => {
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

        const rates = roomData.selectedMealPlan?.Rates;
        if (!rates) return;

        const extraAdultRate = parseFloat(rates.ExtraAdultRate || 0);
        const extraChildRate = parseFloat(rates.ExtraChildRate || 0);

        const maxAdults = roomData.room.maxCapacityAdult;
        const maxChildren = roomData.room.maxCapacityChild || 0;
        const totalChildren = counts.children || 0;

        if (counts.adults > maxAdults && extraAdultRate > 0) {
          const extraAdults = counts.adults - maxAdults;
          totalExtraAdultCost += extraAdults * extraAdultRate * nights;
        }

        if (totalChildren > maxChildren && extraChildRate > 0) {
          const extraChildren = totalChildren - maxChildren;
          totalExtraChildCost += extraChildren * extraChildRate * nights;
        }
      });
    }

    return {
      extraAdultCost: totalExtraAdultCost,
      extraChildCost: totalExtraChildCost,
      totalGuests,
    };
  }, [rooms, dates]);

  // notify parent on change
  useEffect(() => {
    if (!onGuestChange) return;

    const { extraAdultCost, extraChildCost, totalGuests } =
      calculateCostsAndGuests(guestCounts, childrenAges);

    onGuestChange({
      guestCounts,
      childrenAges,
      extraAdultCost,
      extraChildCost,
      totalGuests,
    });
  }, [guestCounts, childrenAges, onGuestChange, calculateCostsAndGuests]);

  // Build room instances
  const roomInstances = useMemo(() => {
    if (!rooms || rooms.length === 0) return [];
    return rooms.flatMap((room, roomIndex) =>
      Array.from({ length: room.quantity }).map((_, i) => ({
        instanceId: `${room.roomId}_${roomIndex}_${i}`,
        details: room,
        instanceNum: i + 1,
      }))
    );
  }, [rooms]);

  // Validate loaded counts (for occupancy warnings)
  useEffect(() => {
    if (roomInstances.length === 0 || Object.keys(guestCounts).length === 0) {
      return;
    }

    const initialErrors = {};

    for (const { instanceId, details } of roomInstances) {
      const roomDetails = details.room;
      const counts = guestCounts[instanceId] || { adults: 1, children: 0 };
      const newAdults = counts.adults;
      const newChildren = counts.children;
      const totalGuests = newAdults + newChildren;

      let errorMsg = null;
      const maxAdults = roomDetails.maxCapacityAdult || roomDetails.maxOccupancy;
      const maxChildren = roomDetails.maxCapacityChild || roomDetails.maxOccupancy;
      const maxTotal = roomDetails.maxOccupancy;

      const adultOverage = Math.max(0, newAdults - maxAdults);
      const childOverage = Math.max(0, newChildren - maxChildren);
      const totalOverage = Math.max(0, totalGuests - maxTotal);

      if (totalOverage > 0) {
        let reasons = [];
        if (adultOverage > 0) reasons.push(`${adultOverage} adult(s)`);
        if (childOverage > 0) reasons.push(`${childOverage} child(ren)`);

        errorMsg =
          reasons.length > 0
            ? `Exceeding max occupancy (${maxTotal}) by ${reasons.join(' and ')}. Extra charges may apply.`
            : `Exceeding max occupancy (${maxTotal}) by ${totalOverage} guest(s). Extra charges may apply.`;
      } else if (adultOverage > 0) {
        errorMsg = `Exceeding max adults (${maxAdults}) by ${adultOverage} adult(s). Extra charges may apply.`;
      } else if (childOverage > 0) {
        errorMsg = `Exceeding max children (${maxChildren}) by ${childOverage} child(ren). Extra charges may apply.`;
      }

      if (errorMsg) {
        initialErrors[instanceId] = errorMsg;
      }
    }

    setOccupancyErrors(initialErrors);
  }, [roomInstances, guestCounts]);

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

      let errorMsg = null;
      const maxAdults = roomDetails.maxCapacityAdult || roomDetails.maxOccupancy;
      const maxChildren = roomDetails.maxCapacityChild || roomDetails.maxOccupancy;
      const maxTotal = roomDetails.maxOccupancy;

      const adultOverage = Math.max(0, newAdults - maxAdults);
      const childOverage = Math.max(0, newChildren - maxChildren);
      const totalOverage = Math.max(0, totalGuests - maxTotal);

      if (totalOverage > 0) {
        let reasons = [];
        if (adultOverage > 0) reasons.push(`${adultOverage} adult(s)`);
        if (childOverage > 0) reasons.push(`${childOverage} child(ren)`);

        errorMsg =
          reasons.length > 0
            ? `Exceeding max occupancy (${maxTotal}) by ${reasons.join(' and ')}. Extra charges may apply.`
            : `Exceeding max occupancy (${maxTotal}) by ${totalOverage} guest(s). Extra charges may apply.`;
      } else if (adultOverage > 0) {
        errorMsg = `Exceeding max adults (${maxAdults}) by ${adultOverage} adult(s). Extra charges may apply.`;
      } else if (childOverage > 0) {
        errorMsg = `Exceeding max children (${maxChildren}) by ${childOverage} child(ren). Extra charges may apply.`;
      }

      setOccupancyErrors(prevErrors => {
        if (errorMsg) {
          return { ...prevErrors, [instanceId]: errorMsg };
        }
        const newErrors = { ...prevErrors };
        delete newErrors[instanceId];
        return newErrors;
      });

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

  // child age input: optional + max 6
  const handleChildAgeChange = (instanceId, childIndex, age) => {
    let parsed = parseInt(age, 10);

    if (Number.isNaN(parsed)) {
      parsed = ''; // optional
    } else {
      if (parsed < 0) parsed = 0;
      if (parsed > MAX_CHILD_AGE) parsed = MAX_CHILD_AGE;
    }

    setChildrenAges(prevAges => {
      const updatedAges = [...(prevAges[instanceId] || [])];
      updatedAges[childIndex] = parsed;
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
    // no required age validation now
    setFormErrors({});

    if (onConfirm) {
      onConfirm();
      sessionStorage.removeItem(TEMP_GUEST_COUNTS_KEY);
      sessionStorage.removeItem(TEMP_CHILDREN_AGES_KEY);
    }
  };

  if (!rooms || rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-2 text-center bg-white rounded-2xl shadow-lg mt-2 max-w-3xl mx-auto">
        <h3 className="text-2xl font-bold text-gray-800">Guest Information</h3>
        <p className="mt-2 text-gray-500">
          Your booking details could not be loaded. Please go back and select a room first.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-1 font-Rubik">
      <div className="bg-white p-2 sm:p-2 rounded-2xl shadow-xl">
        <div className="mb-6 text-center">
          <h2 className="text-xl sm:text-md font-bold text-gray-900">Guest Details</h2>
          <p className="text-sm sm:text-xs text-gray-500 mt-2">
            Specify the number of adults and children for each room.
          </p>
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
                    <p className="text-xs text-gray-500 mt-1">
                      Room {instanceNum} |
                      {(details.room.maxCapacityAdult && details.room.maxCapacityAdult > 0) ? (
                        <> Max: {details.room.maxCapacityAdult} Adults, {details.room.maxCapacityChild || 0} Children</>
                      ) : (
                        <> Max Occupancy: {details.room.maxOccupancy} guests</>
                      )}
                    </p>
                  </div>
                  <div className="text-xs text-gray-600 mt-2 sm:mt-0 flex-shrink-0">
                    Total Guests:{' '}
                    <span className="font-bold text-indigo-600">{currentGuestCount}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                  {/* Adults */}
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

                  {/* Children */}
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

                {occupancyErrors[instanceId] && (
                  <div className="mt-4 p-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 rounded-r-lg" role="alert">
                    <p className="font-semibold">Occupancy Notice</p>
                    <p className="text-sm">{occupancyErrors[instanceId]}</p>
                  </div>
                )}

                {childrenAges[instanceId]?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h5 className="text-sm flex font-medium text-gray-700 mb-3 gap-2">
                      Children&apos;s Ages
                      <p className='text-[10px] text-align-middle'>
                        {`(optional) (age below ${details.room.FreeChildAge} years) `}
                      </p>
                    </h5>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-0.5">
                      {childrenAges[instanceId].map((age, index) => {
                        const freeAgeLimit = details.room.FreeChildAge;

                        return (
                          <div key={index}>
                            <label
                              htmlFor={`child-age-${instanceId}-${index}`}
                              className="block text-xs text-gray-500 mb-1"
                            >
                              Child {index + 1}
                            </label>
                            <input
                              type="number"
                              inputMode="numeric"
                              id={`child-age-${instanceId}-${index}`}
                              name={`child-age-${instanceId}-${index}`}
                              value={age}
                              onChange={e => handleChildAgeChange(instanceId, index, e.target.value)}
                              className="w-full px-3 py-2 text-center bg-white border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition border-gray-300"
                              placeholder="Age (optional)"
                              max={MAX_CHILD_AGE}
                              min="0"
                            />

                            {age !== '' && age > freeAgeLimit && (
                              <p className="text-xs text-orange-600 mt-1">
                                Fee may apply (over {freeAgeLimit} yrs).
                              </p>
                            )}
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
