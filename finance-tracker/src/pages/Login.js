import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Login.css";

const Login = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:8000/api/", {
        action: "login",
        username: formData.username,
        password: formData.password,
      });

      console.log("✅ Login Response:", response.data);

      const accessToken = response.data?.access || response.data?.token;
      const budget = response.data?.budget;

      if (accessToken) {
        // Store both token and user data consistently
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("userData", JSON.stringify({
          username: formData.username,
          budget: budget || 0
        }));

        // Set default authorization header for axios
        axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

        setMessage("✅ Login successful!");
        navigate("/dashboard");
      } else {
        setMessage("🚨 Authentication failed. Please try again.");
      }
    } catch (error) {
      console.error("🚨 Login Error:", error.response || error);
      setMessage(
        error.response?.data?.error ||
          "🚨 Login failed. Please check your credentials."
      );
    }
  };

  return (
    <div className="login-container">
      <div className="login-form-card">
        <h2>Login</h2>
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Username"
            value={formData.username}
            onChange={(e) =>
              setFormData({ ...formData, username: e.target.value })
            }
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            required
          />
          <button type="submit">Login</button>
        </form>

        {message && <p className="login-message">{message}</p>}
      </div>

      <div className="register-card">
        <p className="register-link">
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;