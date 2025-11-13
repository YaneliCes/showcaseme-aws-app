import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";

export default function Register() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = (e) => {
    e.preventDefault();
    navigate("/");
  };

  return (
    <div className="page-wrapper">
      <div className="login-container">
        <h1>Create Account</h1>

        <form className="login-form" onSubmit={handleRegister}>
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
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="login-btn">
            Register
          </button>
        </form>

        <p className="backend-status">
          Already have an account?{" "}
          <span 
            style={{ color: "#0077ff", cursor: "pointer" }}
            onClick={() => navigate("/")}
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
}
