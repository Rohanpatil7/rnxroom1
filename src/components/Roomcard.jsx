import React, { useEffect, useRef } from "react";
import ImageGallery from "react-image-gallery";
import Mealcategoty from "./Mealcategoty";
import "react-image-gallery/styles/css/image-gallery.css";
// --- Data and Helper Components ---

// Static data for room amenities based on room title
const amenitiesData = {
  "Deluxe Room": [
    "High-Speed Wi-Fi",
    "Air Conditioning",
    "Smart TV",
    "Mini Bar",
  ],
  "Ultra Deluxe Room": [
    "High-Speed Wi-Fi",
    "Air Conditioning",
    "Smart TV",
    "Mini Bar",
    "Jacuzzi Bathtub",
    "Work Desk",
  ],
  "Standard Room": ["High-Speed Wi-Fi", "Air Conditioning", "Smart TV"],
  "Ultra Deluxe": [
    "High-Speed Wi-Fi",
    "Air Conditioning",
    "Smart TV",
    "Mini Bar",
    "Jacuzzi Bathtub",
    "Work Desk",
  ], // Added for consistency with Booking.jsx
  default: ["High-Speed Wi-Fi", "Air Conditioning", "Smart TV"], // Fallback amenities
};

const MealcategotyData = [
  {
    desc: "room only",
    rate: 3652,
  },
  {
    desc: "room + Breakfast",
    rate: 4000,
  },
  {
    desc: "room + breakfast + lunch/dinner",
    rate: 5000,
  },
   {
    desc: "room + Full Meal Pack",
    rate: 6004,
  },
];

// Helper component to render an SVG icon based on the amenity name
const AmenityIcon = ({ name }) => {
  const iconClasses = "w-4 h-4 text-indigo-600";
  let iconSvg;

  switch (name) {
    case "High-Speed Wi-Fi":
      iconSvg = (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.288 15.038a5.5 5.5 0 017.424 0M5.136 11.886a9.5 9.5 0 0113.728 0M2 8.734a13.5 13.5 0 0119.996 0"
        />
      );
      break;
    case "Air Conditioning":
      iconSvg = (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 4.5v15m-4.879-8.364l9.758 9.758m-9.758 0l9.758-9.758"
        />
      );
      break;
    case "Smart TV":
      iconSvg = (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      );
      break;
    case "Mini Bar":
      iconSvg = (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M9 18h6"
        />
      );
      break;
    case "Jacuzzi Bathtub":
      iconSvg = (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16v4m-2-2h4m2 10h-4m2 2v-4m5 4v-4m-2 2h4M9 11a3 3 0 100-6 3 3 0 000 6z"
        />
      );
      break;
    case "Work Desk":
      iconSvg = (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z"
        />
      );
      break;
    default:
      return null;
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={iconClasses}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      {iconSvg}
    </svg>
  );
};

// --- Main Room Card Component ---

function Roomcard({ room, bookingDetails, onAddToCart }) {
  const intervalRef = useRef(null);

  const roomImages =
    room.images && room.images.length > 0
      ? room.images
      : [
          "https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg",
          "https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg",
          "https://images.pexels.com/photos/262048/pexels-photo-262048.jpeg",
        ];

  const galleryImages = roomImages.map((url) => ({
    original: url,
    thumbnail: url,
    originalAlt: `${room.title}`,
    thumbnailAlt: `${room.title}`,
  }));

  const isBookingDisabled = !bookingDetails.checkIn || !bookingDetails.checkOut;
  const roomAmenities = amenitiesData[room.title] || amenitiesData.default;

  const stopAutoSlide = React.useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const startAutoSlide = React.useCallback(() => {
    stopAutoSlide();
    intervalRef.current = setInterval(3000);
  }, [stopAutoSlide]);

  useEffect(() => {
    startAutoSlide();
    return () => stopAutoSlide();
  }, [startAutoSlide, stopAutoSlide]);

  return (
    <div className="p-2  xl:w-6xl sm:p-4 flex flex-col sm:flex-row rounded-xl overflow-hidden transition-transform duration-200 ease-in hover:scale-103 cursor-default bg-white text-gray-500/90 shadow-[0px_4px_4px_rgba(0,0,0,0.05)] hover:shadow-lg shadow-indigo-300 md:w-vw">
      <div className="relative w-full rounded-2xl md:w-2/5 lg:w-1/3 flex-shrink-0  h-full">
        <ImageGallery
          items={galleryImages}
          showThumbnails={false}
          showPlayButton={false}
          showNav={false}
          showFullscreenButton={true}
          autoPlay={true}
          slideInterval={5000}
          showBullets={true}
        />
      </div>

      <div className="w-full sm:p-4 pt-4 sm:pt-5 flex flex-col justify-between">
        <div>
          <div className="roomdetails flex flex-col gap-2">
            {/* --- FIX IS HERE --- */}
            {/* Changed the outer <p> to a <div> and the inner <p> to a <span> */}
            <div className="flex justify-between items-baseline font-playfair text-3xl font-bold text-indigo-700">
              <span>{room.title}</span>
              {room.remainingRooms !== undefined && (
                <span className="text-red-600 text-sm font-semibold">
                  Only {room.remainingRooms} left!
                </span>
              )}
            </div>
            <p className="text-sm sm:text-base text-gray-600 line-clamp-2">
              {room.description}
            </p>
          </div>

          <div className="amenities mt-3 border-t pt-3">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">
              What's included:
            </h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600">
              {roomAmenities.map((amenity) => (
                <div
                  key={amenity}
                  className="flex items-center gap-2 pointer-none"
                >
                  <AmenityIcon name={amenity} />
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="amenities mt-3 border-t pt-3">
            <h4 className="text-sm font-semibold text-gray-800 mb-2 ">
              Rooms Category
            </h4>
            <div className="grid grid-cols-1 gap-x-4 gap-y-1 text-sm text-gray-600 ">
              {MealcategotyData.map((mealOption, index) => (
                <Mealcategoty
                  key={index}
                  desc={mealOption.desc}
                  rate={mealOption.rate}
                  isBookingDisabled={isBookingDisabled}
                  handleAddToCartClick={() => onAddToCart(room, mealOption)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Roomcard;
