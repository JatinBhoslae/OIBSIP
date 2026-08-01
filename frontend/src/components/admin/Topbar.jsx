import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Menu, Bell, UserCircle } from 'lucide-react';

export default function Topbar({ onMenuToggle }) {
  const { user } = useContext(AuthContext);

  return (
    <header className="sticky top-0 z-30 bg-[#0B0F1A]/80 backdrop-blur-xl border-b border-neutral-800 px-5 py-3 flex items-center justify-between">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-xl hover:bg-neutral-800 transition-colors text-neutral-400 hover:text-white"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-sm font-semibold text-white hidden sm:block">
          Welcome back, <span className="text-[#FF6B00]">{user?.name || 'Admin'}</span>
        </h1>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <button className="relative p-2 rounded-xl hover:bg-neutral-800 transition-colors text-neutral-400 hover:text-white">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#FF6B00] rounded-full" />
        </button>

        <div className="flex items-center gap-2 pl-2 ml-1 border-l border-neutral-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF6B00] to-[#E63946] flex items-center justify-center text-white text-xs font-bold">
            {user?.name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-medium text-white leading-tight">{user?.name || 'Admin'}</p>
            <p className="text-[10px] text-neutral-500">{user?.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
