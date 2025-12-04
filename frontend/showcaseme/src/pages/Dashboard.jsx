import React, { useContext, useEffect, useState } from "react";
import "./Dashboard.css";
import Header from "../components/Header";
import Navbar from "../components/Navbar";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../components/UserContext";
import {
  FaUserEdit,
  FaFolderOpen,
  FaHeart,
  FaGlobeAmericas,
  FaLock,
} from "react-icons/fa";

const Dashboard = () => {
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [visibility, setVisibility] = useState("public"); // placeholder
  const [stats, setStats] = useState({
    projects: 0,
    favorites: 0,
    views: 0,
  });

  // Check session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/session", {
          method: "GET",
          credentials: "include",
        });

        const json = await res.json();

        if (res.ok && json.status === "success" && json.username) {
          if (setUser) {
            setUser({ username: json.username, email: json.email });
          }
          // In the future you can fetch stats here from a /api/dashboard endpoint
          setLoading(false);
        } else {
          navigate("/login");
        }
      } catch (err) {
        console.error("Error checking session on dashboard:", err);
        navigate("/login");
      }
    };

    checkSession();
  }, [navigate, setUser]);

  const handleToggleVisibility = () => {
    // For now just toggle locally; later you can call /api/profile/privacy
    setVisibility((prev) => (prev === "public" ? "private" : "public"));
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="dashboard-pg">
          <div className="dashboard-loading">
            <p>Loading your dashboard...</p>
          </div>
        </div>
      </>
    );
  }

  const displayName = user?.username || "!";

  return (
    <>
      <Header />
      <Navbar />
      <div className="dashboard-pg">
        <div className="dashboard-container">
          {/* Top welcome section */}
          <section className="dashboard-hero">
            <div className="dashboard-hero-text">
              <h1>Welcome back {displayName} 👋</h1>
              <p>
                This is your space to showcase who you are, what you’ve built,
                and discover other creators without the noise of big platforms.
              </p>
            </div>
            <div className="dashboard-hero-card">
              <p className="hero-label">Profile visibility</p>
              <p className={`hero-visibility hero-visibility-${visibility}`}>
                {visibility === "public" ? (
                  <>
                    <FaGlobeAmericas /> Public – visible in the directory
                  </>
                ) : (
                  <>
                    <FaLock /> Private – only you can view it
                  </>
                )}
              </p>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleToggleVisibility}
              >
                Toggle to {visibility === "public" ? "Private" : "Public"}
              </button>
            </div>
          </section>

          {/* Stats section */}
          <section className="dashboard-stats">
            <div className="stat-card">
              <p className="stat-label">Projects</p>
              <p className="stat-value">{stats.projects}</p>
              <p className="stat-sub">Add your work, internships, and highlights.</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Profile views</p>
              <p className="stat-value">{stats.views}</p>
              <p className="stat-sub">Track how often people check you out.</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Favorites</p>
              <p className="stat-value">{stats.favorites}</p>
              <p className="stat-sub">People who saved your profile.</p>
            </div>
          </section>

          {/* Main grid */}
          <section className="dashboard-grid">
            {/* Left: Your portfolio */}
            <div className="dashboard-column">
              <div className="dash-card">
                <div className="dash-card-header">
                  <h2>
                    <FaFolderOpen /> Your Portfolio
                  </h2>
                  <span className="dash-card-tag">
                    You control what the world sees.
                  </span>
                </div>
                <p className="dash-card-body">
                  Build a clean, focused portfolio that highlights your skills,
                  projects, and experience. Perfect for recruiters, classmates,
                  or collaborators.
                </p>
                <div className="dash-card-actions">
                  <Link to="/profile/edit" className="btn-primary">
                    <FaUserEdit /> Edit Profile
                  </Link>
                  <Link to="/portfolio" className="btn-outline">
                    Preview My Portfolio
                  </Link>
                </div>
              </div>

              <div className="dash-card">
                <div className="dash-card-header">
                  <h2>
                    <FaHeart /> Favorites
                  </h2>
                </div>
                <p className="dash-card-body">
                  Save creators you like so you can easily find them again —
                  classmates, mentors, teammates, or people whose work inspires
                  you.
                </p>
                <div className="dash-card-actions">
                  <Link to="/favorites" className="btn-outline">
                    View My Favorites
                  </Link>
                </div>
              </div>
            </div>

            {/* Right: Discover & settings */}
            <div className="dashboard-column">
              <div className="dash-card">
                <div className="dash-card-header">
                  <h2>
                    <FaGlobeAmericas /> Discover Creators
                  </h2>
                </div>
                <p className="dash-card-body">
                  Browse public portfolios by skills, interests, or industries.
                  Find people you want to collaborate with or learn from.
                </p>
                <div className="dash-card-actions">
                  <Link to="/directory" className="btn-primary">
                    Browse Public Profiles
                  </Link>
                </div>
              </div>

              <div className="dash-card">
                <div className="dash-card-header">
                  <h2>
                    <FaLock /> Privacy & Visibility
                  </h2>
                </div>
                <p className="dash-card-body">
                  Choose whether your portfolio is public in the directory or
                  private and share-only. You&apos;re in control of who sees
                  your work.
                </p>
                <ul className="dash-list">
                  <li>✅ Switch between public/private anytime</li>
                  <li>✅ Keep drafts private while you’re still editing</li>
                  <li>✅ Share a direct link only with people you trust</li>
                </ul>
                <div className="dash-card-actions">
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={handleToggleVisibility}
                  >
                    Set as {visibility === "public" ? "Private" : "Public"}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default Dashboard;