// src/components/Gueatcounter.jsx

import React, { useState, } from 'react';

const CHILD_AGE_LIMIT = 12;
const BASE_ADULT_OCCUPANCY = 2;

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

const Guestcounter = ({ rooms, dates, initialGuestCounts, initialChildrenAges, onConfirm }) => {
  const [guestCounts, setGuestCounts] = useState(initialGuestCounts || {});
  const [childrenAges, setChildrenAges] = useState(initialChildrenAges || {});
  const [occupancyErrors, setOccupancyErrors] = useState({});
  const [formErrors, setFormErrors] = useState({});

  const handleCountChange = (instanceId, type, delta, maxOccupancy) => {
    setGuestCounts(prevCounts => {
      const currentCounts = { ...(prevCounts[instanceId] || { adults: 1, children: 0 }) };
      const newCount = currentCounts[type] + delta;

      if ((type === 'adults' && newCount < 1) || (type === 'children' && newCount < 0)) {
        return prevCounts;
      }

      const totalGuests =
        (type === 'adults' ? newCount : currentCounts.adults) +
        (type === 'children' ? newCount : currentCounts.children);

      if (totalGuests > maxOccupancy) {
        setOccupancyErrors(prevErrors => ({
          ...prevErrors,
          [instanceId]: `The hotel's policy does not allow more than ${maxOccupancy} guests. Exceeding this may result in extra charges upon arrival.`,
        }));
        return prevCounts;
      }

      setOccupancyErrors(prevErrors => {
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
      if (ages.some(age => age === '' || age === null || parseInt(age, 10) <= 0)) {
        newErrors[instanceId] = 'Please enter a valid age for each child.';
        formIsValid = false;
      }
    });

    setFormErrors(newErrors);
    if (!formIsValid) {
      return;
    }

    let totalExtraAdultCost = 0;
    let totalExtraChildCost = 0;
    const nights = dates?.nights || 0;

    if (rooms && nights > 0) {
      Object.entries(guestCounts).forEach(([instanceId, counts]) => {
        // --- THIS IS THE FIX ---
        // We use the `roomIndex` from the instanceId to get the correct room from the `rooms` array.
        const [, roomIndexStr] = instanceId.split('_');
        const roomIndex = parseInt(roomIndexStr, 10);
        const roomData = rooms[roomIndex];
        // --- END OF FIX ---

        if (!roomData) {
          console.warn(`⚠️ No room data found for instanceId: ${instanceId}`);
          return;
        }

        let rates = null;
        if (roomData.selectedMealPlan?.Rates) {
          rates = roomData.selectedMealPlan.Rates;
        } else if (roomData.room) {
          rates = {
            ExtraAdultRate: parseFloat(roomData.room.ExtraAdultRate || 0),
            ExtraChildRate: parseFloat(roomData.room.ExtraChildRate || 0),
          };
        }

        if (!rates) {
            console.warn(`❌ No valid rate data found for roomId: ${roomData.roomId}`, roomData);
            return;
        }

        const childrenAgesForRoom = childrenAges[instanceId] || [];

        if (counts.adults > BASE_ADULT_OCCUPANCY && rates.ExtraAdultRate > 0) {
          const extraAdults = counts.adults - BASE_ADULT_OCCUPANCY;
          totalExtraAdultCost += extraAdults * rates.ExtraAdultRate * nights;
        }

        if (rates.ExtraChildRate > 0) {
          childrenAgesForRoom.forEach(age => {
            const parsedAge = parseInt(age);
            if (parsedAge > CHILD_AGE_LIMIT) {
              totalExtraChildCost += rates.ExtraChildRate * nights;
            }
          });
        }
      });
    }

    if (onConfirm) {
      onConfirm({
        guestCounts,
        childrenAges,
        extraAdultCost: totalExtraAdultCost,
        extraChildCost: totalExtraChildCost,
      });
    }
  };

  if (!rooms || rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl shadow-lg mt-4 max-w-3xl mx-auto">
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
    <div className="w-full max-w-3xl mx-auto p-4 font-sans">
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-xl">
        <div className="mb-6 text-center">
          <h2 className="text-xl sm:text-xl font-bold text-gray-900">Guest Details</h2>
          <p className="text-sm sm:text-xs text-gray-500 mt-2">Specify the number of adults and children for each room.</p>
        </div>

        <div className="space-y-6">
          {roomInstances.map(({ instanceId, details, instanceNum }) => {
            const currentGuestCount =
              (guestCounts[instanceId]?.adults || 0) +
              (guestCounts[instanceId]?.children || 0);
            const isMaxReached = currentGuestCount >= details.room.maxOccupancy;

            return (
              <div key={instanceId} className="bg-gray-50 p-4 sm:p-5 rounded-xl border border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-gray-200 pb-4 mb-4">
                  <div>
                    <h4 className="text-md sm:text-md font-semibold text-gray-800">{details.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Room {instanceNum} | Max Occupancy: {details.room.maxOccupancy} guests
                    </p>
                  </div>
                  <div className="text-sm text-gray-600 mt-2 sm:mt-0 flex-shrink-0">
                    Total Guests: <span className="font-bold text-indigo-600">{currentGuestCount}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-sm font-medium text-gray-700">Adults</label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleCountChange(instanceId, 'adults', -1, details.room.maxOccupancy)}
                        className={`p-2 rounded-full transition-colors ${(guestCounts[instanceId]?.adults || 1) <= 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-300 cursor-pointer'
                          }`}
                        disabled={(guestCounts[instanceId]?.adults || 1) <= 1}
                      >
                        <MinusIcon />
                      </button>
                      <span className="text-lg font-semibold w-8 text-center">{guestCounts[instanceId]?.adults || 1}</span>
                      <button
                        onClick={() => handleCountChange(instanceId, 'adults', 1, details.room.maxOccupancy)}
                        className={`p-2 rounded-full transition-colors ${isMaxReached
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-300 cursor-pointer'
                          }`}
                        disabled={isMaxReached}
                      >
                        <PlusIcon />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-1">
                    <label className="text-sm font-medium text-gray-700">Children</label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleCountChange(instanceId, 'children', -1, details.room.maxOccupancy)}
                        className={`p-2 rounded-full transition-colors ${(guestCounts[instanceId]?.children || 0) <= 0
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-300 cursor-pointer'
                          }`}
                        disabled={(guestCounts[instanceId]?.children || 0) <= 0}
                      >
                        <MinusIcon />
                      </button>
                      <span className="text-lg font-semibold w-8 text-center">{guestCounts[instanceId]?.children || 0}</span>
                      <button
                        onClick={() => handleCountChange(instanceId, 'children', 1, details.room.maxOccupancy)}
                        className={`p-2 rounded-full transition-colors ${isMaxReached
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-300 cursor-pointer'
                          }`}
                        disabled={isMaxReached}
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
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Children's Ages</h5>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {childrenAges[instanceId].map((age, index) => (
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
                            className={`w-full px-3 py-2 text-center bg-white border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition ${formErrors[instanceId] && (age === '' || age <= 0)
                              ? 'border-red-500'
                              : 'border-gray-300'
                              }`}
                            placeholder="Age"
                            min="0"
                            max="17"
                          />
                          {age > CHILD_AGE_LIMIT && (
                            <p className="text-xs text-orange-600 mt-1">Extra fee may apply.</p>
                          )}
                        </div>
                      ))}
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
            className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-all duration-300 ease-in-out transform hover:scale-105 cursor-pointer"
          >
            Confirm Guests
          </button>
        </div>
      </div>
    </div>
  );
};

export default Guestcounter;