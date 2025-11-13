import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const PaySuccess = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [paymentDetails, setPaymentDetails] = useState(null);

    useEffect(() => {
        const details = Object.fromEntries(searchParams.entries());
        if (Object.keys(details).length > 0) {
            setPaymentDetails(details);
        }
    }, [searchParams]);

    const handleBackToHome = () => {
        navigate('/allrooms');
    };

    const tableRows = paymentDetails ? [
        { label: 'Payment Status', value: paymentDetails.status },
        { label: 'Transaction ID', value: paymentDetails.txnid },
        { label: 'Easepay ID', value: paymentDetails.easepayid },
        { label: 'Amount', value: `₹${parseFloat(paymentDetails.amount).toFixed(2)}` },
        { label: 'Email', value: paymentDetails.email },
        { label: 'Phone', value: paymentDetails.phone },
        { label: 'Card Type', value: paymentDetails.card_type },
        { label: 'Bank Ref Num', value: paymentDetails.bank_ref_num },
        { label: 'Product Info', value: paymentDetails.productinfo },
        { label: 'Error Message', value: paymentDetails.error_Message },
    ] : [];

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl max-w-2xl w-full text-center">
                <svg className="w-16 h-16 mx-auto text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h1 className="text-3xl sm:text-4xl text-red-600 font-bold mt-4">Payment Failed!</h1>
                <p className="text-base sm:text-lg text-gray-600 my-4">
                    We're sorry, but your payment could not be processed.
                </p>

                {paymentDetails && (
                    <div className="text-left my-6 sm:my-8 border-t border-b border-gray-200 py-4">
                        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 text-center">Transaction Details</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {tableRows.map(row => (
                                        <tr key={row.label} className="hover:bg-gray-50">
                                            <td className="px-4 sm:px-6 py-3 text-sm font-medium text-gray-600 whitespace-nowrap">{row.label}</td>
                                            <td className="px-4 sm:px-6 py-3 text-sm text-gray-800 font-semibold whitespace-nowrap">{row.value}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <button
                    className="py-2 px-6 text-base text-white bg-indigo-600 rounded-lg cursor-pointer hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition-colors"
                    onClick={handleBackToHome}
                >
                    Back to Rooms
                </button>

               
            </div>
        </div>
    );
};

export default PaySuccess;