import "./Home.css";

export default function Home() {
  const username = "John Doe";

  return (
    <div className="dashboard-wrapper">

      <div className="sidebar">
        <div>
          <h2 className="sidebar-title">ShowcaseMe</h2>

          <div className="sidebar-item">Dashboard</div>
          <div className="sidebar-item">My Portfolio</div>
          <div className="sidebar-item">Favorites</div>
          <div className="sidebar-item">Browse Users</div>
          <div className="sidebar-item">Settings</div>
        </div>

        <button className="logout-btn">Logout</button>
      </div>

      <div className="dashboard-content">

        <h1 className="dashboard-username">{username}</h1>
        <p className="dashboard-subtitle">
          Welcome back! Here's an overview of your ShowcaseMe activity.
        </p>

        <div className="panel-grid">

          <div className="panel">
            <h2>📝 Recent Posts</h2>
            <p>You haven't posted anything yet.</p>
          </div>

          <div className="panel">
            <h2>📁 My Files</h2>
            <p>Upload files to showcase in your portfolio.</p>
          </div>

          <div className="panel">
            <h2>⭐ Favorite Users</h2>
            <p>You haven't favorited anyone yet.</p>
          </div>

          <div className="panel">
            <h2>🔒 Profile Visibility</h2>
            <p>Your profile is currently <strong>Public</strong>.</p>
          </div>

        </div>
      </div>
    </div>
  );
}
