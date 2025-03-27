import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";
import "./FinanceAnalysis.css";
import BackArrow from '../components/BackArrow';

const FinanceAnalysis = () => {
  const [analysis, setAnalysis] = useState({});
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
        
        setAnalysis(response.data);
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

  return (
    <div className="finance-analysis-container">
      {/* Back Arrow at top-left */}
      <BackArrow />
      
      <h2>Finance Analysis</h2>
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
        <>
          {/* Glowing Progress Card */}
          <div className="progress-card">
            <CircularProgress
              variant="determinate"
              value={analysis.progress_percentage}
              size={250}
              thickness={5}
              sx={{
                color: "#6a0dad",
                "& .MuiCircularProgress-circle": {
                  filter: "drop-shadow(0 0 5px rgba(106, 13, 173, 0.7))",
                },
              }}
            />
            <div className="progress-text">
              {analysis.progress_percentage}% Used
            </div>
          </div>

          {/* Horizontal Info Cards */}
          <div className="info-cards-container">
            <div className="info-card">
              <h3>Total Budget</h3>
              <p>KES {analysis.total_budget?.toLocaleString() || 0}</p>
            </div>

            <div className="info-card">
              <h3>Remaining</h3>
              <p>KES {analysis.remaining_budget?.toLocaleString() || 0}</p>
            </div>

            <div className="info-card">
              <h3>Paid Bills</h3>
              <p>KES {analysis.paid_bills_total?.toLocaleString() || 0}</p>
            </div>

            <div className="info-card">
              <h3>Unpaid Bills</h3>
              <p>KES {analysis.unpaid_bills_total?.toLocaleString() || 0}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FinanceAnalysis;