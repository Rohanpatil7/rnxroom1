import React, { useState, useEffect, useRef } from 'react';

// Helper function to format dates
const formatDate = (date) => {
  if (!date) return '';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
};

// SVG Icon Components
const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-gray-400">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
    <line x1="16" x2="16" y1="2" y2="6"></line>
    <line x1="8" x2="8" y1="2" y2="6"></line>
    <line x1="3" x2="21" y1="10" y2="10"></line>
  </svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-gray-400">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const ChevronLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
    <path d="m15 18-6-6 6-6"></path>
  </svg>
);

const ChevronRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
    <path d="m9 18 6-6-6-6"></path>
  </svg>
);

const MoonIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-gray-400">
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
    </svg>
);

// Main Application Component
export default function DatePricePicker({ onDateChange = () => {} }) {
  const [checkInDate, setCheckInDate] = useState(null);
  const [checkOutDate, setCheckOutDate] = useState(null);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isGuestPickerOpen, setIsGuestPickerOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [pricingData, setPricingData] = useState({});

  const pickerRef = useRef(null);
  const guestPickerRef = useRef(null);

  const totalGuests = adults + children;
  const numberOfNights =
    checkInDate && checkOutDate
      ? Math.round((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0;
  
  // Effect to sync state with parent component
  useEffect(() => {
    onDateChange({
      checkIn: checkInDate,
      checkOut: checkOutDate,
      nights: numberOfNights,
      adults: adults,
      children: children,
      guests: totalGuests,
    });
  }, [checkInDate, checkOutDate, adults, children, numberOfNights, onDateChange, totalGuests]);


  // Effect to fetch pricing data when the month changes
  useEffect(() => {
    // Mock data generation
    const mockData = {};
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(year, month, i);
        const dayOfWeek = date.getDay();
        const basePrice = 3000;
        let price = basePrice + (i % 10) * 4; // Vary price slightly by day
        if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday & Saturday
        price += 40;
        }
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        mockData[dateString] = price;
    }
    setPricingData(mockData);
  }, [currentMonth]);


  // Effect to handle clicks outside the component
  useEffect(() => {
    function handleClickOutside(event) {
        if (pickerRef.current && !pickerRef.current.contains(event.target)) {
            setIsCalendarOpen(false);
            setIsGuestPickerOpen(false);
        }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [pickerRef]);

  const handleDateClick = (day) => {
    if (!checkInDate || (checkInDate && checkOutDate)) {
      setCheckInDate(day);
      setCheckOutDate(null);
    } else if (day > checkInDate) {
      setCheckOutDate(day);
      setIsCalendarOpen(false);
    } else {
      setCheckInDate(day);
      setCheckOutDate(null);
    }
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`}></div>);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const day = new Date(year, month, i);
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const price = pricingData[dateString];

      let classes = "aspect-square flex flex-col items-center justify-center rounded-lg cursor-pointer transition-colors duration-200 text-xs sm:text-sm";
      let priceTextClass = "text-[10px] sm:text-xs mt-1 font-bold";
      const isPast = day < today;
      const isToday = day.getTime() === today.getTime();
      const isCheckIn = checkInDate && day.getTime() === checkInDate.getTime();
      const isCheckOut = checkOutDate && day.getTime() === checkOutDate.getTime();
      const isInRange = checkInDate && checkOutDate && day > checkInDate && day < checkOutDate;
      if (isPast) {
        classes += " text-gray-300 cursor-not-allowed";
        priceTextClass += " text-gray-300";
      } else {
         if (isCheckIn || isCheckOut) { classes += " bg-indigo-600 text-white"; priceTextClass += " text-indigo-200"; }
         else if (isInRange) { classes += " bg-indigo-100 text-indigo-700"; priceTextClass += " text-green-800"; }
         else if (isToday) { classes += " bg-gray-200 text-gray-800"; priceTextClass += " text-green-700"; }
         else { classes += " hover:bg-indigo-100"; priceTextClass += " text-green-600"; }
      }
      days.push(
        <div key={i} className={classes} onClick={() => !isPast && handleDateClick(day)}>
          <span>{i}</span>
          {!isPast && price != null && <span className={priceTextClass}>₹{price}</span>}
        </div>
      );
    }
    return (
      <div className="absolute top-full mt-2 w-md-[100vw] max-w-sm left-1/2 -translate-x-1/2 md:w-auto md:max-w-none md:left-0 md:translate-x-0 bg-white p-4 rounded-lg shadow-2xl border border-gray-200 z-100 sm:w-full">
        <div className="flex items-center justify-between mb-4">
          <button type="button" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="p-2 rounded-full hover:bg-gray-100"><ChevronLeftIcon /></button>
          <div className="font-semibold text-lg text-gray-800  ">{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</div>
          <button type="button" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="p-2 rounded-full hover:bg-gray-100"><ChevronRightIcon /></button>
        </div>
        <div className="grid grid-cols-7 gap-8 sm:gap-6 text-center text-xs sm:text-sm text-gray-500 mb-2"><div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div></div>
        <div className="grid grid-cols-7 gap-8 text-center items-center">{days}</div>
        <div className="mt-4 flex justify-end"><button onClick={() => { setCheckInDate(null); setCheckOutDate(null); }} className="text-sm font-semibold text-gray-600 hover:text-gray-900 px-4 py-2 rounded-md hover:bg-gray-100">Clear Dates</button></div>
      </div>
    );
  };
  
  const renderGuestPicker = () => (
    <div ref={guestPickerRef} className="absolute top-full mt-2 w-[95vw] max-w-xs left-1/2 -translate-x-1/2 md:w-72 md:left-auto md:right-0 md:-translate-x-0 bg-white p-4 rounded-lg shadow-2xl border border-gray-200 z-20">
        <div className="flex justify-between items-center mb-4">
            <div>
                <p className="font-semibold">Adults</p>
                <p className="text-sm text-gray-500">Ages 13 or above</p>
            </div>
            <div className="flex items-center space-x-2">
                <button onClick={() => setAdults(Math.max(1, adults - 1))} className="h-8 w-8 rounded-full border flex items-center justify-center text-lg hover:bg-gray-100 disabled:opacity-50" disabled={adults <= 1}>-</button>
                <span className="w-4 text-center">{adults}</span>
                <button onClick={() => setAdults(adults + 1)} className="h-8 w-8 rounded-full border flex items-center justify-center text-lg hover:bg-gray-100">+</button>
            </div>
        </div>
        <div className="flex justify-between items-center">
            <div>
                <p className="font-semibold">Children</p>
                <p className="text-sm text-gray-500">Ages 2-12</p>
            </div>
            <div className="flex items-center space-x-2">
                <button onClick={() => setChildren(Math.max(0, children - 1))} className="h-8 w-8 rounded-full border flex items-center justify-center text-lg hover:bg-gray-100 disabled:opacity-50" disabled={children <= 0}>-</button>
                <span className="w-4 text-center">{children}</span>
                <button onClick={() => setChildren(children + 1)} className="h-8 w-8 rounded-full border flex items-center justify-center text-lg hover:bg-gray-100">+</button>
            </div>
        </div>
        <div className="border-t border-gray-200 mt-4 pt-4 flex justify-end">
            <button 
                onClick={() => setIsGuestPickerOpen(false)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg transition duration-300"
            >
                Set
            </button>
        </div>
    </div>
  );

  return (
    <div className="w-full flex items-start justify-center px-4 sm:px-4 font-sans">
      <div ref={pickerRef} className="relative w-6xl max-w-4xl">
        <div className="bg-white rounded-xl md:rounded-full shadow-lg p-2 flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-1 w-full">
          {/* Check-in */}  
          <div onClick={() => { setIsCalendarOpen(true); setIsGuestPickerOpen(false); }} className="flex-1 w-full p-2 rounded-full hover:bg-gray-100 cursor-pointer text-left">
            <label className="text-xs font-bold text-gray-500 px-2">Check-in</label>
            <div className="flex items-center space-x-2 px-2"><CalendarIcon /><span className={`text-sm ${checkInDate ? 'text-gray-800' : 'text-gray-400'}`}>{checkInDate ? formatDate(checkInDate) : 'Add date'}</span></div>
          </div>
          <div className="h-px w-full bg-gray-200 md:h-8 md:w-px"></div>
          {/* Check-out */}
          <div onClick={() => { setIsCalendarOpen(true); setIsGuestPickerOpen(false); }} className="flex-1 w-full p-2 rounded-full hover:bg-gray-100 cursor-pointer text-left">
            <label className="text-xs font-bold text-gray-500 px-2">Check-out</label>
            <div className="flex items-center space-x-2 px-2"><CalendarIcon /><span className={`text-sm ${checkOutDate ? 'text-gray-800' : 'text-gray-400'}`}>{checkOutDate ? formatDate(checkOutDate) : 'Add date'}</span></div>
          </div>
          
          {numberOfNights > 0 && (
            <div className="w-full md:w-auto flex items-center">
                <div className="h-px w-full bg-gray-200 md:h-8 md:w-px"></div>
                <div className="w-full p-2 text-left">
                    <label className="text-xs font-bold text-gray-500 px-2">Duration</label>
                    <div className="flex items-center space-x-2 px-2"><MoonIcon /><span className="text-sm text-gray-800 font-semibold">{numberOfNights} night{numberOfNights > 1 ? 's' : ''}</span></div>
                </div>
            </div>
          )}
          <div className="h-px w-full bg-gray-200 md:h-8 md:w-px"></div>
          {/* Guests */}
          <div className="flex-1 w-full p-2 relative">
            <div onClick={() => { setIsGuestPickerOpen(prev => !prev); setIsCalendarOpen(false); }} className="text-left cursor-pointer rounded-full hover:bg-gray-100 p-2">
                <label className="text-xs font-bold text-gray-500 px-2">Guests</label>
                <div className="flex items-center space-x-2 px-2"><UserIcon /><span className="text-sm text-gray-800">{totalGuests} guest{totalGuests > 1 ? 's' : ''}</span></div>
            </div>
            {isGuestPickerOpen && renderGuestPicker()}
          </div>
          {/* Search Button */}
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 sm:px-6 rounded-full transition duration-300 w-full md:w-auto">Search</button>
        </div>
        {isCalendarOpen && renderCalendar()}
      </div>
    </div>
  );
}