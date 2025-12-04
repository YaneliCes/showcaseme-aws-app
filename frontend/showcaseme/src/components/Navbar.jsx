import React, { useState, useEffect, useContext } from 'react';
import './Navbar.css';
import { Link, useNavigate } from "react-router-dom";
import { NavLink } from "react-router-dom";
import { MdOutlinePinDrop } from "react-icons/md";
import TopNavigation from "@cloudscape-design/components/top-navigation";
import Button from "@cloudscape-design/components/button";
import { UserContext } from './UserContext';

const Navbar = () => {
    const { user, setUser, notification } = useContext(UserContext);
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            const response = await fetch('http://10.0.0.10:3000/api/logout', {
                method: 'POST',
                credentials: 'include',
            });

            if (response.ok) {
                localStorage.removeItem('user');
                setUser(null);
                navigate('/login');
            } else {
                console.error('Logout failed');
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <div className="navbar">
        <TopNavigation
            identity={{
                href: "/dashboard",
                title: (
                    <span className="navbar-logo">
                        <MdOutlinePinDrop className="navbar-logo-icon" />
                        <span className="navbar-logo-text">ShowcaseMe</span>
                    </span>
                ),
                logo: null
            }}
            utilities={[
                {
                    type: "button",
                    text: (
                        <NavLink to="/dashboard" className="nav-link" activeClassName="active">
                            Dashboard
                        </NavLink>
                    ),
                    href: "/dashboard",
                },
                {
                    type: "button",
                    text: (
                        <NavLink to="/plans" className="nav-link" activeClassName="active">
                            Create/Join Plan
                        </NavLink>
                    ),
                    href: "/plans",
                },
                {
                    type: "button",
                    text: (
                        <NavLink to="/findplaces" className="nav-link" activeClassName="active">
                            Find Places
                        </NavLink>
                    ),
                    href: "/findplaces",
                },
                {
                    type: "button",
                    text: (
                        <NavLink to="/ratings" className="nav-link" activeClassName="active">
                            Ratings
                        </NavLink>
                    ),
                    href: "/ratings",
                },
                {
                    type: "menu-dropdown",
                    text: user ? `Welcome, ${user.username}` : "Guest",
                    iconName: "user-profile",
                    items: [
                        { 
                            id: "signout", 
                            text: <Button onClick={handleLogout}>Sign out</Button>, 
                        }
                    ]
                }
            ]}                         
        />
        </div>
    );
};

export default Navbar