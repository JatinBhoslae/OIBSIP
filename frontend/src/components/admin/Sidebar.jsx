import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import {
  LayoutDashboard,
  ShoppingBag,
  Database,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Pizza,
  Tag,
  X,
  Bell,
  Star,
  Award,
  Truck,
} from 'lucide-react';

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/crm', label: 'Customer CRM', icon: Users },
  { to: '/admin/reviews', label: 'Reviews', icon: Star },
  { to: '/admin/delivery', label: 'Delivery & Fleet', icon: Truck },
  { to: '/admin/inventory', label: 'Inventory', icon: Database },
  { to: '/admin/notifications', label: 'Notifications', icon: Bell },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/pizzas', label: 'Pizzas', icon: Pizza, disabled: true },
  { to: '/admin/coupons', label: 'Coupons', icon: Tag, disabled: true },
  { to: '/admin/settings', label: 'Settings', icon: Settings, disabled: true },
];

export default function Sidebar({ isOpen, onClose }) {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-[#0B0F1A] border-r border-neutral-800
          flex flex-col transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF6B00] to-[#E63946] flex items-center justify-center">
              <Pizza className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white tracking-tight">PizzaHub</p>
              <p className="text-[10px] text-neutral-500 uppercase tracking-widest">Admin Panel</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-neutral-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;

            if (item.disabled) {
              return (
                <div
                  key={item.to}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-neutral-600 cursor-not-allowed text-sm"
                  title="Coming soon"
                >
                  <Icon className="w-[18px] h-[18px]" />
                  <span>{item.label}</span>
                </div>
              );
            }

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/20'
                      : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-white'
                  }`
                }
              >
                <Icon className="w-[18px] h-[18px]" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-neutral-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-neutral-400 hover:bg-rose-500/10 hover:text-rose-400 transition-all duration-200"
          >
            <LogOut className="w-[18px] h-[18px]" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
