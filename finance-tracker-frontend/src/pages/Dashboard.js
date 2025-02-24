import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchTransactions } from "../api"; // Import API function
import "./Dashboard.css"; // Ensure this exists

const Dashboard = () => {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);

    // ✅ FIX: Safely handle localStorage JSON parsing
    let user = "{}"; // Default empty object
    try {
        user = localStorage.getItem("user") || "{}"; // Ensure valid JSON
        user = JSON.parse(user); // Parse safely
    } catch (error) {
        console.error("Error parsing user data:", error);
        user = {}; // Fallback to an empty object
    }

    const username = user?.username || "User"; // Default username if missing

    useEffect(() => {
        fetchTransactions()
            .then(data => setTransactions(data))
            .catch(err => console.error("Error fetching transactions:", err));
    }, []);

    // Logout function
    const handleLogout = () => {
        localStorage.clear(); // Clear user session
        navigate("/"); // Redirect to home
    };

    return (
        <div className="dashboard-container">
            <h1>Welcome, {username}!</h1> {/* Display username */}

            <div className="button-container">
                <button className="green-btn" onClick={() => navigate("/add-bill")}>Add Bill</button>
                <button className="green-btn" onClick={() => navigate("/set-budget")}>Set Budget</button>
                <button className="green-btn" onClick={() => navigate("/transactions")}>View Transactions</button>
                <button className="logout-btn" onClick={handleLogout}>Logout</button> {/* Logout button */}
            </div>

            <div className="spending-analysis">
                <h2>Spending Analysis</h2>
                <p>Spending charts will be displayed here.</p>
            </div>

            <div className="transaction-list">
                <h2>Recent Transactions</h2>
                {transactions.length > 0 ? (
                    <ul className="list-group">
                        {transactions.map(txn => (
                            <li key={txn.id} className="list-group-item">
                                {txn.description} - KES {txn.amount}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No recent transactions.</p>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
