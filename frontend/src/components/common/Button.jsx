import React from 'react';
import { motion } from 'framer-motion';

export default function Button({ children, onClick, type = 'button', variant = 'primary', disabled = false, className = '' }) {
  const baseStyle = "px-6 py-3 font-semibold text-sm transition-all focus:outline-none flex items-center justify-center gap-2 rounded-btn select-none";
  
  const variants = {
    primary: "bg-[#FF6B00] text-white hover:bg-[#e05e00] shadow-medium hover:shadow-large",
    secondary: "bg-neutral-800 text-neutral-200 hover:bg-neutral-700 border border-neutral-750",
    danger: "bg-[#E63946] text-white hover:bg-[#cc323e]",
    outline: "bg-transparent border border-[#FF6B00] text-[#FF6B00] hover:bg-[#FF6B00]/10"
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      className={`${baseStyle} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </motion.button>
  );
}
