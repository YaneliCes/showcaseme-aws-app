import React, { useState, useEffect, useContext } from "react";
import "./Navbar.css";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { AiFillProduct } from "react-icons/ai";
import { FaUserCircle } from "react-icons/fa";
import { UserContext } from "./UserContext";

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const { user, setUser } = useContext(UserContext);
    const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
        if (window.scrollY > 50) {
            setIsScrolled(true);
        } else {
            setIsScrolled(false);
        }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
        await fetch("/api/logout", {
            method: "POST",
            credentials: "include",
        });
    } catch (err) {
        console.error("Logout error:", err);
    } finally {
        localStorage.removeItem("user");
        if (setUser) setUser(null);
        navigate("/login");
    }
  };

  const username = user?.username || "Account";

  return (
    <header className={`navbar ${isScrolled ? "scrolled" : ""}`}>
      {/* Left: Logo */}
      <NavLink to="/dashboard" className="logo-nav">
            <AiFillProduct className="logo-icon" />
            ShowcaseMe
      </NavLink>

      {/* Center: Main nav */}
      <nav className="navbar-menu">
        <NavLink
            to="/dashboard"
            className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
            }
        >
            Dashboard
        </NavLink>

        <NavLink
            to="/feed"
            className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
            }
        >
            Feed
        </NavLink>

        <NavLink
            to="/browse-network"
            className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
            }
        >
            My Network
        </NavLink>

        <NavLink
            to="/learn"
            className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
            }
        >
            Learn
        </NavLink>
      </nav>

      {/* Right: User + Logout */}
      <div className="navbar-right">
        <div className="user-chip">
            <FaUserCircle className="user-icon" />
            <span className="user-name"> <Link to="/portfolio"> {username} </Link> </span>
        </div>

        <button className="logout-btn" type="button" onClick={handleLogout}>
            Logout
        </button>
      </div>
    </header>
  );
};

export default Navbar;