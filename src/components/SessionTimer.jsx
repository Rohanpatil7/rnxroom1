import React, { useState, useEffect } from 'react';

const SessionTimer = ({ expiryTimestamp, onExpiry }) => {
    const calculateTimeLeft = () => {
        const difference = +new Date(expiryTimestamp) - +new Date();
        let timeLeft = {};

        if (difference > 0) {
            timeLeft = {
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }

        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setTimeout(() => {
            const newTimeLeft = calculateTimeLeft();
            setTimeLeft(newTimeLeft);
            if (Object.keys(newTimeLeft).length === 0) {
                onExpiry();
            }
        }, 1000);

        return () => clearTimeout(timer);
    });

    if (!timeLeft.minutes && !timeLeft.seconds) {
        return null;
    }

    return (
        <div className="fixed top-20 right-4 md:top-24 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded-lg shadow-lg z-50">
            <p className="text-sm font-semibold">Your session expires in:</p>
            <p className="text-lg font-mono text-center">
                <span>{String(timeLeft.minutes || 0).padStart(2, '0')}</span>
                <span>:</span>
                <span>{String(timeLeft.seconds || 0).padStart(2, '0')}</span>
            </p>
        </div>
    );
};

export default SessionTimer;