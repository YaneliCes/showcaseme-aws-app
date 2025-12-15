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
    const [errors, setErrors] = useState({});

    const navigate = useNavigate();

    const isValidEmail = (value) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

    // Check for errors in a single field
    const validateField = (name, value) => {
        const trimmed = value.trim();

        switch (name) {
            case "identifier":
                if (!trimmed) return "Username or email is required.";

                if (trimmed.includes("@")) {
                    // treat like email
                    if (trimmed.length > 100) {
                        return "Too many characters. Max 100 characters.";
                    }
                    if (!isValidEmail(trimmed)) {
                        return "Please enter a valid email address.";
                    }
                } else {
                    // treat like username
                    if (trimmed.length > 30) {
                        return "Too many characters. Max 30 characters.";
                    }
                }
                return "";

            case "password":
                if (!value) return "Password is required.";
                if (value.length < 8) {
                    return "Password must be at least 8 characters.";
                }
                if (value.length > 60) {
                    return "Too many characters. Max 60 characters.";
                }
            return "";

            default:
                return "";
        }
    };

    // Validate all fields and return errors
    const validateAll = () => {
        const current = { identifier, password };
        const newErrors = {};

        Object.keys(current).forEach((field) => {
            const error = validateField(field, current[field]);
            if (error) newErrors[field] = error;
        });

        setErrors(newErrors);
        return newErrors;
    };

    // If a field changes, set its new value and validate it
    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === "identifier") setIdentifier(value);
        else if (name === "password") setPassword(value);

        const fieldError = validateField(name, value);

        setErrors((prev) => ({
            ...prev,
            [name]: fieldError,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerResponse(null);

        const newErrors = validateAll();
            if (Object.keys(newErrors).length > 0) {
            setServerResponse("Please fix the highlighted fields.");
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
                                className={errors.identifier ? "input-error" : ""}
                            />
                            <FaUser className="icon" />
                            {errors.identifier && (
                                <p className="field-error">{errors.identifier}</p>
                            )}
                        </div>

                        <div className="form-control input-box">
                            <input
                                type="password"
                                name="password"
                                placeholder="Password"
                                value={password}
                                onChange={handleChange}
                                className={errors.password ? "input-error" : ""}
                            />
                            <FaLock className="icon" />
                            {errors.password && (
                                <p className="field-error">{errors.password}</p>
                            )}
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