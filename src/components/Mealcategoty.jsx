import React, { useState } from "react"; // 1. Import useState
import Mealpop from "../components/mealpop"; // 2. Import the pop-up component

function Mealcategoty({ desc, rate, handleAddToCartClick, isBookingDisabled, }) {

  const [isPopupVisible, setIsPopupVisible] = useState(false);

  return (
    <>    <div className="flex justify-between mb-4 ">
      <div className="flex flex-col">
      <h5 className="text-xl font-semibold text-black">{desc}</h5>
        <div className="text-indigo-400 font-medium">
          <button onClick={() => setIsPopupVisible(true)}
           className="hover:underline text-sm"> What's included?</button>
        </div>
      </div>
      <div>
            <p className="text-sm sm:text-base">
            <span className="text-xl text-indigo-500 font-medium">{rate}</span>
            /Night
            </p>
            <button
            onClick={handleAddToCartClick}
            className={`rounded-full px-4 py-2 text-xs sm:text-sm  font-medium border transition-all cursor-pointer  to-indigo-500 ${
                isBookingDisabled
                ? "bg-gray-400 text-white cursor-not-allowed"
                : "bg-indigo-600 text-white hover:shadow-xl shadow-indigo-300"
            }`}
            >
            Add Cart
            </button>
      </div>
    </div>
      {/* 5. Conditionally render the Mealpop component based on state */}
      {isPopupVisible && <Mealpop onClose={() => setIsPopupVisible(false)} />}
  </>
  );
}

export default Mealcategoty;
