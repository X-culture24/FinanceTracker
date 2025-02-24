import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import AddBill from "./pages/AddBill";
import Transactions from "./pages/Transactions";
import SetBudget from "./pages/SetBudget";

const ProtectedRoute = ({ children }) => {
    const isAuthenticated = localStorage.getItem("access_token"); // ✅ Correct key
    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/add-bill" element={<ProtectedRoute><AddBill /></ProtectedRoute>} />
                <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
                <Route path="/set-budget" element={<ProtectedRoute><SetBudget /></ProtectedRoute>} />
            </Routes>
        </Router>
    );
}

export default App;
