import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Providers
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ErrorBoundary from './components/common/ErrorBoundary';
import OfflineBanner from './components/common/OfflineBanner';
import { PageSkeleton } from './components/common/LoadingSkeleton';

// Light Pages (Always loaded initially)
import Landing from './pages/Landing';
import Menu from './pages/Menu';
import PizzaBuilder from './pages/PizzaBuilder';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOTP from './pages/VerifyOTP';

// Lazy Loaded Pages
const Checkout = lazy(() => import('./pages/Checkout'));
const MyOrders = lazy(() => import('./pages/MyOrders'));
const OrderTracking = lazy(() => import('./pages/OrderTracking'));
const CustomerLoyalty = lazy(() => import('./pages/CustomerLoyalty'));
const Profile = lazy(() => import('./pages/Profile'));
const OfflineFallback = lazy(() => import('./pages/OfflineFallback'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));

// Admin Pages & Guards (Lazy loaded)
import ProtectedAdminRoute from './components/admin/ProtectedAdminRoute';
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const InventoryDashboard = lazy(() => import('./pages/admin/InventoryDashboard'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const Notifications = lazy(() => import('./pages/admin/Notifications'));
const AdminProfile = lazy(() => import('./pages/admin/AdminProfile'));
const NotAuthorized = lazy(() => import('./pages/admin/NotAuthorized'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Analytics = lazy(() => import('./pages/admin/Analytics'));
const AdminCrm = lazy(() => import('./pages/admin/AdminCrm'));
const AdminReviews = lazy(() => import('./pages/admin/AdminReviews'));
const AdminPizzas = lazy(() => import('./pages/admin/AdminPizzas'));
const AdminCoupons = lazy(() => import('./pages/admin/AdminCoupons'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));

// Delivery Pages & Guards (Lazy loaded)
import ProtectedDeliveryRoute from './components/admin/ProtectedDeliveryRoute';
const DeliveryLogin = lazy(() => import('./pages/DeliveryLogin'));
const DeliveryDashboard = lazy(() => import('./pages/DeliveryDashboard'));
const DeliveryEarnings = lazy(() => import('./pages/DeliveryEarnings'));
const DeliveryHistory = lazy(() => import('./pages/DeliveryHistory'));
const AdminDelivery = lazy(() => import('./pages/admin/AdminDelivery'));


import { useRegisterSW } from 'virtual:pwa-register/react';

export default function App() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW registered successfully');
    },
    onRegisterError(error) {
      console.error('SW registration failed', error);
    }
  });

  return (
    <ErrorBoundary>
      <AuthProvider>
        <CartProvider>
          <SocketProvider>
            <NotificationProvider>
              <Router>
                <div className="flex flex-col min-h-screen bg-neutral-950 text-white font-sans pt-safe">
                  <OfflineBanner />
                  
                  {/* PWA Update Banner */}
                  {needRefresh && (
                    <div className="fixed bottom-5 right-5 z-50 bg-[#111827] border border-[#FF6B00] p-4 rounded-2xl shadow-2xl max-w-sm text-left flex flex-col gap-2.5">
                      <div>
                        <h4 className="text-xs font-bold text-white">App Update Available</h4>
                        <p className="text-[10px] text-neutral-400 mt-0.5">A new version of PizzaHub is ready. Reload to update.</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateServiceWorker(true)}
                          className="bg-[#FF6B00] hover:bg-[#e05e00] text-white px-3 py-1.5 rounded-lg text-[10px] font-bold"
                        >
                          Update Now
                        </button>
                        <button
                          onClick={() => setNeedRefresh(false)}
                          className="bg-neutral-800 hover:bg-neutral-750 text-neutral-300 px-3 py-1.5 rounded-lg text-[10px] font-bold"
                        >
                          Later
                        </button>
                      </div>
                    </div>
                  )}

                  <Suspense fallback={<PageSkeleton />}>
                    <Routes>
                      {/* Delivery Partner Portal Routes */}
                      <Route path="/delivery/login" element={<DeliveryLogin />} />
                      <Route element={<ProtectedDeliveryRoute />}>
                        <Route path="/delivery/dashboard" element={<DeliveryDashboard />} />
                        <Route path="/delivery/earnings" element={<DeliveryEarnings />} />
                        <Route path="/delivery/history" element={<DeliveryHistory />} />
                      </Route>

                      {/* Dedicated Admin Routes */}
                      <Route path="/admin/login" element={<AdminLogin />} />
                      <Route path="/admin/not-authorized" element={<NotAuthorized />} />

                      <Route element={<ProtectedAdminRoute />}>
                        <Route path="/admin/dashboard" element={<Dashboard />} />
                        <Route path="/admin/crm" element={<AdminCrm />} />
                        <Route path="/admin/reviews" element={<AdminReviews />} />
                        <Route path="/admin/delivery" element={<AdminDelivery />} />
                        <Route path="/admin/inventory" element={<InventoryDashboard />} />
                        <Route path="/admin/orders" element={<AdminOrders />} />
                        <Route path="/admin/notifications" element={<Notifications />} />
                        <Route path="/admin/profile" element={<AdminProfile />} />
                        <Route path="/admin/analytics" element={<Analytics />} />
                        <Route path="/admin/pizzas" element={<AdminPizzas />} />
                        <Route path="/admin/coupons" element={<AdminCoupons />} />
                        <Route path="/admin/settings" element={<AdminSettings />} />
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
                                <Route path="/orders" element={<MyOrders />} />
                                <Route path="/orders/:id" element={<OrderTracking />} />
                                <Route path="/profile" element={<Profile />} />
                                <Route path="/profile/loyalty" element={<Navigate to="/profile" replace />} />
                                <Route path="/login" element={<Login />} />
                                <Route path="/register" element={<Register />} />
                                <Route path="/verify-otp" element={<VerifyOTP />} />
                                <Route path="/forgot-password" element={<ForgotPassword />} />
                                <Route path="/reset-password/:token" element={<ResetPassword />} />
                                <Route path="/offline" element={<OfflineFallback />} />
                              </Routes>
                            </main>
                            <Footer />
                          </>
                        }
                      />
                    </Routes>
                  </Suspense>
                </div>
              </Router>
            </NotificationProvider>
          </SocketProvider>
        </CartProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
