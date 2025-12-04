import { useState } from 'react';
import './App.css';
import { Link, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './components/UserContext';
import Navbar from './components/Navbar';
import Header from './components/Header';
import Footer from "./components/Footer";
import Explore from './pages/Explore';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
// import Plans from './pages/Plans';
// import FindPlaces from './pages/FindPlaces';
// import Ratings from './pages/Ratings';

import { usePageTracking } from "./hooks/usePageTracking";

function App() {
  // log a page_view on every route change
  usePageTracking();
  
  return (
  <UserProvider>
    <div> 
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path='explore' element={<Explore />} />
          <Route path='register' element={<Register />} />
          <Route path='login' element={<Login />} />
          <Route path='dashboard' element={<Dashboard />} />
          {/* <Route path='plans' element={<Plans />} />
          <Route path='findplaces' element={<FindPlaces />} />
          <Route path='ratings' element={<Ratings />} /> */}
          <Route path='navbar' element={<Navbar />} />
          <Route path='header' element={<Header />} />
        </Routes>
        <Footer />
    </div>
  </UserProvider>
  );

}

export default App