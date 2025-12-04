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

    const navigate = useNavigate();

    useEffect(() => {
        fetch("/api/hello")
        .then(res => res.json())
        .then(data => setMessage(data.message))
        .catch(() => setMessage(""));
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "firstname") setFirstname(value);
        else if (name === "lastname") setLastname(value);
        else if (name === "email") setEmail(value);
        else if (name === "username") setUsername(value);
        else if (name === "password") setPassword(value);
        else if (name === "confpassword") setConfPass(value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerResponse(null);

        if (password !== confpassword) {
        setServerResponse("Passwords do not match.");
        return;
        }

        try {
        // Call relative /api/register
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

        // Go to dashboard after successful registration
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
                    className="input-fn"
                    type="text"
                    name="firstname"
                    placeholder="First Name"
                    value={firstname}
                    onChange={handleChange}
                />
                <FaUser className="icon" />
                </div>

                <div className="form-control input-box">
                <input
                    className="input-ln"
                    type="text"
                    name="lastname"
                    placeholder="Last Name"
                    value={lastname}
                    onChange={handleChange}
                />
                <FaUser className="icon" />
                </div>

                <div className="form-control input-box">
                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={email}
                    onChange={handleChange}
                />
                <FaEnvelope className="icon" />
                </div>

                <div className="form-control input-box">
                <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    value={username}
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

                <div className="form-control input-box">
                <input
                    type="password"
                    name="confpassword"
                    placeholder="Confirm Password"
                    value={confpassword}
                    onChange={handleChange}
                />
                <FaKey className="icon" />
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