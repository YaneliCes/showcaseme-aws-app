import React, { useState, useEffect, useContext } from "react";
import "./Login.css";
import Header from "../components/Header";
import { Link, useNavigate } from "react-router-dom";
import { FaUser, FaLock } from "react-icons/fa";

import { UserContext } from "../components/UserContext";

const Login = () => {
  const { setUser } = useContext(UserContext);

  const [identifier, setIdentifier] = useState(""); // username or email
  const [password, setPassword] = useState("");
  const [serverResponse, setServerResponse] = useState(null);

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "identifier") setIdentifier(value);
    else if (name === "password") setPassword(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerResponse(null);

    if (!identifier || !password) {
      setServerResponse("Please enter your username/email and password.");
      return;
    }

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          identifier,
          password,
        }),
      });

      const json = await response.json();
      console.log("Login response:", json);

      if (!response.ok || json.status !== "success") {
        setServerResponse(json.message || "Login failed. Please try again.");
        return;
      }

      if (setUser) {
        setUser({ username: json.user?.username || identifier });
      }

      navigate("/dashboard");
    } catch (error) {
      console.error("Error during login:", error);
      setServerResponse("Failed to login. Please try again.");
    }
  };

  // If already logged in, redirect to dashboard
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
            setUser({ username: json.username });
          }
          navigate("/dashboard");
        }
      } catch (error) {
        console.error("Error checking session:", error);
      }
    };

    checkSession();
  }, [navigate, setUser]);

  return (
    <>
      <Header />
      <div className="login-pg">
        <div className="login-wrapper">
          <form className="login-form" onSubmit={handleSubmit}>
            <h1>Login</h1>

            <div className="form-control input-box">
              <input
                type="text"
                name="identifier"
                placeholder="Username or Email"
                value={identifier}
                onChange={handleChange}
              />
              <FaUser className="icon" />
            </div>

            <div className="form-control input-box">
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={password}
                onChange={handleChange}
              />
              <FaLock className="icon" />
            </div>

            <input type="submit" value="Login" className="login-btn" />

            <div className="register-link">
              <p>
                Don&apos;t have an account? <Link to="/register">Register</Link>
              </p>
            </div>

            {serverResponse && (
              <div className="server-response">
                <p>{serverResponse}</p>
              </div>
            )}
          </form>
        </div>
      </div>
    </>
  );
};

export default Login;