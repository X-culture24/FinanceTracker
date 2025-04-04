import React, { useState, useContext } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext"; // ✅ Import AuthContext
import "../styles/Login.css";

const Login = () => {
  const { setUser } = useContext(AuthContext); // ✅ Get setUser from AuthContext
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const response = await axios.post("http://localhost:8000/api/", {
        action: "login",
        username: formData.username,
        password: formData.password,
      });

      console.log("Login response:", response);

      if (!response.data) {
        throw new Error("No response data received");
      }

      const accessToken = response.data.access;
      const refreshToken = response.data.refresh;

      if (!accessToken) {
        throw new Error("No access token received");
      }

      // Store tokens in localStorage
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);

      // Set default authorization header for axios
      axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

      // Store user data and update context
      if (response.data.user) {
        localStorage.setItem("userData", JSON.stringify(response.data.user));
        setUser(response.data.user); // ✅ Update user in context
      }

      // Redirect to dashboard after successful login
      setMessage("✅ Login successful!");
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 500); // Small delay to ensure message is visible
    } catch (error) {
      console.error("Login error:", error);

      let errorMessage = "Login failed. Please try again.";
      if (error.response) {
        // Server responded with error status
        errorMessage = error.response.data?.error || errorMessage;
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = "Network error. Please check your connection.";
      }

      setMessage(`🚨 ${errorMessage}`);

      // Clear any existing tokens on error
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userData");
      delete axios.defaults.headers.common["Authorization"];
    } finally {
      setIsLoading(false);
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
            disabled={isLoading}
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            required
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        {message && (
          <p
            className={`login-message ${
              message.includes("✅") ? "success" : "error"
            }`}
          >
            {message}
          </p>
        )}
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
