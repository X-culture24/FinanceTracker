import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate(); // Hook for navigation

  const handleLogout = () => {
    localStorage.removeItem("authToken"); // Clear authentication token
    navigate("/login"); // Redirect to login page
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar Navigation */}
      <div className="dashboard-sidebar">
        <h2 className="sidebar-title">Finance Dashboard</h2>
        <nav className="nav-links">
          <Link to="/bills" className="nav-item">📊 Manage Bills</Link>
          <Link to="/budget" className="nav-item">💰 Set Budget</Link>
          <Link to="/transactions" className="nav-item">🔍 View Transactions</Link>
          <Link to="/finance-analysis" className="nav-item">📈 Finance Analysis</Link>
          <Link to="/notifications" className="nav-item">🔔 Notifications</Link>
        </nav>

        {/* Logout Button */}
        <button className="logout-button" onClick={handleLogout}>🚪 Logout</button>
      </div>

      {/* Main Dashboard Content */}
      <div className="dashboard-content">
        <h1>Welcome to Your Finance Dashboard</h1>
        <p>Track and manage your finances effortlessly.</p>

        <div className="dashboard-links">
          <Link to="/bills" className="dashboard-card">📊 Manage Bills</Link>
          <Link to="/budget" className="dashboard-card">💰 Set Budget</Link>
          <Link to="/transactions" className="dashboard-card">🔍 View Transactions</Link>
          <Link to="/finance-analysis" className="dashboard-card">📈 Finance Analysis</Link>
          <Link to="/notifications" className="dashboard-card">🔔 Notifications</Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
