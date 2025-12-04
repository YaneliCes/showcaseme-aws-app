import React, { useState, useEffect, useContext } from "react";
import "./Register.css";
import Header from "../components/Header";
import { Link, useNavigate } from "react-router-dom";
import { FaUser, FaEnvelope, FaLock, FaKey } from "react-icons/fa";

import { UserContext } from "../components/UserContext";

const Register = () => {
  const { setUser } = useContext(UserContext);

  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confpassword, setConfPass] = useState("");
  const [serverResponse, setServerResponse] = useState(null);

  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({}); // { firstname: "...", email: "...", ... }

  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/hello")
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch(() => setMessage(""));
  }, []);

  // Simple email regex
  const isValidEmail = (value) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  // Validate a single field
  const validateField = (name, value, allValues) => {
    const trimmed = value.trim();

    switch (name) {
      case "firstname":
        if (!trimmed) return "First name is required.";
        if (trimmed.length > 30) return "Too many characters. Max 30 characters.";
        return "";
      case "lastname":
        if (!trimmed) return "Last name is required.";
        if (trimmed.length > 30) return "Too many characters. Max 30 characters.";
        return "";
      case "email":
        if (!trimmed) return "Email is required.";
        if (trimmed.length > 100) return "Too many characters. Max 100 characters.";
        if (!isValidEmail(trimmed)) return "Please enter a valid email address.";
        return "";
      case "username":
        if (!trimmed) return "Username is required.";
        if (trimmed.length > 30) return "Too many characters. Max 30 characters.";
        return "";
      case "password":
        if (!value) return "Password is required.";
        if (value.length < 8) return "Password must be at least 8 characters.";
        if (value.length > 60) return "Too many characters. Max 60 characters.";
        // also recheck confirm password if it's filled
        if (allValues.confpassword && allValues.confpassword !== value) {
          return ""; // password itself is fine; confpassword will show its own error
        }
        return "";
      case "confpassword":
        if (!value) return "Please confirm your password.";
        if (value !== allValues.password) return "Passwords do not match.";
        return "";
      default:
        return "";
    }
  };

  // Validate all fields before submit
  const validateAll = () => {
    const allValues = {
      firstname,
      lastname,
      email,
      username,
      password,
      confpassword,
    };

    const newErrors = {};
    const fields = Object.keys(allValues);

    fields.forEach((field) => {
      const error = validateField(field, allValues[field], allValues);
      if (error) {
        newErrors[field] = error;
      }
    });

    setErrors(newErrors);
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // update state for that field
    if (name === "firstname") setFirstname(value);
    else if (name === "lastname") setLastname(value);
    else if (name === "email") setEmail(value);
    else if (name === "username") setUsername(value);
    else if (name === "password") setPassword(value);
    else if (name === "confpassword") setConfPass(value);

    // compute current values including the new one
    const allValues = {
      firstname,
      lastname,
      email,
      username,
      password,
      confpassword,
      [name]: value,
    };

    // validate this one field instantly
    const fieldError = validateField(name, value, allValues);

    setErrors((prev) => ({
      ...prev,
      [name]: fieldError,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerResponse(null);

    // frontend validation
    const newErrors = validateAll();
    if (Object.keys(newErrors).length > 0) {
      setServerResponse("Please fix the highlighted fields.");
      return;
    }

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          firstname,
          lastname,
          email,
          username,
          password,
        }),
      });

      const json = await response.json();
      console.log("Register response:", json);

      if (!response.ok || json.status !== "success") {
        setServerResponse(json.message || "Registration failed. Please try again.");
        return;
      }

      if (setUser) {
        setUser({ username });
      }

      navigate("/dashboard");
    } catch (error) {
      console.error("Error during registration:", error);
      setServerResponse("Failed to register. Please try again.");
    }
  };

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
      <div className="reg-pg">
        <div className="wrapper">
          <form className="reg-form" onSubmit={handleSubmit}>
            <h1>Register</h1>

            <div className="form-control input-box">
              <input
                className={`input-fn ${errors.firstname ? "input-error" : ""}`}
                type="text"
                name="firstname"
                placeholder="First Name"
                value={firstname}
                onChange={handleChange}
              />
              <FaUser className="icon" />
              {errors.firstname && (
                <p className="field-error">{errors.firstname}</p>
              )}
            </div>

            <div className="form-control input-box">
              <input
                className={`input-ln ${errors.lastname ? "input-error" : ""}`}
                type="text"
                name="lastname"
                placeholder="Last Name"
                value={lastname}
                onChange={handleChange}
              />
              <FaUser className="icon" />
              {errors.lastname && (
                <p className="field-error">{errors.lastname}</p>
              )}
            </div>

            <div className="form-control input-box">
              <input
                className={errors.email ? "input-error" : ""}
                type="email"
                name="email"
                placeholder="Email"
                value={email}
                onChange={handleChange}
              />
              <FaEnvelope className="icon" />
              {errors.email && (
                <p className="field-error">{errors.email}</p>
              )}
            </div>

            <div className="form-control input-box">
              <input
                className={errors.username ? "input-error" : ""}
                type="text"
                name="username"
                placeholder="Username"
                value={username}
                onChange={handleChange}
              />
              <FaUser className="icon" />
              {errors.username && (
                <p className="field-error">{errors.username}</p>
              )}
            </div>

            <div className="form-control input-box">
              <input
                className={errors.password ? "input-error" : ""}
                type="password"
                name="password"
                placeholder="Password"
                value={password}
                onChange={handleChange}
              />
              <FaLock className="icon" />
              {errors.password && (
                <p className="field-error">{errors.password}</p>
              )}
            </div>

            <div className="form-control input-box">
              <input
                className={errors.confpassword ? "input-error" : ""}
                type="password"
                name="confpassword"
                placeholder="Confirm Password"
                value={confpassword}
                onChange={handleChange}
              />
              <FaKey className="icon" />
              {errors.confpassword && (
                <p className="field-error">{errors.confpassword}</p>
              )}
            </div>

            <input type="submit" value="Register" className="register-btn" />

            <div className="login-link">
              <p>
                Already have an account? <Link to="/login">Login</Link>
              </p>
            </div>

            {serverResponse && (
              <div className="server-response">
                <p>{serverResponse}</p>
              </div>
            )}
          </form>

          <p className="backend-status">{message}</p>
        </div>
      </div>
    </>
  );
};

export default Register;