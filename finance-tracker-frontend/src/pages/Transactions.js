import { useEffect, useState } from "react";
import { fetchTransactions } from "../api"; // Import API function
import "./Table.css";

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const getTransactions = async () => {
      try {
        const data = await fetchTransactions();
        setTransactions(data);
      } catch (err) {
        setError(err.message || "Failed to fetch transactions.");
      }
    };

    getTransactions();
  }, []);

  return (
    <div className="table-container">
      <h2>Transactions</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th>Amount (Ksh)</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {transactions.length > 0 ? (
            transactions.map((transaction) => (
              <tr key={transaction.id}>
                <td>{transaction.category}</td>
                <td>Ksh {transaction.amount}</td>
                <td>{new Date(transaction.date).toLocaleDateString()}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3" style={{ textAlign: "center" }}>No transactions found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Transactions;
