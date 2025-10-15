import axios from 'axios';
import {
  HOTEL_DETAILS_CONFIG,
  ROOM_RATES_CONFIG,
  TAXES_CONFIG
} from './api_config';

/**
 * Fetches detailed information for a hotel.
 * @returns {Promise<object>} A promise that resolves to the API response data.
 */
export async function getHotelDetails() {
  const { Url, ...payload } = HOTEL_DETAILS_CONFIG;

  console.log('📡 Calling:', Url);
  console.log('📤 Sending payload:', payload);
  

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
  const backendURL = '/initiate-payment'; // 👈 Your backend server
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


/**
 * Fetches room categories and meal-plan rates for a specific date.
 * @param {object} [params] - The parameters for the request.
 * @param {string} [params.BookingDate] - The date to fetch rates for (YYYY-MM-DD).
 * @returns {Promise<object>} A promise that resolves to the API response data.
 */
export async function getRoomRates(params = {}) {
  const { Url, ...basePayload } = ROOM_RATES_CONFIG;
  
  // Combine the base credentials with any dynamic parameters like BookingDate
  const payload = {
    ...basePayload,
    ...params,
  };

  console.log(`Fetching room rates from: ${Url} for date: ${payload.BookingDate}`);
  try {
    const response = await axios.post(Url, payload);
    return response.data;
  } catch (error) {
    console.error('Error fetching room rates:', error.message);
    throw error;
  }
}


/**
 * Fetches all active tax groups for a hotel.
 * @returns {Promise<object>} A promise that resolves to the API response data.
 */
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

