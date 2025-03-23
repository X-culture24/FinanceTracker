import React from "react";
import { Link } from "react-router-dom";
import "../styles/Home.css";

const Home = () => {
  return (
    <div className="home-container">
      <h1 className="main-heading">Finance Tracker</h1>
      <p>Take control of your finances and reach your goals.</p>

      {/* Finance Feature Cards */}
      <div className="finance-cards">
        <div className="finance-card">
          <img
            src="https://cdn-icons-png.flaticon.com/512/189/189715.png"
            alt="Budget Management"
          />
          <h2>Smart Budgeting</h2>
          <p>Plan and control your spending with ease.</p>
        </div>

        <div className="finance-card">
          <img
            src="https://cdn-icons-png.flaticon.com/512/3135/3135706.png"
            alt="Expense Tracking"
          />
          <h2>Track Expenses</h2>
          <p>Monitor every dollar and stay in control.</p>
        </div>

        <div className="finance-card">
          <img
            src="https://cdn-icons-png.flaticon.com/512/2659/2659360.png"
            alt="Financial Insights"
          />
          <h2>Financial Insights</h2>
          <p>Analyze your spending and grow your savings.</p>
        </div>

        <div className="finance-card">
          <img
            src="https://cdn-icons-png.flaticon.com/512/4352/4352466.png"
            alt="Goal Setting"
          />
          <h2>Goal Setting</h2>
          <p>Define financial goals and track your progress easily.</p>
        </div>

        <div className="finance-card">
          <img
            src="https://cdn-icons-png.flaticon.com/512/4761/4761123.png"
            alt="Secure Transactions"
          />
          <h2>Secure Transactions</h2>
          <p>Keep your financial data safe and private.</p>
        </div>
      </div>

      {/* Get Started Button */}
      <Link to="/register" className="get-started-btn">
        Get Started
      </Link>
    </div>
  );
};

export default Home;
