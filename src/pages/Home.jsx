import React, { useState, useEffect, useCallback } from "react"; // CHANGED: Imported useCallback
import DatePricePicker from "../components/DatePricePicker.jsx";
import { NavLink } from "react-router-dom";

// Helper SVG components for slider arrows (no changes here)
const ChevronLeftIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 18-6-6 6-6"></path>
  </svg>
);
const ChevronRightIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6"></path>
  </svg>
);


function Home({ hotelData, isBookingDisabled }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const [bookingDetails, setBookingDetails] = useState({
    checkIn: null,
    checkOut: null,
    nights: 0,
  });

  const hasImages = hotelData?.HotelImages && hotelData.HotelImages.length > 0;

  // CHANGED: Wrapped slide navigation functions in useCallback
  const prevSlide = useCallback(() => {
    if (!hasImages) return;
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? hotelData.HotelImages.length - 1 : prevIndex - 1
    );
  }, [hasImages, hotelData?.HotelImages.length]);

  const nextSlide = useCallback(() => {
    if (!hasImages) return;
    setCurrentIndex((prevIndex) =>
      prevIndex === hotelData.HotelImages.length - 1 ? 0 : prevIndex + 1
    );
  }, [hasImages, hotelData?.HotelImages.length]);


  // Effect for auto-sliding every 5 seconds
  useEffect(() => {
    if (!hasImages) return;
    const slideInterval = setInterval(nextSlide, 5000);
    return () => clearInterval(slideInterval);
  }, [hasImages, nextSlide]); // CHANGED: Simplified dependency array


  if (!hotelData) {
    return <div className="text-center text-xl p-10">Waiting for hotel data...</div>;
  }

  return (
    <div>
      {/* Hero section is now a dynamic slider */}
      <section className="relative h-[50vh] md:h-[600px]  w-full text-white bg-gray-800 ">
        {hasImages ? (
          <>
            {/* Slider Background Images */}
            <div className="w-full h-full overflow-hidden shadow:bg-linear-to-t from-sky-500 to-indigo-500">
              <div
                className="flex h-full transition-transform ease-out duration-700 "
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
              >
               {hotelData?.HotelImages.map((image, index) => (
                  <div key={index} className="w-full h-full flex-shrink-0">
                    <img
                      src={image}
                      alt={`Hotel View ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
                
            {/* Slider Controls */}
            <>
              {/* Left Arrow */}
              <button onClick={prevSlide} className="absolute top-1/2 left-5 -translate-y-1/2 rounded-full p-2 bg-black/30 hover:bg-black/60 transition-colors cursor-pointer z-10">
                <ChevronLeftIcon />
              </button>
              {/* Right Arrow */}
              <button onClick={nextSlide} className="absolute top-1/2 right-5 -translate-y-1/2 rounded-full p-2 bg-black/30 hover:bg-black/60 transition-colors cursor-pointer z-10">
                <ChevronRightIcon />
              </button>
            </>

            {/* Navigation Dots */}
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex space-x-3">
              {hotelData?.HotelImages.map((_, slideIndex) => (
                <div
                  key={slideIndex}
                  onClick={() => setCurrentIndex(slideIndex)}
                  className={`h-1 w-4 rounded-full cursor-pointer transition-all ${
                    currentIndex === slideIndex ? 'bg-white scale-125' : 'bg-white/50'
                  }`}
                ></div>
              ))}
            </div>
             {/* DatePricePicker placed below the image slider */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-full max-w-4xl p-4 flex flex-col items-center justify-center">
        <p className="text-xl font-semibold">Select Date To Book Your Room</p>
        <DatePricePicker onDateChange={setBookingDetails} />
      </div>
          </>
          
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-blue-600">
             <div className="w-full max-w-4xl">
                <DatePricePicker onDateChange={setBookingDetails} />
              </div>
          </div>
        )}
      </section>

      {/* Property Section */}
      <div className="flex mt-4 flex-col h-full w-full md:px-4">
        <div className="abiutprop">
          <h1 className="text-3xl font-semibold text-center mx-auto" >
            About our Property
          </h1>
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-center gap-8 px-4 md:px-0 py-10">
            <img
              className="max-w-sm w-full rounded-xl h-auto outline-3 outline-offset-2 outline-dashed outline-indigo-500"
              src={hotelData?.HotelImages[0] || ""}
              alt={hotelData?.HotelName || "Hotel"}
            />
            <div>
              <p>{hotelData?.AboutHotel}</p>
            </div>
          </div>

          <div className="max-w-4xl mx-auto flex flex-col-reverse md:flex-row items-center justify-center gap-8 px-4 md:px-0 py-10">
            <div>
              <p>{hotelData?.AboutHotel}</p>
            </div>
            <img
              className="max-w-sm w-full rounded-xl h-auto outline-3 outline-offset-2 outline-dashed outline-indigo-500"
              src={hotelData?.HotelImages[1] || ""}
              alt={hotelData?.HotelName || "Hotel"}
            />
            
          </div>
        </div>

        {/* Amenities Section */}
        {hotelData?.HotelAmenities && hotelData?.HotelAmenities.length > 0 && (
          <div className="px-auto flex flex-col px-4 sm:px-12 md:px-24">
            <h1 className="text-3xl font-semibold text-center mx-auto">Facilities We Provide</h1>
            <div className="relative max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8 sm:gap-12 md:gap-20 pt-16">
              {hotelData?.HotelAmenities.map((amenity, index) => (
                <div key={index} className="flex flex-col items-center text-center">
                  <div className="size-18 p-2 bg-linear-to-t from-sky-500 to-indigo-500 rounded-lg">
                    <img src={amenity.IconUrl} alt={amenity.Name} className="w-full h-full object-contain"/>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-slate-600">{amenity.Name}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Policies Section */}
        {hotelData?.HotelPolicies && hotelData?.HotelPolicies.length > 0 && (
          <div className="px-4 sm:px-12 md:px-24 my-4">
            <h3 className="text-3xl font-semibold text-center mx-auto py-8">Hotel Policies</h3>
            <ul className="max-w-3xl mx-auto list-disc list-inside space-y-2 text-gray-600 text-left">
              {hotelData?.HotelPolicies.map((policy, index) => (
                <li key={index}>{policy}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Room Selection */}
        <div className="flex justify-between items-center px-4 sm:px-8 md:px-24 h-20 sticky bottom-0 bg-white shadow-[0_-4px_10px_-5px_rgba(0,0,0,0.1)] gap-4">
          <div className="flex-1">
            <p className="font-bold text-lg">Ready to book?</p>
            <p className="text-sm text-gray-500">Select your dates to see available rooms.</p>
          </div>
          <div className="w-auto">
            <NavLink
              to="/allrooms"
              state={{ initialBookingDetails: bookingDetails }}
              className={`rounded-full w-full px-6 py-3 text-sm font-medium border transition-all bg-linear-to-top from-sky-500 to-indigo-500 ${
                isBookingDisabled
                  ? "bg-gray-400 text-white cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg shadow-indigo-200"
              }`}
            >
              Select Rooms
            </NavLink>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;