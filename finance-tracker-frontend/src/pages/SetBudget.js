import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setBudget } from "../api"; // Import API function
import "./Form.css"; // Ensure this file exists

const SetBudget = () => {
    const [category, setCategory] = useState("");
    const [amount, setAmount] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setMessage("");

        try {
            await setBudget(category, amount); // Use API function
            setMessage("Budget set successfully!");
            setCategory("");
            setAmount("");
        } catch (error) {
            setError(error.message || "Failed to set budget.");
        }
    };

    return (
        <div className="form-container">
            <h2>Set Your Budget</h2>
            {error && <p style={{ color: "red" }}>{error}</p>}
            {message && <p style={{ color: "green" }}>{message}</p>}
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Category (e.g., Groceries, Rent)"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                />
                <input
                    type="number"
                    placeholder="Amount (Ksh)"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                />
                <button type="submit">Set Budget</button>
            </form>
            <button onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
        </div>
    );
};

export default SetBudget;
