import React, { useState, useEffect } from 'react';
import './Header.css';
import { Link } from "react-router-dom";
import { NavLink } from "react-router-dom";
import { AiFillProduct } from "react-icons/ai";

const Header = () => {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 50) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);
    
    return (
        <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
            
            <a href="/" className="logo"><AiFillProduct className="logo-icon"/>ShowcaseMe</a>
            <nav className='nav-menu'>
                {/*<ul className="nav-head">*/}
                <NavLink to="/explore" className="nav-link" activeClassName="active">Explore</NavLink>
                <NavLink to="/login" className="nav-link" activeClassName="active">Login</NavLink>
                <NavLink to="/register" className="nav-link" activeClassName="active">Register</NavLink>
                {/*</ul>*/}
            </nav>

        </header>
    );
};

export default Header