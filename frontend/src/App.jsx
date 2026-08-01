import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Providers
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { SocketProvider } from './context/SocketContext';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// User Pages
import Landing from './pages/Landing';
import Menu from './pages/Menu';
import PizzaBuilder from './pages/PizzaBuilder';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderTracking from './pages/OrderTracking';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOTP from './pages/VerifyOTP';

// Admin Pages & Guards
import ProtectedAdminRoute from './components/admin/ProtectedAdminRoute';
import AdminLogin from './pages/admin/AdminLogin';
import Dashboard from './pages/admin/Dashboard';
import InventoryDashboard from './pages/admin/InventoryDashboard';
import AdminProfile from './pages/admin/AdminProfile';
import NotAuthorized from './pages/admin/NotAuthorized';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <SocketProvider>
          <Router>
            <div className="flex flex-col min-h-screen bg-neutral-950 text-white font-sans">
              <Routes>
                {/* Dedicated Admin Routes */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/not-authorized" element={<NotAuthorized />} />

                <Route element={<ProtectedAdminRoute />}>
                  <Route path="/admin/dashboard" element={<Dashboard />} />
                  <Route path="/admin/inventory" element={<InventoryDashboard />} />
                  <Route path="/admin/profile" element={<AdminProfile />} />
                  <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="/admin/management" element={<AdminDashboard />} />
                </Route>

                {/* Public & Customer Layout */}
                <Route
                  path="*"
                  element={
                    <>
                      <Navbar />
                      <main className="flex-1">
                        <Routes>
                          <Route path="/" element={<Landing />} />
                          <Route path="/menu" element={<Menu />} />
                          <Route path="/customize" element={<PizzaBuilder />} />
                          <Route path="/cart" element={<Cart />} />
                          <Route path="/checkout" element={<Checkout />} />
                          <Route path="/orders/:id" element={<OrderTracking />} />
                          <Route path="/login" element={<Login />} />
                          <Route path="/register" element={<Register />} />
                          <Route path="/verify-otp" element={<VerifyOTP />} />
                        </Routes>
                      </main>
                      <Footer />
                    </>
                  }
                />
              </Routes>
            </div>
          </Router>
        </SocketProvider>
      </CartProvider>
    </AuthProvider>
  );
}
