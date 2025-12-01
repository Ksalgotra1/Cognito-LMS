import React from 'react';

// Added 'type' prop (defaults to 'button')
const Button = ({ children, onClick, variant = "primary", className = "", type = "button", disabled = false }) => {
  const baseStyle = "px-4 py-2 rounded-lg font-bold transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
    danger: "bg-red-500 text-white hover:bg-red-600",
  };

  return (
    <button 
      type={type} 
      className={`${baseStyle} ${variants[variant]} ${className}`} 
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;