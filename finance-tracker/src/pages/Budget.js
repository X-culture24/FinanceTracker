import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/Budget.css";

const Budget = () => {
  const [budget, setBudget] = useState("");
  const [currentBudget, setCurrentBudget] = useState({
    total_budget: 0,
    remaining_budget: 0,
  });

  // ✅ Fetch Current Budget
  const fetchBudget = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken"); // Updated to accessToken
      if (!accessToken) {
        alert("🚨 Authentication required. Please log in.");
        return;
      }

      const response = await axios.post(
        "http://localhost:8000/api/",
        { action: "finance_analysis" },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      setCurrentBudget(response.data);
    } catch (error) {
      console.error("🚨 Error fetching budget:", error.response?.data || error);
      alert("Failed to fetch budget. Please try again.");
    }
  };

  // ✅ Set Budget Handler
  const handleSetBudget = async (e) => {
    e.preventDefault();
    try {
      const accessToken = localStorage.getItem("accessToken"); // Updated to accessToken

      if (!budget || isNaN(budget) || parseFloat(budget) <= 0) {
        alert("⚠️ Please enter a valid budget amount.");
        return;
      }

      await axios.post(
        "http://localhost:8000/api/",
        {
          action: "add_budget",
          total_budget: parseFloat(budget),
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      alert("✅ Budget updated successfully!");
      fetchBudget(); // Refresh budget data
      setBudget("");
    } catch (error) {
      console.error("🚨 Error setting budget:", error.response?.data || error);
      alert(
        error.response?.data?.error ||
          "An error occurred while setting the budget."
      );
    }
  };

  // ✅ Fetch budget on component mount
  useEffect(() => {
    fetchBudget();
  }, []);

  return (
    <div className="budget-container">
      <div className="budget-card">
        <h2>Set Your Budget</h2>

        {/* ✅ Budget Input Form */}
        <form onSubmit={handleSetBudget} className="budget-form">
          <input
            type="number"
            placeholder="Enter budget amount (KES)"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            required
          />
          <button type="submit">Set Budget</button>
        </form>

        {/* ✅ Budget Summary */}
        <div className="budget-summary">
          <h3>Total Budget: KES {currentBudget.total_budget.toLocaleString()}</h3>
          <h4>
            Remaining Budget: KES{" "}
            {currentBudget.remaining_budget.toLocaleString()}
          </h4>
        </div>
      </div>
    </div>
  );
};

export default Budget;
