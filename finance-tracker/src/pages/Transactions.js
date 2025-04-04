import axios from 'axios';
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';
import './Transactions.css';
import BackArrow from '../components/BackArrow';

const Transactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // Fetch transactions using useCallback to prevent unnecessary re-creation
    const fetchTransactions = useCallback(async () => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                throw new Error("Authentication required");
            }

            const response = await axios.post(
                'http://localhost:8000/api/',
                { action: 'get_transactions' },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            console.log("API Response:", response.data); // ✅ Debugging step

            // Ensure we're only processing transactions
            if (!response.data.recent_transactions || !Array.isArray(response.data.recent_transactions)) {
                throw new Error("Invalid transaction data received");
            }

            // Format transactions properly
            const formattedTransactions = response.data.recent_transactions.map(txn => ({
                id: txn.id,
                type: txn.type,
                category: txn.category,
                amount: parseFloat(txn.amount),
                date: new Date(txn.date).toLocaleDateString('en-KE', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                description: txn.description || "No description",
                billId: txn.related_bill || null,
                budgetId: txn.related_budget || null
            }));

            setTransactions(formattedTransactions);
        } catch (error) {
            console.error('Error fetching transactions:', error);
            if (error.response?.status === 401) {
                localStorage.removeItem('accessToken');
                navigate('/login');
            }
            setError(error.response?.data?.error || "Failed to load transactions. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    return (
        <div className="transactions-page">
            <BackArrow onClick={() => navigate('/dashboard')} />
            
            <div className="transactions-container">
                <h2>Transaction History</h2>
                
                {loading ? (
                    <div className="loading-container">
                        <CircularProgress />
                        <p>Loading transactions...</p>
                    </div>
                ) : error ? (
                    <div className="error-container">
                        <p>{error}</p>
                        <button onClick={fetchTransactions}>Retry</button>
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="empty-state">
                        <p>No transactions found</p>
                    </div>
                ) : (
                    <div className="transactions-list">
                        {transactions.map((transaction) => (
                            <div key={transaction.id} className={`transaction-item ${transaction.type}`}>
                                <div className="transaction-details">
                                    <h3>{transaction.category}</h3>
                                    <p>{transaction.description}</p>
                                    <p>{transaction.date}</p>
                                    <p>KES {transaction.amount.toFixed(2)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Transactions;
