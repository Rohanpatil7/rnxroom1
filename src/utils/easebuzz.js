// src/utils/easebuzz.js

const initiatePayment = (accessKey, onResponse) => {
  if (!accessKey) {
    console.error("Access Key is required to initiate payment.");
    return;
  }
  
  // Replace with your Merchant Key from the Easebuzz dashboard
  // It's best to store this in an environment variable
  const merchantKey = import.meta.env.EASEBUZZ_MERCHANT_KEY || "FNSMRJNQPJ";
  
  const easebuzzCheckout = new window.EasebuzzCheckout(merchantKey, "prod");
  const options = {
    access_key: accessKey, // The access_key received from your server
    onResponse: onResponse, // A callback function to handle the response
    theme: "indigo", // Your brand color
  };

  easebuzzCheckout.initiatePayment(options);
};

export default initiatePayment;