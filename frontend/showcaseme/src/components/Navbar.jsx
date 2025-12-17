import React, { useState, useEffect, useContext, useRef } from "react";
import "./Navbar.css";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { AiFillProduct } from "react-icons/ai";
import { FaUserCircle } from "react-icons/fa";
import { UserContext } from "./UserContext";
import { applyMode, Mode } from "@cloudscape-design/global-styles";

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const { user, setUser } = useContext(UserContext);
    const navigate = useNavigate();

    const [colorMode, setColorMode] = useState(() => {
        const saved = localStorage.getItem("cs-color-mode");
        return saved === "dark" ? "dark" : "light";
    });

    // dropdown state
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const next = colorMode === "dark" ? Mode.Dark : Mode.Light;
        applyMode(next);
        localStorage.setItem("cs-color-mode", colorMode);
    }, [colorMode]);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 50);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // close dropdown when clicking outside
    useEffect(() => {
        const onDocClick = (e) => {
            if (!menuRef.current) return;
            if (!menuRef.current.contains(e.target)) setMenuOpen(false);
        };
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, []);

    // close dropdown with Escape
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "Escape") setMenuOpen(false);
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
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
            setMenuOpen(false);
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
                <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                    Dashboard
                </NavLink>

                <NavLink to="/feed" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                    Feed
                </NavLink>

                <NavLink to="/network" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                    My Network
                </NavLink>

                <NavLink to="/learn" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                    Learn
                </NavLink>
            </nav>

            {/* Right: Theme + User dropdown */}
            <div className="navbar-right">
                <button
                    type="button"
                    className="theme-btn"
                    onClick={() => setColorMode((m) => (m === "dark" ? "light" : "dark"))}
                    aria-label="Toggle theme"
                >
                    {colorMode === "dark" ? "Light mode" : "Dark mode"}
                </button>

                {/* Dropdown */}
                <div className="user-menu" ref={menuRef}>
                    <button
                        type="button"
                        className="user-chip user-chip-btn"
                        onClick={() => setMenuOpen((v) => !v)}
                        aria-haspopup="menu"
                        aria-expanded={menuOpen}
                    >
                        <FaUserCircle className="user-icon" />
                        <span className="user-name">{username}</span>
                    </button>

                    {menuOpen && (
                        <div className="user-dropdown" role="menu">
                            <button
                                className="user-dropdown-item"
                                role="menuitem"
                                onClick={() => {
                                    setMenuOpen(false);
                                    navigate("/portfolio");
                                }}
                            >
                                View portfolio
                            </button>

                            <button
                                className="user-dropdown-item"
                                role="menuitem"
                                onClick={() => {
                                    setMenuOpen(false);
                                    navigate("/settings");
                                }}
                            >
                                Settings
                            </button>

                            <div className="user-dropdown-divider" />

                            <button
                                className="user-dropdown-item danger"
                                role="menuitem"
                                onClick={handleLogout}
                            >
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Navbar;