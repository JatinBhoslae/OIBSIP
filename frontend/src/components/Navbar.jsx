import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, LogOut, Pizza, LayoutDashboard } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { motion } from 'framer-motion';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const { cartItems } = useContext(CartContext);
  const navigate = useNavigate();

  const totalCartQuantity = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <nav className="sticky top-0 z-50 bg-[#111827]/90 backdrop-blur-md border-b border-neutral-800 text-white px-6 py-4 flex items-center justify-between shadow-medium">
      <Link to="/" className="flex items-center gap-2 group">
        <motion.div
          whileHover={{ rotate: 15 }}
          className="bg-[#FF6B00] p-2 rounded-full text-white shadow-medium"
        >
          <Pizza className="w-5 h-5" />
        </motion.div>
        <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-[#FF6B00] to-yellow-500 bg-clip-text text-transparent">
          PizzaHub
        </span>
      </Link>

      <div className="flex items-center gap-6 text-sm font-medium">
        {(!user || user.role === 'customer') && (
          <Link to="/menu" className="hover:text-[#FF6B00] transition-colors">
            Menu
          </Link>
        )}
        {(!user || user.role === 'customer') && (
          <Link to="/customize" className="text-[#FF6B00] hover:text-white transition-colors bg-[#FF6B00]/10 border border-[#FF6B00]/25 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
            Pizza Builder
          </Link>
        )}
        {user && (
          <>
            {user.role === 'admin' && (
              <Link to="/admin/orders" className="hover:text-[#FF6B00] transition-colors font-semibold">
                All Orders
              </Link>
            )}
            {user.role === 'customer' && (
              <Link to="/orders" className="hover:text-[#FF6B00] transition-colors">
                My Orders
              </Link>
            )}
            {user.role === 'customer' && (
              <Link to="/profile" className="hover:text-[#FF6B00] text-amber-400 font-semibold transition-colors flex items-center gap-1">
                👤 Profile
              </Link>
            )}
          </>
        )}
        {user?.role === 'admin' && (
          <Link to="/admin" className="flex items-center gap-1.5 hover:text-[#FF6B00] transition-colors font-semibold">
            <LayoutDashboard className="w-4 h-4 text-[#FF6B00]" />
            Dashboard
          </Link>
        )}
        {user?.role === 'delivery_partner' && (
          <Link to="/delivery/dashboard" className="hover:text-[#FF6B00] transition-colors font-semibold flex items-center gap-1 text-emerald-400">
            🛵 Logistics Portal
          </Link>
        )}
      </div>

      <div className="flex items-center gap-4">
        {(!user || user.role === 'customer') && (
          <Link to="/cart" className="relative p-2.5 hover:bg-neutral-800 rounded-full transition-colors">
            <ShoppingCart className="w-5 h-5 text-neutral-300 hover:text-white" />
            {totalCartQuantity > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-0.5 -right-0.5 bg-[#FF6B00] text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full"
              >
                {totalCartQuantity}
              </motion.span>
            )}
          </Link>
        )}

        {user ? (
          <div className="flex items-center gap-4 text-xs">
            <span className="text-neutral-300 hidden md:inline">
              Hi, <span className="text-[#FF6B00] font-semibold">{user.name}</span>
            </span>
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="flex items-center gap-1 px-3 py-1.5 border border-neutral-700 hover:bg-neutral-800 rounded-lg text-neutral-300 hover:text-white transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="bg-[#FF6B00] hover:bg-[#e05e00] text-white text-xs font-bold px-4 py-2 rounded-lg shadow-lg shadow-orange-500/10 hover:scale-[1.02] transition-all"
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
