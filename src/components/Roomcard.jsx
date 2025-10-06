// src/components/Roomcard.jsx

import React from "react";
import ImageGallery from "react-image-gallery";
import "react-image-gallery/styles/css/image-gallery.css";
import RoomOption from "./RoomOption";

function Roomcard({ room, bookingDetails, onAddToCart }) {
  const roomImages =
    room.images && room.images.length > 0
      ? room.images
      : [
          "https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg",
          "https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg",
        ];

  const galleryImages = roomImages.map((url) => ({
    original: url,
    thumbnail: url,
    originalAlt: `${room.title} gallery image`,
    thumbnailAlt: `${room.title} thumbnail image`,
  }));

  const isBookingDisabled = !bookingDetails.checkIn || !bookingDetails.checkOut;

  return (
    <div className="relative bg-white rounded-lg shadow-md overflow-hidden flex flex-col md:flex-row mb-6 border border-gray-200">
      <div className="w-full md:w-1/3 p-4 border-r border-gray-200 flex flex-col">
        <h3 className="sticky text-md font-bold text-gray-800 mb-2">{room.title}</h3>
        
        <div className="relative mb-4 rounded-md overflow-hidden">
          <ImageGallery
            items={galleryImages}
            showThumbnails={false}
            showPlayButton={false}
            showNav={false}
            showFullscreenButton={true}
            autoPlay={true}
            slideInterval={5000}
            showBullets={false}
          />
        </div>

        {/* MODIFIED: Display amenities from the room object itself */}
        <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm text-gray-700 mt-2">
          {room.amenities && room.amenities.slice(0, 4).map((amenity, index) => (
            <div key={index} className="flex items-center gap-2">
              <img src={amenity.Image} alt={amenity.Name} className="w-5 h-5 object-contain" />
              <span>{amenity.Name}</span>
            </div>
          ))}
        </div>

        <a href="#" className="text-blue-600 font-semibold text-xs mt-auto pt-4">
          View More Details
        </a>
      </div>

      <div className="w-full md:w-2/3 flex flex-col ">
        <div className="flex bg-gray-50 p-2 border-b border-gray-200 flex-shrink-0">
          <div className="w-2/3 font-semibold text-gray-700 text-center">Room Options</div>
          <div className="w-1/3 font-semibold text-gray-700  pr-4 text-center">Price</div>
        </div>
        
        <div className="overflow-y-auto max-h-[450px] scrollbar-thin scrollbar-thumb-indigo-500 scrollbar-track-indigo-100">
          {!room.mealPlans || room.mealPlans.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No plans available for this room.</div>
          ) : (
           (room.mealPlans || []).map((mealOption) => (
              <RoomOption
                key={mealOption.MealPlanID}
                room={room}
                mealOption={mealOption}
                onAddToCart={onAddToCart}
                isBookingDisabled={isBookingDisabled}
                bookingDetails={bookingDetails}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Roomcard;