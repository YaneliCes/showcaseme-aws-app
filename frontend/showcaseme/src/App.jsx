import { useState } from 'react';
import './App.css';
import { Link, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './components/UserContext';
import Navbar from './components/Navbar';
import Header from './components/Header';
import Register from './pages/Register';
import Login from './pages/Login';
import Home from './pages/Home';
// import Dashboard from './pages/Dashboard';
// import Plans from './pages/Plans';
// import FindPlaces from './pages/FindPlaces';
// import Ratings from './pages/Ratings';


function App() {
  
  return (
  <UserProvider>
    <div> 
        <Routes>
          <Route path="/" element={<Home />} />
          {/* <Route path='home' element={<Home />} /> */}
          <Route path='login' element={<Login />} />
          <Route path='register' element={<Register />} />
          {/* <Route path='dashboard' element={<Dashboard />} />
          <Route path='plans' element={<Plans />} />
          <Route path='findplaces' element={<FindPlaces />} />
          <Route path='ratings' element={<Ratings />} />
          <Route path='navbar' element={<Navbar />} />
          <Route path='header' element={<Header />} /> */}
        </Routes>
    </div>
  </UserProvider>
  );

}

export default App