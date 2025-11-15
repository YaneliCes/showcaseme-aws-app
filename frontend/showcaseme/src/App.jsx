import { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Home from "./Home";
import Register from "./Register";
import "./App.css";

function App() {
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/hello")
      .then(res => res.json())
      .then(data => setMessage(data.message))
      .catch(() => setMessage(""));
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    navigate("/home");
  };

  return (
    <Routes>

      {/* LOGIN PAGE */}
      <Route
        path="/"
        element={
          <div className="page-wrapper">
            <div className="login-container">
              <h1>Login</h1>

              <form className="login-form" onSubmit={handleLogin}>
                <div className="input-group">
                  <input 
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <input 
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <button type="submit" className="login-btn">Login</button>
              </form>

              <p className="backend-status">{message}</p>

              {/* REGISTER BUTTON */}
              <button 
                className="login-btn" 
                style={{ marginTop: "10px", background: "#28a745" }}
                onClick={() => navigate("/register")}
              >
                Create Account
              </button>

            </div>
          </div>
        }
      />

      <Route path="/home" element={<Home />} />

      <Route path="/register" element={<Register />} />
    </Routes>
  );
}

export default App;
