import React from "react";
import "./Explore.css";
import { Link } from "react-router-dom";
import { FaStar, FaUserFriends, FaFolderOpen } from "react-icons/fa";
import { AiOutlinePlusCircle } from "react-icons/ai";

const Explore = () => {
  return (
    <div className="explore-page">

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Showcase Your Skills. Build Your Presence.</h1>
          <p>
            Create a professional portfolio, display your work, and connect with others.
            ShowcaseMe gives you a space to shine — simple, personal, and powerful.
          </p>

          <div className="hero-buttons">
            <Link to="/register" className="btn-primary">Get Started</Link>
            <Link to="/login" className="btn-outline">Login</Link>
          </div>
        </div>

      </section>

      {/* Features Section */}
      <section className="features">
        <h2>Why ShowcaseMe?</h2>

        <div className="feature-grid">

          <div className="feature-card">
            <FaFolderOpen className="feature-icon" />
            <h3>Create Portfolios</h3>
            <p>
              Build personalized pages featuring your projects, skills, and experiences.
            </p>
          </div>

          <div className="feature-card">
            <FaStar className="feature-icon" />
            <h3>Share & Get Noticed</h3>
            <p>
              Publish publicly or privately — inspire others or keep it professional.
            </p>
          </div>

          <div className="feature-card">
            <FaUserFriends className="feature-icon" />
            <h3>Browse & Discover</h3>
            <p>
              Explore portfolios from students, professionals, and creators.
            </p>
          </div>

          <div className="feature-card">
            <AiOutlinePlusCircle className="feature-icon" />
            <h3>Save Favorites</h3>
            <p>
              Like profiles you enjoy and build your own personalized list.
            </p>
          </div>

        </div>
      </section>

      {/* Call to Action */}
      <section className="cta">
        <h2>Ready to Build Your Portfolio?</h2>
        <p>Join in and start crafting your personal space today.</p>
        <Link to="/register" className="btn-primary btn-lg">Create an Account</Link>
      </section>

    </div>
  );
};

export default Explore;