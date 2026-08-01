import React from 'react';
import { Link } from 'react-router-dom';
import { Pizza, Globe, Share2, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-neutral-950 border-t border-neutral-900 text-neutral-400 pt-14 pb-8 px-6 mt-auto">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 text-left">
        {/* Brand */}
        <div className="md:col-span-5 space-y-4">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-[#FF6B00] p-2 rounded-full text-white shadow-medium group-hover:rotate-12 transition-transform">
              <Pizza className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight bg-gradient-to-r from-[#FF6B00] to-yellow-500 bg-clip-text text-transparent">
              PizzaHub
            </span>
          </Link>
          <p className="text-xs leading-relaxed max-w-sm text-neutral-500">
            A production-grade online pizza ordering platform with real-time inventory management. Fresh ingredients, hand-crafted bases, and live order tracking.
          </p>
          <div className="flex items-center gap-3 pt-2">
            {[Globe, Share2, Heart].map((Icon, idx) => (
              <button
                key={idx}
                className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-[#FF6B00]/40 hover:bg-[#FF6B00]/10 transition-all"
              >
                <Icon className="w-3.5 h-3.5 text-neutral-500" />
              </button>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="md:col-span-3">
          <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4 border-b border-neutral-900 pb-2">
            Quick Links
          </h4>
          <ul className="space-y-2.5 text-xs">
            {[
              { to: '/menu', label: 'Our Menu' },
              { to: '/customize', label: 'Pizza Builder' },
              { to: '/cart', label: 'Your Cart' },
              { to: '/login', label: 'Account' },
            ].map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="hover:text-[#FF6B00] transition-colors font-medium">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div className="md:col-span-4">
          <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4 border-b border-neutral-900 pb-2">
            Store Info
          </h4>
          <div className="space-y-2 text-xs">
            <p>📍 123 Pepperoni Lane, Flavor Town</p>
            <p>📞 +1 (555) PIZZA-HUB</p>
            <p>📧 orders@pizzahub.com</p>
            <p className="text-[10px] text-neutral-600 mt-2">Mon-Sun · 11 AM – 11 PM</p>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-6xl mx-auto border-t border-neutral-900 mt-10 pt-5 flex flex-col md:flex-row justify-between items-center gap-3">
        <p className="text-[10px] text-neutral-600">
          &copy; {new Date().getFullYear()} PizzaHub Inc. All rights reserved.
        </p>
        <p className="text-[10px] text-neutral-700">
          Built for educational purposes · MERN Stack · Socket.IO · Razorpay
        </p>
      </div>
    </footer>
  );
}
