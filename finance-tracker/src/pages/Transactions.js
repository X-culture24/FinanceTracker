import axios from 'axios';
import React, { useEffect, useState } from 'react';
import "../App.css";
const Transactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch transactions
    const fetchTransactions = async () => {
        try {
            const token = localStorage.getItem('accessToken'); // Ensure correct key
            if (!token) {
                console.error("No access token found.");
                return;
            }

            const response = await axios.post(
                'http://localhost:8000/api/',
                { action: 'list_bills' },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            console.log('API Response:', response.data); // Debug response

            // Filter only paid bills to show as transactions
            const paidBills = response.data.bills.filter(bill => bill.status === 'Paid');
            const formattedTransactions = paidBills.map(bill => ({
                id: bill.bill_id,
                category: bill.category || 'Uncategorized',
                amount: bill.amount,
                date: bill.due_date || 'Unknown Date'
            }));

            setTransactions(formattedTransactions);
        } catch (error) {
            console.error('Error fetching transactions:', error.response?.data || error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    return (
        <div className="transactions-container">
            <h2>Transactions</h2>
            {loading ? (
                <p>Loading transactions...</p>
            ) : transactions.length === 0 ? (
                <p>No transactions available.</p>
            ) : (
                <ul>
                    {transactions.map((transaction) => (
                        <li key={transaction.id}>
                            <span>{transaction.category}</span>
                            <span>KES {parseFloat(transaction.amount).toFixed(2)}</span>
                            <span>{transaction.date}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default Transactions;
