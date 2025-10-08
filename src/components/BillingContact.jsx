import React, { useState } from 'react';

// The component now accepts an `onSubmitBooking` prop
function BillingContact({ onSubmitBooking }) {
  const [billingDetails, setBillingDetails] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'India',
  });

  // State to hold validation errors
  const [errors, setErrors] = useState({});

  // --- Validation Logic ---
  const validate = () => {
    const newErrors = {};
    const { fullName, email, phone, address, city, state, zip } = billingDetails;

    // Full Name validation
    if (!fullName.trim()) newErrors.fullName = 'Full Name is required.';

    // Email validation
    if (!email) {
      newErrors.email = 'Email address is required.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email address is invalid.';
    }

    // Phone validation (must be 10 digits)
    if (!phone) {
      newErrors.phone = 'Phone number is required.';
    } else if (!/^\d{10}$/.test(phone)) {
      newErrors.phone = 'Phone number must be exactly 10 digits.';
    }

    // Address validation
    if (!address.trim()) newErrors.address = 'Street Address is required.';
    
    // City validation
    if (!city.trim()) newErrors.city = 'City is required.';
    
    // State validation
    if (!state.trim()) newErrors.state = 'State / Province is required.';
    
    // ZIP code validation
    if (!zip.trim()) newErrors.zip = 'ZIP / Postal Code is required.';

    return newErrors;
  };


  const handleChange = (e) => {
    const { id, value } = e.target;
    
    let processedValue = value;

    // For the phone field, remove any non-digit characters.
    // The maxLength attribute on the input will handle the length.
    if (id === 'phone') {
      processedValue = value.replace(/[^0-9]/g, '');
    }
    
    setBillingDetails(prevDetails => ({
      ...prevDetails,
      [id]: processedValue,
    }));

    // Clear the error for the field being edited for better UX
    if (errors[id]) {
      setErrors(prevErrors => ({
        ...prevErrors,
        [id]: null,
      }));
    }
  };

  // This function is called when the form is submitted.
  const handleFinalSubmit = (e) => {
    e.preventDefault(); // Prevents default form submission
    
    // Run the validation function
    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      // If there are errors, update the errors state and stop submission
      setErrors(validationErrors);
      return;
    }
    
    // If validation passes, clear any old errors and submit the data
    setErrors({});
    console.log("Form submitted successfully:", billingDetails);
    onSubmitBooking(billingDetails);
  };


  return (
    <div className="w-full bg-white rounded-2xl shadow-xl p-6 sm:p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Billing Information</h2>
      {/* The form now calls handleFinalSubmit */}
      <form className="space-y-4" onSubmit={handleFinalSubmit} noValidate>
        {/* Full Name */}
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            type="text"
            id="fullName"
            value={billingDetails.fullName}
            onChange={handleChange}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm ${errors.fullName ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'}`}
            placeholder="Jane Doe"
            required
          />
          {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
        </div>

        {/* Email and Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={billingDetails.email}
              onChange={handleChange}
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm ${errors.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'}`}
              placeholder="you@example.com"
              required
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel" // Changed to "tel" for better semantics and mobile experience
              id="phone"
              value={billingDetails.phone}
              onChange={handleChange}
              maxLength="10"
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm ${errors.phone ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'}`}
              placeholder="9876543210"
              required
            />
             {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
          </div>
        </div>

        {/* Street Address */}
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
            Street Address
          </label>
          <input
            type="text"
            id="address"
            value={billingDetails.address}
            onChange={handleChange}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm ${errors.address ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'}`}
            placeholder="123 Main St, Apartment 4B"
            required
          />
          {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
        </div>

        {/* City, State, ZIP */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <input
              type="text"
              id="city"
              value={billingDetails.city}
              onChange={handleChange}
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm ${errors.city ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'}`}
              required
            />
            {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
          </div>
          <div>
            <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
              State / Province
            </label>
            <input
              type="text"
              id="state"
              value={billingDetails.state}
              onChange={handleChange}
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm ${errors.state ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'}`}
              required
            />
            {errors.state && <p className="mt-1 text-sm text-red-600">{errors.state}</p>}
          </div>
          <div>
            <label htmlFor="zip" className="block text-sm font-medium text-gray-700 mb-1">
              ZIP / Postal Code
            </label>
            <input
              type="text"
              id="zip"
              value={billingDetails.zip}
              onChange={handleChange}
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm ${errors.zip ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'}`}
              required
            />
            {errors.zip && <p className="mt-1 text-sm text-red-600">{errors.zip}</p>}
          </div>
        </div>
        
        <div className="pt-4">
          <button 
              type="submit" 
              className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-all duration-300 ease-in-out transform hover:scale-105 cursor-pointer"
          >
              Continue to Payment
          </button>
        </div>
      </form>
    </div>
  );
}

export default BillingContact;

