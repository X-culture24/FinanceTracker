import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/Budget.css";
import BackArrow from '../components/BackArrow';

const Budget = () => {
  const [budget, setBudget] = useState("");
  const [currentBudget, setCurrentBudget] = useState({
    total_budget: 0,
    remaining_budget: 0,
    spent_percentage: 0,
    recent_transactions: []
  });
  const [notification, setNotification] = useState(null);

  // ✅ Fetch Current Budget with Transactions
  const fetchBudget = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        alert("🚨 Authentication required. Please log in.");
        return;
      }

      const response = await axios.post(
        "http://localhost:8000/api/",
        { action: "finance_analysis" },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      setCurrentBudget({
        total_budget: response.data.total_budget || 0,
        remaining_budget: response.data.remaining_budget || 0,
        spent_percentage: response.data.spent_percentage || 0,
        recent_transactions: response.data.recent_transactions || []
      });

    } catch (error) {
      console.error("🚨 Error fetching budget:", error.response?.data || error);
      alert("Failed to fetch budget. Please try again.");
    }
  };

  // ✅ Set Budget Handler with Transaction Recording
  const handleSetBudget = async (e) => {
    e.preventDefault();
    try {
      const accessToken = localStorage.getItem("accessToken");

      if (!budget || isNaN(budget) || parseFloat(budget) <= 0) {
        alert("⚠️ Please enter a valid budget amount.");
        return;
      }

      const response = await axios.post(
        "http://localhost:8000/api/",
        {
          action: "add_budget",
          total_budget: parseFloat(budget),
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      // Show success notification with transaction details
      setNotification({
        type: "success",
        message: `✅ Budget ${currentBudget.total_budget > 0 ? 'updated' : 'set'} successfully!`,
        transactionId: response.data.transaction_id
      });

      fetchBudget(); // Refresh budget data
      setBudget("");

      // Auto-hide notification after 5 seconds
      setTimeout(() => setNotification(null), 5000);

    } catch (error) {
      console.error("🚨 Error setting budget:", error.response?.data || error);
      setNotification({
        type: "error",
        message: error.response?.data?.error || "Failed to update budget"
      });
    }
  };

  // ✅ Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  // ✅ Fetch budget on component mount
  useEffect(() => {
    fetchBudget();
  }, []);

  return (
    <div className="budget-container">
      <div className="budget-card">
        <BackArrow />

        {/* Notification Banner */}
        {notification && (
          <div className={`notification ${notification.type}`}>
            {notification.message}
            {notification.transactionId && (
              <span className="transaction-id">Transaction ID: {notification.transactionId}</span>
            )}
          </div>
        )}

        <h2>Budget Management</h2>

        {/* Budget Input Form */}
        <form onSubmit={handleSetBudget} className="budget-form">
          <input
            type="number"
            placeholder="Enter budget amount (KES)"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            min="0"
            step="100"
            required
          />
          <button type="submit">
            {currentBudget.total_budget > 0 ? "Update Budget" : "Set Budget"}
          </button>
        </form>

        {/* Budget Summary */}
        <div className="budget-summary">
          <div className="budget-metric">
            <h3>Total Budget</h3>
            <p>{formatCurrency(currentBudget.total_budget)}</p>
          </div>
          
          <div className="budget-metric">
            <h3>Remaining Budget</h3>
            <p className={currentBudget.remaining_budget < (currentBudget.total_budget * 0.2) ? "warning" : ""}>
              {formatCurrency(currentBudget.remaining_budget)}
            </p>
          </div>

          <div className="progress-container">
            <h4>Spent: {currentBudget.spent_percentage.toFixed(2)}%</h4>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${currentBudget.spent_percentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        {currentBudget.recent_transactions.length > 0 && (
          <div className="transactions-section">
            <h3>Recent Transactions</h3>
            <ul className="transactions-list">
              {currentBudget.recent_transactions.map((txn, index) => (
                <li key={index} className={`txn-item ${txn.type}`}>
                  <div className="txn-header">
                    <span className="txn-amount">{formatCurrency(txn.amount)}</span>
                    <span className="txn-type">{txn.type.toUpperCase()}</span>
                  </div>
                  <div className="txn-details">
                    <span className="txn-category">{txn.category}</span>
                    <span className="txn-date">{txn.date}</span>
                  </div>
                  {txn.description && (
                    <p className="txn-description">{txn.description}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Budget;