// src/components/Roomcard.jsx

import React from "react";
import ImageGallery from "react-image-gallery";
import "react-image-gallery/styles/css/image-gallery.css";
import RoomOption from "./RoomOption"; // *** CHANGE: Import the new component ***

// Helper component for SVG icons
const Icon = ({ path, className = "w-5 h-5" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24"
    fill="currentColor"
    className={className}
  >
    <path fillRule="evenodd" d={path} clipRule="evenodd" />
  </svg>
);

function Roomcard({ room, bookingDetails, onAddToCart }) {
  // Use room.RoomImages from API for gallery if available, otherwise use placeholders
  const roomImages =
    room.RoomImages && room.RoomImages.length > 0
      ? room.RoomImages
      : [
          "https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg",
          "https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg",
          "https://images.pexels.com/photos/262048/pexels-photo-262048.jpeg",
        ];

  const galleryImages = roomImages.map((url) => ({
    original: url,
    thumbnail: url,
    originalAlt: `${room.RoomCategory} gallery image`,
    thumbnailAlt: `${room.RoomCategory} thumbnail image`,
  }));

  const isBookingDisabled = !bookingDetails.checkIn || !bookingDetails.checkOut;

  // Placeholder room details for the left column
  const roomDetailsIcons = [
    {
      icon: <Icon path="M2.25 8.25h19.5a.75.75 0 01.75.75v10.5a.75.75 0 01-.75.75H2.25a.75.75 0 01-.75-.75V9a.75.75 0 01.75-.75zm19.5-1.5H2.25A2.25 2.25 0 000 9v10.5A2.25 2.25 0 002.25 21.75h19.5A2.25 2.25 0 0024 19.5V9A2.25 2.25 0 0021.75 6.75z" />,
      text: "240 sq.ft (22 sq.mt)",
    },
    {
      icon: <Icon path="M3.75 3.75v4.5a.75.75 0 00.75.75h4.5a.75.75 0 00.75-.75v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 00-.75.75zm6.75 0v4.5a.75.75 0 00.75.75h4.5a.75.75 0 00.75-.75v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 00-.75.75zm-6.75 6v4.5a.75.75 0 00.75.75h4.5a.75.75 0 00.75-.75v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 00-.75.75zm6.75 0v4.5a.75.75 0 00.75.75h4.5a.75.75 0 00.75-.75v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 00-.75.75z" />,
      text: "Garden View",
    },
    {
      icon: <Icon path="M1.5 8.25A2.25 2.25 0 013.75 6h16.5a2.25 2.25 0 012.25 2.25v7.5A2.25 2.25 0 0120.25 18H3.75A2.25 2.25 0 011.5 15.75v-7.5zM21 9.75A.75.75 0 0020.25 9H3.75a.75.75 0 00-.75.75v.01c0 .414.336.75.75.75h16.5a.75.75 0 00.75-.75v-.01zM4.5 12.75a.75.75 0 01.75-.75h13.5a.75.75 0 010 1.5H5.25a.75.75 0 01-.75-.75z" />,
      text: "2 x Single Bed(s), Queen Bed",
    },
    {
      icon: <Icon path="M2.25 3.75A.75.75 0 013 3h18a.75.75 0 01.75.75v12.75a.75.75 0 01-.75.75H3a.75.75 0 01-.75-.75V3.75zM21 4.5H3v12h18V4.5zm-5.25 9a.75.75 0 00-.75-.75H9a.75.75 0 000 1.5h6a.75.75 0 00.75-.75z" />,
      text: "1 Bathroom",
    },
  ];

  return (
    <div className="relative bg-white rounded-lg shadow-md overflow-hidden flex flex-col md:flex-row mb-6 border border-gray-200">
      {/* --- Column 1: Room Type Details --- */}
      <div className="w-full md:w-1/3 p-4 border-r border-gray-200 flex flex-col">
        
          <h3 className="text-xl font-bold text-gray-800 mb-2">{room.RoomCategory}</h3>
        

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

        <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm text-gray-700 mt-2">
          {roomDetailsIcons.map((detail, index) => (
            <div key={index} className="flex items-center gap-2">
              {detail.icon}
              <span>{detail.text}</span>
            </div>
          ))}
        </div>

        <a href="#" className="text-blue-600 font-semibold text-sm mt-auto pt-4">
          View More Details
        </a>
      </div>

      {/* --- Columns 2 & 3: Room Options and Price --- */}
      <div className="w-full md:w-2/3 flex flex-col ">
        <div className="flex bg-gray-50 p-4 border-b border-gray-200 flex-shrink-0">
          <div className="w-2/3 font-semibold text-gray-700 text-center">Room Options</div>
          <div className="w-1/3 font-semibold text-gray-700  pr-4 text-center">Price</div>
        </div>
        
        <div className="overflow-y-auto max-h-[450px]">
          {!room.MealPlans || room.MealPlans.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No plans available for this room.</div>
          ) : (
            // *** CHANGE: Simplified mapping logic to use the new component ***
           (room.MealPlans || []).map((mealOption) => (
              <RoomOption
                key={mealOption.MealPlanID}
                room={room}
                mealOption={mealOption}
                onAddToCart={onAddToCart}
                isBookingDisabled={isBookingDisabled}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Roomcard;