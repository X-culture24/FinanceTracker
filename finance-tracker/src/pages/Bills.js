import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../App.css";

const Bills = () => {
  const [bills, setBills] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [message, setMessage] = useState("");
  const [newBill, setNewBill] = useState({
    category: "",
    amount: "",
    due_date: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  // Fetch bills and notifications
  const fetchBills = useCallback(async () => {
    try {
      const token = localStorage.getItem("accessToken"); // Changed from "token" to "accessToken"
      if (!token) {
        throw new Error("No authentication token found");
      }

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

  // Mark bill as paid
  const markAsPaid = async (billId) => {
    try {
      const token = localStorage.getItem("accessToken"); // Changed here
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await axios.post(
        "http://localhost:8000/api/",
        { action: "mark_bill_paid", bill_id: billId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage(response.data.message);
      fetchBills(); // Refresh bill list
    } catch (error) {
      console.error("Error marking bill as paid:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("accessToken");
        navigate("/login");
      }
    }
  };

  // Add new bill
  const addBill = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("accessToken"); // Changed here
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await axios.post(
        "http://localhost:8000/api/",
        { action: "add_bill", ...newBill },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage(response.data.message);
      setNewBill({ category: "", amount: "", due_date: "" });
      fetchBills();
    } catch (error) {
      console.error("Error adding bill:", error);
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
    <div className="container">
      <h2>Your Bills</h2>

      {message && <p className="success-message">{message}</p>}

      <ul>
        {bills.map((bill) => (
          <li key={bill.bill_id} className="card">
            <p>
              <strong>{bill.category}</strong>: KES {bill.amount} (Due: {bill.due_date}) -{" "}
              {bill.status}
            </p>
            {bill.can_mark_as_paid && (
              <button onClick={() => markAsPaid(bill.bill_id)}>Mark as Paid</button>
            )}
          </li>
        ))}
      </ul>

      <h3>Unpaid Bill Notifications</h3>
      {notifications.length === 0 ? (
        <p>No pending notifications.</p>
      ) : (
        notifications.map((note) => (
          <p key={note.bill_id} className="notification">{note.message}</p>
        ))
      )}

      <h3>Add a New Bill</h3>
      <form className="card add-bill-form" onSubmit={addBill}>
        <label>
          Category:
          <input
            type="text"
            value={newBill.category}
            onChange={(e) => setNewBill({ ...newBill, category: e.target.value })}
            placeholder="e.g., Rent, Electricity"
            required
          />
        </label>

        <label>
          Amount (KES):
          <input
            type="number"
            value={newBill.amount}
            onChange={(e) => setNewBill({ ...newBill, amount: e.target.value })}
            placeholder="e.g., 5000"
            required
          />
        </label>

        <label>
          Due Date:
          <input
            type="date"
            value={newBill.due_date}
            onChange={(e) => setNewBill({ ...newBill, due_date: e.target.value })}
            required
          />
        </label>

        <button type="submit">Add Bill</button>
      </form>

      <button className="back-button" onClick={() => navigate("/dashboard")}>
        ← Back to Dashboard
      </button>
    </div>
  );
};

export default Bills;