// src/components/FinanceAnalysis.js

import React, { useEffect, useState } from "react";
import axios from "axios";
import CircularProgress from "@mui/material/CircularProgress";
import "./FinanceAnalysis.css";

const FinanceAnalysis = () => {
  const [analysis, setAnalysis] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinanceAnalysis();
  }, []);

  const fetchFinanceAnalysis = async () => {
    try {
      const token = localStorage.getItem("token");
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
      setLoading(false);
    }
  };

  return (
    <div className="finance-analysis-container">
      <h2>Finance Analysis</h2>
      {loading ? (
        <p>Loading...</p>
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
              }}
            />
            <div className="progress-text">
              {analysis.progress_percentage}% Used
            </div>
          </div>

          {/* Horizontal Info Cards */}
          <div className="info-cards-container">
            <div className="info-card">
              <p>Total Budget: KES {analysis.total_budget}</p>
            </div>

            <div className="info-card">
              <p>Remaining: KES {analysis.remaining_budget}</p>
            </div>

            <div className="info-card">
              <p>Paid Bills Total: KES {analysis.paid_bills_total}</p>
            </div>

            <div className="info-card">
              <p>Unpaid Bills Total: KES {analysis.unpaid_bills_total}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FinanceAnalysis;
