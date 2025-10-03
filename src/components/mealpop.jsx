import React, { useEffect } from 'react';

// Renamed to Mealpop and it now accepts an `onClose` prop
function Mealpop({ onClose }) {
  const meal = ["Apple", "Banana", "Orange", "Fresh Juice"];

  // This useEffect hook manages the side effect of disabling/enabling body scroll.
  useEffect(() => {
    // Get the original overflow style of the body
    const originalStyle = window.getComputedStyle(document.body).overflow;
    
    // When the component mounts, disable scrolling on the body
    document.body.style.overflow = 'hidden';

    // This is a cleanup function that will be called when the component unmounts
    return () => {
      // Restore the original overflow style
      document.body.style.overflow = originalStyle;
    };
  }, []); // The empty dependency array [] ensures this effect runs only once on mount and unmount.

  return (
    // Modal overlay: covers the entire screen
    <div
      className="fixed inset-0 z-1000 flex items-center justify-center backdrop-blur-md bg-opacity-50"
      onClick={onClose} // Close modal if you click on the overlay
    >
      {/* Modal content: stop propagation to prevent closing when clicking inside */}
      <div
        className="relative w-full max-w-md p-6 bg-white rounded-lg shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h4 className="text-xl font-semibold text-gray-800 mb-4">What's Included</h4>
        
        <ul className="list-disc list-inside space-y-2 text-gray-600">
          {meal.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>

        {/* Close button inside the modal */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
        >
          {/* A simple 'X' icon for closing */}
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  );
}

export default Mealpop;