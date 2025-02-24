import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api"; // Import API function
import "./Auth.css"; // Ensure this file exists

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (event) => {
        event.preventDefault();
        setError("");

        try {
            const data = await loginUser(email, password); // Use API function

            console.log("Login Response:", data); // ✅ Debugging line (Check what is received)

            if (data.access && data.refresh) {  // ✅ Match Django response format
                localStorage.setItem("access_token", data.access);  // Store JWT access token
                localStorage.setItem("refresh_token", data.refresh); // Store refresh token
                localStorage.setItem("user", JSON.stringify(data.user)); // Store user info
                navigate("/dashboard"); // Redirect to dashboard
            } else {
                setError("Invalid login response format.");
            }
        } catch (error) {
            console.error("Login Error:", error.response?.data || error.message);
            setError(error.response?.data?.error || "Login failed. Check your credentials.");
        }
    };

    return (
        <div className="auth-container">
            <h2>Login</h2>
            {error && <p style={{ color: "red" }}>{error}</p>}
            <form onSubmit={handleLogin} className="form-container">
                <input
                    type="text"  
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
                <button type="submit">Login</button>
            </form>
        </div>
    );
};

export default Login;
