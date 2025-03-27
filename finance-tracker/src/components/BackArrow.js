import React from 'react';
import { useNavigate } from 'react-router-dom';
import './BackArrow.css'; // We'll create this next

const BackArrow = ({ color = "#6a0dad", size = 24 }) => {
  const navigate = useNavigate();

  return (
    <button 
      className="back-arrow"
      onClick={() => navigate(-1)}
      aria-label="Go back"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
      </svg>
    </button>
  );
};

export default BackArrow;
