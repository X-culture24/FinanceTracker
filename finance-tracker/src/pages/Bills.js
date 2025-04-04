import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../App.css";
import BackArrow from "../components/BackArrow";

const Bills = () => {
  const [bills, setBills] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [newBill, setNewBill] = useState({
    category: "",
    amount: "",
    due_date: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const categories = ["Rent", "Electricity", "Water", "Internet", "Groceries", "Transport", "Insurance", "Loan Payment", "Entertainment", "Miscellaneous"];

  const fetchBills = useCallback(async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No authentication token found");

      const response = await axios.post(
        "http://localhost:8000/api/",
        { action: "list_bills" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setBills(response.data.bills || []);
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error("Error fetching bills:", error);
      if (error.response?.status === 401 || error.message.includes("authentication")) {
        localStorage.removeItem("accessToken");
        navigate("/login");
      }
      setError(error.response?.data?.error || "Failed to load bills");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Add new bill
  const addBill = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No authentication token found");

      const billData = {
        ...newBill,
        amount: parseFloat(newBill.amount),
      };

      const response = await axios.post(
        "http://localhost:8000/api/",
        { action: "add_bill", ...billData },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage({ text: response.data.message, type: "success" });
      setNewBill({ category: "", amount: "", due_date: "" });
      fetchBills();

      setTimeout(() => setMessage({ text: "", type: "" }), 5000);
    } catch (error) {
      console.error("Error adding bill:", error);
      setMessage({
        text: error.response?.data?.error || "Failed to add bill",
        type: "error",
      });
      if (error.response?.status === 401) {
        localStorage.removeItem("accessToken");
        navigate("/login");
      }
    }
  };

  // Mark bill as paid
  const markBillAsPaid = async (billId) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No authentication token found");

      const response = await axios.post(
        "http://localhost:8000/api/",
        { action: "mark_bill_paid", bill_id: billId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage({ text: response.data.message, type: "success" });
      fetchBills(); // Refresh the bills list

      setTimeout(() => setMessage({ text: "", type: "" }), 5000);
    } catch (error) {
      console.error("Error marking bill as paid:", error);
      setMessage({
        text: error.response?.data?.error || "Failed to mark bill as paid",
        type: "error",
      });
      if (error.response?.status === 401) {
        localStorage.removeItem("accessToken");
        navigate("/login");
      }
    }
  };

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  if (loading) {
    return <div className="container">Loading bills...</div>;
  }

  if (error) {
    return (
      <div className="container">
        <p className="error-message">{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="bills-container">
      <div className="bills-card">
        <BackArrow onClick={() => navigate("/dashboard")} />
        <h2>Bill Management</h2>

        {/* Message Notification */}
        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Add New Bill Form */}
        <form onSubmit={addBill} className="bill-form">
          <h3>Add New Bill</h3>

          <div className="form-group">
            <label>Category</label>
            <select
              value={newBill.category}
              onChange={(e) => setNewBill({ ...newBill, category: e.target.value })}
              required
            >
              <option value="" disabled>Select a category</option>
              {categories.map((category, index) => (
                <option key={index} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Amount (KES)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={newBill.amount}
              onChange={(e) => setNewBill({ ...newBill, amount: e.target.value })}
              placeholder="e.g., 5000"
              required
            />
          </div>

          <div className="form-group">
            <label>Due Date</label>
            <input
              type="date"
              value={newBill.due_date}
              onChange={(e) => setNewBill({ ...newBill, due_date: e.target.value })}
              required
            />
          </div>

          <button type="submit" className="submit-btn">
            Add Bill
          </button>
        </form>

        {/* Bills List */}
        <div className="bills-list">
          <h3>Your Bills</h3>
          {bills.length === 0 ? (
            <p className="no-bills">No bills found</p>
          ) : (
            <ul>
              {bills.map((bill) => (
                <li key={bill.bill_id} className={`bill-item ${bill.is_paid ? 'paid' : 'unpaid'}`}>
                  <div className="bill-header">
                    <span className="bill-category">{bill.category}</span>
                    <span className="bill-amount">KES {parseFloat(bill.amount).toFixed(2)}</span>
                  </div>
                  <div className="bill-details">
                    <span className="due-date">Due: {bill.due_date}</span>
                    <span className={`status ${bill.is_paid ? "paid" : "unpaid"}`}>
                      {bill.is_paid ? "Paid" : "Unpaid"}
                    </span>
                  </div>
                  {!bill.is_paid && (
                    <button 
                      onClick={() => markBillAsPaid(bill.bill_id)}
                      className="mark-paid-btn"
                    >
                      Mark as Paid
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Notifications Section */}
        {notifications.length > 0 && (
          <div className="notifications-section">
            <h3>Notifications</h3>
            <ul>
              {notifications.map((note, index) => (
                <li key={index} className="notification-item">
                  {note.message}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Bills;
