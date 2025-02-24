import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../api"; // Import API function
import "./Auth.css"; // Ensure this file exists and is correctly styled

const Register = () => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError(""); // Clear previous errors

        try {
            await registerUser(username, email, password); // Use API function
            alert("Registration successful! Please log in.");
            navigate("/login"); // Redirect to login after successful registration
        } catch (error) {
            setError(error.message || "Registration failed. Please try again.");
        }
    };

    return (
        <div className="auth-container">
            <h2>Register</h2>
            {error && <p style={{ color: "red" }}>{error}</p>}
            <form onSubmit={handleSubmit} className="form-container">
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit">Register</button>
            </form>

            {/* Login Link */}
            <p className="login-link">
                Already have an account? <Link to="/login">Log in</Link>
            </p>
        </div>
    );
};

export default Register;
