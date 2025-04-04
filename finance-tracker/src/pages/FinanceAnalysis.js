import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";
import "./FinanceAnalysis.css";
import BackArrow from '../components/BackArrow';

const FinanceAnalysis = () => {
  const [analysis, setAnalysis] = useState({
    total_budget: 0,
    remaining_budget: 0,
    spent_percentage: 0,
    total_credits: 0,
    total_debits: 0,
    balance: 0,
    recent_transactions: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFinanceAnalysis = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        
        if (!token) {
          throw new Error("No authentication token found");
        }

        const response = await axios.post(
          "http://localhost:8000/api/",
          { action: "finance_analysis" },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        
        setAnalysis({
          total_budget: response.data.total_budget || 0,
          remaining_budget: response.data.remaining_budget || 0,
          spent_percentage: response.data.spent_percentage || 0,
          total_credits: response.data.total_credits || 0,
          total_debits: response.data.total_debits || 0,
          balance: response.data.balance || 0,
          recent_transactions: response.data.recent_transactions || []
        });
        setLoading(false);
      } catch (error) {
        console.error("Error fetching analysis:", error);
        
        if (error.response?.status === 401 || error.message.includes("authentication")) {
          localStorage.removeItem("accessToken");
          navigate("/login");
        }
        
        setError(error.response?.data?.error || "Failed to load analysis");
        setLoading(false);
      }
    };

    fetchFinanceAnalysis();
  }, [navigate]);

  const getProgressColor = () => {
    if (analysis.remaining_budget < 0) return "#ff4444";
    if (analysis.spent_percentage > 80) return "#ffbb33";
    return "#00C851";
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  return (
    <div className="finance-analysis-container">
      <BackArrow onClick={() => navigate("/dashboard")} />
      
      <h2>Financial Overview</h2>
      
      {loading ? (
        <div className="loading-spinner">
          <CircularProgress />
          <p>Loading your financial data...</p>
        </div>
      ) : error ? (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Try Again</button>
        </div>
      ) : (
        <div className="analysis-content">
          <div className="progress-section">
            <CircularProgress
              variant="determinate"
              value={Math.min(analysis.spent_percentage, 100)}
              size={120}
              thickness={6}
              sx={{
                color: getProgressColor(),
                "& .MuiCircularProgress-circle": {
                  filter: "drop-shadow(0 0 5px rgba(0, 200, 81, 0.3))",
                },
              }}
            />
            <div className="progress-text">
              <p className="percentage">{analysis.spent_percentage.toFixed(1)}%</p>
              <p className="status">
                {analysis.remaining_budget < 0 ? (
                  <span className="exceeded">Exceeded by {formatCurrency(Math.abs(analysis.remaining_budget))}</span>
                ) : (
                  <span className="remaining">{formatCurrency(analysis.remaining_budget)} remaining</span>
                )}
              </p>
            </div>
          </div>

          <div className="financial-summary">
            <div className="summary-item">
              <h3>Total Budget</h3>
              <p>{formatCurrency(analysis.total_budget)}</p>
            </div>
            
            {/* Removed the Income card */}
            
            <div className="summary-item">
              <h3>Expenses</h3>
              <p className="debit">{formatCurrency(analysis.total_debits)}</p>
            </div>
            
            <div className="summary-item">
              <h3>Net Balance</h3>
              <p className={analysis.balance >= 0 ? 'credit' : 'debit'}>
                {formatCurrency(analysis.balance)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceAnalysis;