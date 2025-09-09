import React from 'react';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import { Routes, Route, useLocation } from 'react-router-dom';

import AllRooms from './pages/AllRooms.jsx';
import Home from './pages/Home.jsx';
import Booking from './pages/Booking.jsx';

function App() {
  const isOwnerPath = useLocation().pathname.includes('/owner');
  return (
    <div className='bg-gray-50'>
      {!isOwnerPath && <Navbar />}
      <div className='h-fit'>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/rooms' element={<AllRooms />} />
          <Route path='/booking/:id' element={<Booking />} />
        </Routes>
      </div>
      {!isOwnerPath && <Footer />}
    </div>
  );
}

export default App;
