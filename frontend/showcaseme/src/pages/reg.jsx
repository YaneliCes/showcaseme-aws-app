import React, { useState, useEffect, useContext } from 'react';
import './Register.css';
import Header from '../Components/Header';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { FaUser, FaEnvelope, FaLock, FaKey } from "react-icons/fa";

import { UserContext } from '../Components/UserContext';

const Register = () => {
    const { setUser } = useContext(UserContext);

    const [firstname, setFirstname] = useState("");
    const [lastname, setLastname] = useState("");
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confpassword, setConfPass] = useState("");

    const navigate = useNavigate();
    const { register, watch, formState:{errors}, reset } = useForm();
    const [serverResponse, setServerResponse] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "firstname") setFirstname(value);
        else if (name === "lastname") setLastname(value);
        else if (name === "email") setEmail(value);
        else if (name === "username") setUsername(value);
        else if (name === "password") setPassword(value);
        else if (name === "confpassword") setConfPass(value);
    }
    
    const handleSubmit = async (e) => {
        e.preventDefault();

        console.log("Register Data:", 
            {
                sending_to: "backend1",
                task: "insert",
                data: {
                    firstname,
                    lastname,
                    email,
                    username,
                    password,
                },
            }
        );

        try {
            const response = await fetch("http://10.0.0.10:3000/api/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    sending_to: "backend1",
                    task: "insert",
                    data: {
                        firstname: firstname,
                        lastname: lastname,
                        email: email,
                        username: username,
                        password: password,
                    },
                }),
            })

            if (!response.ok) {
                throw new Error(`http error, status: ${response.status}`);
            }
            const json = await response.json();
            console.log("Response:", json);
            console.log("Status", json.status);
            console.log("Message", json.message);
            
            if (json.status === "success") {
                if (setUser) {
                    setUser({ username });
                } else {
                    console.warn("setUser is undefined, context not working?");
                }
                navigate("/dashboard");
            } else {
                setServerResponse(json.message || "Login failed. Please try again.");
            }
    
        } catch (error) {
            console.error("Error during form submission:", error);
            setServerResponse("Failed to login. Please try again.");
        }
    };

    useEffect(() => {
        const checkSession = async () => {
            try {
                const res = await fetch("http://10.0.0.10:3000/api/session", {
                    method: "GET",
                    credentials: "include",
                });

                const json = await res.json();

                if (res.ok && json.status === "success") {
                    console.log("Session check successful:", json);
                    if (setUser) {
                        setUser({ username: json.username });
                        navigate("/dashboard");
                    } else {
                        console.warn("setUser is undefined, context not working?");
                    }
                }
            } catch (error) {
                console.error("Error checking session:", error);
            }
                
        };

    checkSession();
    },  [navigate, setUser]);

    return (
        <>
            <Header />
            <div className="reg-pg">
                <div className='wrapper'>
                    <form className="reg-form" 
                        action="/api/register"
                        method="post"
                        onSubmit={(event) => handleSubmit(event)}>

                        <h1>Register</h1>

                        <div className="form-control input-box">
                            <input
                                className="input-fn"
                                type="text"
                                name="firstname"
                                placeholder="First Name"
                                value={firstname} onChange={(event) => handleChange(event)}
                            />
                            <FaUser className="icon" />
                        </div>

                        <div className="form-control input-box">
                            <input
                                className="input-ln"
                                type="text"
                                name="lastname"
                                placeholder="Last Name"
                                value={lastname} onChange={(event) => handleChange(event)}
                            />
                            <FaUser className="icon" />
                        </div>

                        <div className="form-control input-box">
                            <input
                                type="email"
                                name="email"
                                placeholder="Email"
                                value={email} onChange={(event) => handleChange(event)}
                            />
                            <FaEnvelope className="icon" />
                        </div>

                        <div className="form-control input-box">
                            <input
                                type="text"
                                name="username"
                                placeholder="Username"
                                value={username} onChange={(event) => handleChange(event)}
                            />
                            <FaUser className="icon" />
                        </div>

                        <div className="form-control input-box">
                            <input
                                type="password"
                                name="password"
                                placeholder="Password"
                                value={password} onChange={(event) => handleChange(event)}
                            />
                            <FaLock className="icon" />
                        </div>

                        <div className="form-control input-box">
                            <input
                                type="password"
                                name="confpassword"
                                placeholder="Confirm Password"
                                value={confpassword} onChange={(event) => handleChange(event)}
                            />
                            <FaKey className="icon" />
                        </div>

                        <input type="submit" value="Register" className="register-btn" />

                        <div className="login-link">
                            <p>Already have an account? <Link to='/login'>Login</Link></p>
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

export default Register;