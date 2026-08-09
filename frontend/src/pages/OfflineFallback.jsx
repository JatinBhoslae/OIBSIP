import React from 'react';
import { WifiOff, RefreshCw, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function OfflineFallback() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col justify-center items-center px-6 py-10 text-center">
      <div className="w-20 h-20 rounded-3xl bg-[#FF6B00]/10 border border-[#FF6B00]/20 flex items-center justify-center text-[#FF6B00] mb-6 animate-pulse">
        <WifiOff className="w-10 h-10" />
      </div>

      <h1 className="text-3xl font-black tracking-tight">You're Offline</h1>
      <p className="text-sm text-neutral-400 max-w-sm mt-3 leading-relaxed">
        Check your internet connection. Some live features are currently unavailable, but you can still customize pizzas and manage your shopping cart offline.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full max-w-xs">
        <button
          onClick={handleRetry}
          className="flex-1 bg-[#FF6B00] hover:bg-[#e05e00] text-white py-3 px-6 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-500/15"
        >
          <RefreshCw className="w-4 h-4" />
          Retry Connection
        </button>

        <Link
          to="/cart"
          className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-750 py-3 px-6 rounded-xl font-bold text-xs flex items-center justify-center gap-2"
        >
          <ShoppingCart className="w-4 h-4 text-orange-400" />
          View Saved Cart
        </Link>
      </div>

      <div className="mt-12 text-[10px] text-neutral-600 uppercase tracking-widest">
        PizzaHub PWA Offline Workspace
      </div>
    </div>
  );
}
