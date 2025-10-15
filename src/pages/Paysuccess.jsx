import React from 'react';
import { useNavigate } from 'react-router-dom';

const PaySuccess = () => {
    const navigate = useNavigate();

    const handleBackToHome = () => {
        navigate('/allrooms');
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen text-center bg-gray-50">
            <h1 className="text-4xl text-green-500 font-bold">Payment Successful!</h1>
            <p className="text-xl my-5">
                Thank you for your payment. Your booking has been confirmed.
            </p>
            <button
                className="py-2 px-5 text-base text-white bg-green-500 rounded-md cursor-pointer hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                onClick={handleBackToHome}
            >
                Back to Home
            </button>
        </div>
    );
};

export default PaySuccess;