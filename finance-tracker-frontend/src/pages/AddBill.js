import { useState } from "react";
import { addBill } from "../api"; // Import API function
import "./Form.css";

function AddBill() {
  const [bill, setBill] = useState({ name: "", amount: "", due_date: "", category: "" });

  const handleChange = (e) => {
    setBill({ ...bill, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addBill(bill); // Use API function
      alert("Bill added successfully!");
      setBill({ name: "", amount: "", due_date: "", category: "" }); // Reset form
    } catch (error) {
      console.error("Error adding bill:", error);
      alert("Failed to add bill. Please try again.");
    }
  };

  return (
    <div className="form-container">
      <h2>Add a Bill</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" name="name" placeholder="Bill Name" value={bill.name} onChange={handleChange} required />
        <input type="number" name="amount" placeholder="Amount" value={bill.amount} onChange={handleChange} required />
        <input type="date" name="due_date" value={bill.due_date} onChange={handleChange} required />
        <input type="text" name="category" placeholder="Category" value={bill.category} onChange={handleChange} required />
        <button type="submit">Add Bill</button>
      </form>
    </div>
  );
}

export default AddBill;
