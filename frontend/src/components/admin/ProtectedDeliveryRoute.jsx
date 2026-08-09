import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

export default function ProtectedDeliveryRoute() {
  const { user, token, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0B0F1A]">
        <div className="w-8 h-8 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/delivery/login" replace />;
  }

  if (user.role !== 'delivery_partner') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
