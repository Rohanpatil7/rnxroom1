import React, { useState, useMemo } from "react";
import { Navigate } from "react-router-dom";
import Costcard from "./Costcard";
// import PaymentInfo from "./Paymentinfo";
import Guestinfo from "./Guestinfo";

function Reviewinfo({ bookingDetails }) {
  const allIndividualRooms = useMemo(() => bookingDetails?.rooms?.flatMap(room => 
    Array.from({ length: room.quantity }, (_, i) => ({ 
      ...room, 
      uniqueId: `${room.roomId}-${i}`,
      instanceNumber: i + 1 
    }))
  ) || [], [bookingDetails]);

  // STATE CHANGE: Replaced crypto.randomUUID() with a more reliable unique ID.
  const [guestAllocation, setGuestAllocation] = useState(() => 
    allIndividualRooms.map(room => ({
      uniqueId: room.uniqueId,
      adults: [{ 
        id: `adult-${room.uniqueId}-${Date.now()}`, // Using a timestamp-based ID
        name: '', 
        email: '', 
        phone: '' 
      }],
      children: [], 
    }))
  );

  const totalGuests = useMemo(() => 
    guestAllocation.reduce((sum, room) => sum + room.adults.length + room.children.length, 0),
    [guestAllocation]
  );

  if (!bookingDetails || !Array.isArray(bookingDetails.rooms) || bookingDetails.rooms.length === 0) {
    console.warn("Reviewinfo component received invalid bookingDetails, redirecting.");
    return <Navigate to="/" replace />;
  }

  const finalBookingDataForDisplay = {
    ...bookingDetails,
    guestAllocation: guestAllocation,
    totalGuests: totalGuests,
  };

  return (
    <div className="flex flex-col-reverse lg:flex-row w-full max-w-6xl gap-6 lg:gap-10 py-6">
      
      <div className="flex flex-col gap-6 w-full lg:w-2/3">
        <Guestinfo 
          rooms={bookingDetails.rooms} 
          guestAllocation={guestAllocation}
          setGuestAllocation={setGuestAllocation}
          totalGuests={totalGuests}
        />
        {/* <PaymentInfo /> */}
      </div>  

      <div className="w-full lg:w-1/3">
        <Costcard bookingData={finalBookingDataForDisplay} />
      </div>
    </div>
  );
}

export default Reviewinfo;

