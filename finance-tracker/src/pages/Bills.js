import React, { useEffect, useState } from "react";
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

  const navigate = useNavigate();

  // Fetch bills and notifications
  const fetchBills = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:8000/api/",
        { action: "list_bills" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setBills(response.data.bills || []);
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error("Error fetching bills:", error);
    }
  };

  // Mark bill as paid
  const markAsPaid = async (billId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:8000/api/",
        { action: "mark_bill_paid", bill_id: billId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage(response.data.message);
      fetchBills(); // Refresh bill list
    } catch (error) {
      console.error("Error marking bill as paid:", error);
    }
  };

  // Add new bill
  const addBill = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:8000/api/",
        { action: "add_bill", ...newBill },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage(response.data.message);
      setNewBill({ category: "", amount: "", due_date: "" }); // Reset form
      fetchBills(); // Refresh bill list
    } catch (error) {
      console.error("Error adding bill:", error);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  return (
    <div className="container">
      <h2>Your Bills</h2>

      {/* Display Message */}
      {message && <p className="success-message">{message}</p>}

      {/* Bill List */}
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

      {/* Unpaid Bill Notifications */}
      <h3>Unpaid Bill Notifications</h3>
      {notifications.length === 0 ? (
        <p>No pending notifications.</p>
      ) : (
        notifications.map((note) => (
          <p key={note.bill_id} className="notification">{note.message}</p>
        ))
      )}

      {/* Add Bill Form */}
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

      {/* Back Button */}
      <button className="back-button" onClick={() => navigate("/dashboard")}>
        ← Back to Dashboard
      </button>
    </div>
  );
};

export default Bills;
