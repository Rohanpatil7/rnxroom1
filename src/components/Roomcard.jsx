import React, { useState, useEffect, useRef } from "react";

// --- Data and Helper Components ---

// Static data for room amenities based on room title
const amenitiesData = {
  "Deluxe Room": ["High-Speed Wi-Fi", "Air Conditioning", "Smart TV", "Mini Bar"],
  "Ultra Deluxe Room": ["High-Speed Wi-Fi", "Air Conditioning", "Smart TV", "Mini Bar", "Jacuzzi Bathtub", "Work Desk"],
  "Standard Room": ["High-Speed Wi-Fi", "Air Conditioning", "Smart TV"],
  "Ultra Deluxe": ["High-Speed Wi-Fi", "Air Conditioning", "Smart TV", "Mini Bar", "Jacuzzi Bathtub", "Work Desk"], // Added for consistency with Booking.jsx
  "default": ["High-Speed Wi-Fi", "Air Conditioning", "Smart TV"] // Fallback amenities
};

// Helper component to render an SVG icon based on the amenity name
const AmenityIcon = ({ name }) => {
  const iconClasses = "w-4 h-4 text-indigo-600";
  let iconSvg;

  switch (name) {
    case "High-Speed Wi-Fi":
      iconSvg = <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.5 5.5 0 017.424 0M5.136 11.886a9.5 9.5 0 0113.728 0M2 8.734a13.5 13.5 0 0119.996 0" />;
      break;
    case "Air Conditioning":
      iconSvg = <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m-4.879-8.364l9.758 9.758m-9.758 0l9.758-9.758" />;
      break;
    case "Smart TV":
      iconSvg = <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />;
      break;
    case "Mini Bar":
      iconSvg = <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M9 18h6" />;
      break;
    case "Jacuzzi Bathtub":
        iconSvg = <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16v4m-2-2h4m2 10h-4m2 2v-4m5 4v-4m-2 2h4M9 11a3 3 0 100-6 3 3 0 000 6z" />;
        break;
    case "Work Desk":
        iconSvg = <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />;
        break;
    default:
      return null;
  }

  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      {iconSvg}
    </svg>
  );
};

// --- Main Room Card Component ---

function Roomcard({ room, bookingDetails, onAddToCart }) { // Accept onAddToCart prop
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const intervalRef = useRef(null);

  const roomImages = room.images && room.images.length > 0 ? room.images : [
    'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg',
    'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg',
    'https://images.pexels.com/photos/262048/pexels-photo-262048.jpeg'
  ];

  const isBookingDisabled = !bookingDetails.checkIn || !bookingDetails.checkOut;
  
  // Get the amenities for the current room, with a fallback to default
  const roomAmenities = amenitiesData[room.title] || amenitiesData.default;

  const goToNext = React.useCallback(() => {
    setCurrentImageIndex((prevIndex) => (prevIndex === roomImages.length - 1 ? 0 : prevIndex + 1));
  }, [roomImages.length]);

  const handleNextImage = (e) => { e.stopPropagation(); e.preventDefault(); goToNext(); };
  const handlePrevImage = (e) => { e.stopPropagation(); e.preventDefault(); setCurrentImageIndex((prevIndex) => (prevIndex === 0 ? roomImages.length - 1 : prevIndex - 1)); };
  
  const stopAutoSlide = React.useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const startAutoSlide = React.useCallback(() => {
    stopAutoSlide();
    intervalRef.current = setInterval(goToNext, 3000);
  }, [stopAutoSlide, goToNext]);

  useEffect(() => {
    startAutoSlide();
    return () => stopAutoSlide();
  }, [startAutoSlide, stopAutoSlide]);

  const handleAddToCartClick = (e) => {
    if (isBookingDisabled) {
      e.preventDefault();
      alert("Please select your check-in and check-out dates first.");
    } else {
      onAddToCart(); // Call the passed in function
    }
  };

  return (
    <div className="p-2 xl:w-6xl sm:p-4 flex flex-col sm:flex-row rounded-xl overflow-hidden transition-transform duration-200 ease-in hover:scale-105 cursor-pointer bg-white text-gray-500/90 shadow-[0px_4px_4px_rgba(0,0,0,0.05)] hover:shadow-2xl">

      <div className="relative w-full sm:w-96 h-64 sm:h-auto flex-shrink-0 overflow-hidden rounded-2xl" onMouseEnter={stopAutoSlide} onMouseLeave={startAutoSlide}>
        <div className="flex transition-transform duration-500 ease-in-out h-full" style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}>
          {roomImages.map((src, index) => (<img key={index} className="w-full h-full object-cover flex-shrink-0" src={src} alt={`${room.title} view ${index + 1}`}/>))}
        </div>
        <div className="absolute inset-0 flex items-center justify-between p-2">
            <button onClick={handlePrevImage} className="bg-black/40 text-white p-1 rounded-full hover:bg-black/60 transition-colors focus:outline-none z-10" aria-label="Previous image"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
            <button onClick={handleNextImage} className="bg-black/40 text-white p-1 rounded-full hover:bg-black/60 transition-colors focus:outline-none z-10" aria-label="Next image"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>
        </div>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-2">
            {roomImages.map((_, index) => (<div key={index} onClick={(e) => { e.stopPropagation(); e.preventDefault(); setCurrentImageIndex(index); }} className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${currentImageIndex === index ? 'bg-white scale-125' : 'bg-white/50'}`}/>))}
        </div>
      </div>

      <div className="w-full sm:p-4 pt-4 sm:pt-5 flex flex-col justify-between">
        <div>
          <div className="roomdetails flex flex-col gap-2">
            <p className="font-playfair text-3xl font-bold text-indigo-700">{room.title}</p>
            <p className="text-sm sm:text-base text-gray-600 line-clamp-2">{room.description}</p>
          </div>

          <div className="amenities mt-3 border-t pt-3">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">What's included:</h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600">
              {roomAmenities.map((amenity) => (
                <div key={amenity} className="flex items-center gap-2">
                  <AmenityIcon name={amenity} />
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex justify-between items-center mt-4">
            <p className="text-sm sm:text-base"><span className="text-xl text-gray-800">₹{room.pricePerNight.toLocaleString("en-IN")}</span>/Night</p>
            {room.remainingRooms !== undefined && (<p className="text-red-600 text-sm font-semibold">Only {room.remainingRooms} left!</p>)}
            <button onClick={handleAddToCartClick} className={`rounded-full px-6 py-2 text-xs sm:text-sm font-medium border transition-all ${isBookingDisabled ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-indigo-600 text-white hover:shadow-xl'}`}>
                Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Roomcard;