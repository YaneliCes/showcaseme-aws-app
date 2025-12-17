import { useEffect, useState } from 'react';
import { applyMode, Mode } from "@cloudscape-design/global-styles";
import './App.css';
import { Link, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './components/UserContext';
import ScrollToTop from "./components/ScrollToTop";
import Navbar from './components/Navbar';
import Header from './components/Header';
import Footer from "./components/Footer";
import Explore from './pages/Explore';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PortfolioManager from './pages/PortfolioManager';
import Portfolio from "./pages/Portfolio";
import Feed from "./pages/Feed";
import Network from "./pages/Network";
import Learn from "./pages/Learn";
import Settings from "./pages/Settings";
import Mfa from "./pages/Mfa";

import { usePageTracking } from "./hooks/usePageTracking";

function App() {
  // log a page_view on every route change
  usePageTracking();
  
    const [colorMode, setColorMode] = useState(() => {
        const saved = localStorage.getItem("cs-color-mode");
        return saved === "dark" ? "dark" : "light";
    });

    useEffect(() => {
        applyMode(colorMode === "dark" ? Mode.Dark : Mode.Light);
        localStorage.setItem("cs-color-mode", colorMode);
    }, [colorMode]);

  return (
  <UserProvider>
    <div> 
        <ScrollToTop />
        <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path='explore' element={<Explore />} />
            <Route path='register' element={<Register />} />
            <Route path='login' element={<Login />} />
            <Route path='dashboard' element={<Dashboard />} />
            <Route path="profile/manage" element={<PortfolioManager />} />
            <Route path='navbar' element={<Navbar />} />
            <Route path='header' element={<Header />} />
            <Route path="portfolio" element={<Portfolio />} />
            <Route path="portfolio/:username" element={<Portfolio />} />
            <Route path="feed" element={<Feed />} />
            <Route path="network" element={<Network />} />
            <Route path="learn" element={<Learn />} />
            <Route path="settings" element={<Settings />} />
            <Route path="mfa" element={<Mfa />} />
        </Routes>
        <Footer />
    </div>
  </UserProvider>
  );

}

export default App