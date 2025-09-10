import React from 'react';
import Navbar from './components/Navbar.jsx';
// import Footer from './components/Footer.jsx';
import { Routes, Route, useLocation } from 'react-router-dom';

import AllRooms from './pages/AllRooms.jsx';
// import Home from './pages/Home.jsx';
import Booking from './pages/Booking.jsx';
import Payment from './pages/Payment.jsx'; // 1. Import the new Payment page

function App() {
  const isOwnerPath = useLocation().pathname.includes('/owner');
  return (
    <div className='bg-gray-50'>
      {!isOwnerPath && <Navbar />}
      <div className='h-fit'>
        <Routes>
          {/* <Route path='/' element={<Home />} /> */}
          <Route path='/' element={<AllRooms />} />
          <Route path='/booking/:id' element={<Booking />} />
          <Route path='/payment' element={<Payment />} />
        </Routes>
      </div>
      {/* {!isOwnerPath && <Footer />} */}
    </div>
  );
}

export default App;
