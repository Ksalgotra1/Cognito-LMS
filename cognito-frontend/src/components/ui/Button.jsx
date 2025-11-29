import React from 'react';

const Button = ({ children, onClick, variant = "primary" }) => {
  // Common styles for all buttons
  const baseStyle = "px-4 py-2 rounded-lg font-bold transition-all duration-200 shadow-sm";
  
  // Specific styles for variants
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
    danger: "bg-red-500 text-white hover:bg-red-600",
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]}`} 
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default Button;