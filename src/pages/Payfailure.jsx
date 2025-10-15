import React from "react";
import { useNavigate } from "react-router-dom";

const PayFailure = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
                <h1 className="text-4xl font-bold text-red-600 mb-4">Payment Failed</h1>
                <p className="text-gray-600 mb-6">
                    Unfortunately, your payment could not be processed. Please try again.
                </p>
                <button
                    onClick={() => navigate("/allrooms")}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    Back to Rooms
                </button>
            </div>
        </div>
    );
};

export default PayFailure;