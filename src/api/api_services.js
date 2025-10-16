import axios from 'axios';
import {
  HOTEL_DETAILS_CONFIG,
  ROOM_RATES_CONFIG,
  TAXES_CONFIG
} from './api_config';

// ... (getHotelDetails function remains the same) ...
export async function getHotelDetails() {
  const { Url, ...payload } = HOTEL_DETAILS_CONFIG;
  console.log('Fetching hotel details from:', Url);
  try {
    const response = await axios.post(Url, payload);
    return response.data;
  } catch (error) {
    console.error('Error fetching hotel details:', error.message);
    throw error;
  }
}


/**
 * Initiates payment with backend server.
 * @param {object} paymentData - { amount, firstname, email, phone, productinfo }
 * @returns {Promise<object>} - Payment gateway response.
 */
export async function initiatePayment(paymentData) {
  // ✅ MODIFIED: Consistent path for both dev and prod
  const paymentPath = '/booking/initiate-payment';

  // ✅ MODIFIED: Use an environment variable for the production backend URL
  const backendURL = import.meta.env.DEV
    ? paymentPath // Uses the proxy in development
    : (import.meta.env.VITE_BACKEND_URL || '') + paymentPath; // Uses your deployed backend URL in production

  console.log('Initiating payment via:', backendURL);

  try {
    const response = await axios.post(backendURL, paymentData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Payment API error:', error.message);
    throw error;
  }
}

// ... (getRoomRates and getTaxes functions remain the same) ...
export async function getRoomRates(params = {}) {
  const { Url, ...basePayload } = ROOM_RATES_CONFIG;
  const payload = { ...basePayload, ...params };
  console.log(`Fetching room rates from: ${Url} for date: ${payload.BookingDate}`);
  try {
    const response = await axios.post(Url, payload);
    return response.data;
  } catch (error) {
    console.error('Error fetching room rates:', error.message);
    throw error;
  }
}

export async function getTaxes() {
  const { Url, ...payload } = TAXES_CONFIG;
  console.log('Fetching taxes from:', Url);
  try {
    const response = await axios.post(Url, payload);
    return response.data;
  } catch (error) {
    console.error('Error fetching taxes:', error.message);
    throw error;
  }
}