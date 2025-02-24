import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api/";

// Get auth token from localStorage
const getAuthHeaders = () => {
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const loginUser = async (email, password) => {
    try {
        const response = await axios.post(`${API_URL}login/`, { email, password });

        if (response.data.access && response.data.refresh) {
            // Store correct tokens in localStorage
            localStorage.setItem("access_token", response.data.access);
            localStorage.setItem("refresh_token", response.data.refresh);
            localStorage.setItem("user", JSON.stringify(response.data.user)); // Store user details
        } else {
            throw new Error("Invalid response format from server.");
        }

        return response.data; // Return complete response
    } catch (error) {
        console.error("Login Error:", error.response?.data || error.message);
        throw new Error(error.response?.data?.error || "Login failed. Check credentials.");
    }
};


// ✅ User Registration
export const registerUser = async (username, email, password) => {
    try {
        const response = await axios.post(`${API_URL}register/`, { username, email, password });
        return response.data;
    } catch (error) {
        console.error("Registration Error:", error.response?.data || error.message);
        throw new Error(error.response?.data?.error || "Registration failed.");
    }
};

// ✅ Fetch Transactions (Protected)
export const fetchTransactions = async () => {
    try {
        const response = await axios.get(`${API_URL}transactions/`, { headers: getAuthHeaders() });
        return response.data;
    } catch (error) {
        console.error("Error fetching transactions:", error);
        return [];
    }
};

// ✅ Fetch Bills (Protected)
export const fetchBills = async () => {
    try {
        const response = await axios.get(`${API_URL}bills/`, { headers: getAuthHeaders() });
        return response.data;
    } catch (error) {
        console.error("Error fetching bills:", error);
        return [];
    }
};

// ✅ Add a new Bill (Protected)
export const addBill = async (billData) => {
    try {
        const response = await axios.post(`${API_URL}bills/`, billData, { headers: getAuthHeaders() });
        return response.data;
    } catch (error) {
        console.error("Error adding bill:", error);
        throw new Error("Failed to add bill.");
    }
};

// ✅ Set Budget (Protected)
export const setBudget = async (budgetData) => {
    try {
        const response = await axios.post(`${API_URL}set-budget/`, budgetData, { headers: getAuthHeaders() });
        return response.data;
    } catch (error) {
        console.error("Error setting budget:", error);
        throw new Error("Failed to set budget.");
    }
};
