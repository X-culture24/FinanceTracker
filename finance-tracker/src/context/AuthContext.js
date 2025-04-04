import React, { createContext, useState, useEffect } from "react";

// Create Auth Context
export const AuthContext = createContext();

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Check if user is logged in (from localStorage) on mount
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("userData"); // ✅ Changed key to match Login.js
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Error parsing user data from localStorage:", error);
      localStorage.removeItem("userData");
    }
  }, []);

  // Login function
  const login = (userData) => {
    localStorage.setItem("userData", JSON.stringify(userData)); // ✅ Ensure consistency
    localStorage.setItem("accessToken", userData.accessToken);
    localStorage.setItem("refreshToken", userData.refreshToken);
    setUser(userData);
  };

  // Logout function
  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout }}> 
      {children}
    </AuthContext.Provider>
  );
};
