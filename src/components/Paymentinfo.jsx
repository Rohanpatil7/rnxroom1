import React, { useState } from "react";
import { toast } from "react-toastify";

// Utility: Luhn check for card number validity
const luhnCheck = (num) => {
  let sum = 0;
  let shouldDouble = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let digit = parseInt(num[i]);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
};

// Logos for wallets
const walletOptions = [
  { id: "amazon", label: "Amazon Pay", logo: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" },
  { id: "gpay", label: "Google Pay", logo: "https://upload.wikimedia.org/wikipedia/commons/5/5a/Google_Pay_Logo.svg" },
  { id: "phonepe", label: "PhonePe", logo: "https://upload.wikimedia.org/wikipedia/commons/f/f0/PhonePe-Logo.svg" },
  { id: "paytm", label: "Paytm", logo: "https://upload.wikimedia.org/wikipedia/commons/5/55/Paytm_logo.png" },
];

function PaymentInfo() {
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [selectedWallet, setSelectedWallet] = useState("");
  const [formData, setFormData] = useState({
    cardNumber: "",
    expMonth: "",
    expYear: "",
    cvv: "",
    zip: "",
    upiId: "",
    walletNumber: "",
  });

  const [errors, setErrors] = useState({});
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Validation logic
  const validate = () => {
    const newErrors = {};

    if (paymentMethod === "card") {
      const trimmedCard = formData.cardNumber.replace(/\s+/g, "");
      if (!/^\d{16}$/.test(trimmedCard)) {
        newErrors.cardNumber = "Card number must be exactly 16 digits.";
      } else if (!luhnCheck(trimmedCard)) {
        newErrors.cardNumber = "Invalid card number.";
      }

      if (!formData.expMonth) newErrors.expMonth = "Select expiration month.";
      if (!formData.expYear) newErrors.expYear = "Select expiration year.";
      if (
        formData.expYear &&
        parseInt(formData.expYear) === currentYear &&
        parseInt(formData.expMonth) < currentMonth
      ) {
        newErrors.expMonth = "Expiry month is in the past.";
      }

      if (!/^\d{3}$/.test(formData.cvv)) {
        newErrors.cvv = "CVV must be exactly 3 digits.";
      }

      if (!/^\d{5,6}$/.test(formData.zip)) {
        newErrors.zip = "Enter a valid 5-6 digit ZIP code.";
      }
    }

    if (paymentMethod === "upi") {
      if (!/^[\w.-]+@[\w.-]+$/.test(formData.upiId)) {
        newErrors.upiId = "Enter a valid UPI ID (e.g., username@upi).";
      }
    }

    if (paymentMethod === "clickToPay") {
      if (!selectedWallet) {
        newErrors.wallet = "Please select a payment provider.";
      } else if (!/^\d{10}$/.test(formData.walletNumber)) {
        newErrors.walletNumber = "Enter a valid 10-digit mobile number.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      const method =
        paymentMethod === "card"
          ? "Credit/Debit Card"
          : paymentMethod === "upi"
          ? "UPI"
          : `Click-to-Pay via ${selectedWallet.toUpperCase()}`;
      toast.success(`Payment via ${method} processed successfully! 🎉`);
    } else {
      toast.error("Please fix the highlighted errors before proceeding.");
    }
  };

  const inputClass = (field) =>
    `h-12 w-full border rounded-lg px-3 mt-1 outline-none focus:ring-2 focus:ring-blue-400 ${
      errors[field] ? "border-red-500" : "border-gray-300"
    }`;

  return (
    <form
      className="bg-white shadow-md rounded-2xl p-4 sm:p-6 md:p-8"
      onSubmit={handleSubmit}
      aria-labelledby="payment-heading"
    >
      <h2 id="payment-heading" className="text-xl md:text-2xl font-semibold mb-2">
        Payment Information
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        Choose your preferred payment method and fill in the required details.
      </p>

      {/* Payment Options */}
      <fieldset className="mb-6">
        <legend className="sr-only">Select Payment Method</legend>
        {[
          { id: "card", label: "Debit Card only" },
          { id: "clickToPay", label: "Click to Pay (Amazon, GPay, PhonePe, Paytm)" },
          { id: "upi", label: "UPI Payment" },
        ].map((option) => (
          <div key={option.id} className="flex items-center gap-3 mb-3">
            <input
              id={`pay-${option.id}`}
              type="radio"
              name="paymentMethod"
              value={option.id}
              checked={paymentMethod === option.id}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-5 h-5"
            />
            <label
              htmlFor={`pay-${option.id}`}
              className="text-sm text-gray-800 font-medium"
            >
              {option.label}
            </label>
          </div>
        ))}
      </fieldset>

      {/* Card Payment Fields */}
      {paymentMethod === "card" && (
        <div className="mb-6">
          {/* Card number */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="col-span-1 lg:col-span-2">
              <label htmlFor="cardNumber" className="text-sm text-gray-700">
                Card Number
              </label>
              <input
                id="cardNumber"
                name="cardNumber"
                value={formData.cardNumber}
                onChange={handleChange}
                className={inputClass("cardNumber")}
                placeholder="XXXX XXXX XXXX XXXX"
              />
              {errors.cardNumber && (
                <p className="text-red-600 text-xs mt-1">{errors.cardNumber}</p>
              )}
            </div>

            <div>
              <label htmlFor="expMonth" className="text-sm text-gray-700">
                Exp. Month
              </label>
              <select
                id="expMonth"
                name="expMonth"
                value={formData.expMonth}
                onChange={handleChange}
                className={inputClass("expMonth")}
              >
                <option value="">Month</option>
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
              {errors.expMonth && (
                <p className="text-red-600 text-xs mt-1">{errors.expMonth}</p>
              )}
            </div>

            <div>
              <label htmlFor="expYear" className="text-sm text-gray-700">
                Exp. Year
              </label>
              <select
                id="expYear"
                name="expYear"
                value={formData.expYear}
                onChange={handleChange}
                className={inputClass("expYear")}
              >
                <option value="">Year</option>
                {[...Array(10)].map((_, i) => (
                  <option key={i} value={currentYear + i}>
                    {currentYear + i}
                  </option>
                ))}
              </select>
              {errors.expYear && (
                <p className="text-red-600 text-xs mt-1">{errors.expYear}</p>
              )}
            </div>
          </div>

          {/* CVV and Zip */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label htmlFor="cvv" className="text-sm text-gray-700">
                CVV
              </label>
              <input
                id="cvv"
                name="cvv"
                value={formData.cvv}
                onChange={handleChange}
                className={inputClass("cvv")}
                placeholder="123"
              />
              {errors.cvv && (
                <p className="text-red-600 text-xs mt-1">{errors.cvv}</p>
              )}
            </div>

            <div>
              <label htmlFor="zip" className="text-sm text-gray-700">
                Billing Zip
              </label>
              <input
                id="zip"
                name="zip"
                value={formData.zip}
                onChange={handleChange}
                className={inputClass("zip")}
                placeholder="Zip Code"
              />
              {errors.zip && (
                <p className="text-red-600 text-xs mt-1">{errors.zip}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* UPI Fields */}
      {paymentMethod === "upi" && (
        <div className="mb-6">
          <label htmlFor="upiId" className="text-sm text-gray-700">
            UPI ID
          </label>
          <input
            id="upiId"
            name="upiId"
            value={formData.upiId}
            onChange={handleChange}
            className={inputClass("upiId")}
            placeholder="username@upi"
          />
          {errors.upiId && (
            <p className="text-red-600 text-xs mt-1">{errors.upiId}</p>
          )}
        </div>
      )}

      {/* Click-to-Pay Fields */}
      {paymentMethod === "clickToPay" && (
        <div className="mb-6">
          <p className="text-sm text-gray-700 mb-2">
            Select your preferred Click-to-Pay provider:
          </p>
          <div className="grid grid-cols-2 gap-4 mb-4">
            {walletOptions.map((wallet) => (
              <button
                type="button"
                key={wallet.id}
                onClick={() => setSelectedWallet(wallet.id)}
                className={`flex items-center justify-center border rounded-lg p-3 transition ${
                  selectedWallet === wallet.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300"
                }`}
              >
                <img
                  src={wallet.logo}
                  alt={wallet.label}
                  className="h-6 mr-2"
                />
                <span className="text-sm font-medium">{wallet.label}</span>
              </button>
            ))}
          </div>
          {errors.wallet && (
            <p className="text-red-600 text-xs mb-3">{errors.wallet}</p>
          )}
          {selectedWallet && (
            <div>
              <label htmlFor="walletNumber" className="text-sm text-gray-700">
                Linked Mobile Number
              </label>
              <input
                id="walletNumber"
                name="walletNumber"
                value={formData.walletNumber}
                onChange={handleChange}
                className={inputClass("walletNumber")}
                placeholder="10-digit mobile number"
              />
              {errors.walletNumber && (
                <p className="text-red-600 text-xs mt-1">
                  {errors.walletNumber}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
      >
        {paymentMethod === "clickToPay"
          ? "Proceed with Click-to-Pay"
          : "Submit Payment"}
      </button>
    </form>
  );
}

export default PaymentInfo;
