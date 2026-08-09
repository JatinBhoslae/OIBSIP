import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import NotificationBell from './NotificationBell';

export default function Topbar({ onMenuToggle }) {
  const { user, logout } = useContext(AuthContext);

  return (
    <header className="h-16 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/20">
          Admin Portal
        </span>
      </div>

      <div className="flex items-center gap-4">
        <NotificationBell />

        <div className="h-4 w-px bg-neutral-800" />

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center font-bold text-xs text-white shadow-md">
            {user?.name ? user.name[0].toUpperCase() : 'A'}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-bold text-white">{user?.name || 'Admin'}</div>
            <div className="text-[10px] text-neutral-400">{user?.email || 'admin@pizzahub.com'}</div>
          </div>
        </div>

        <button
          onClick={logout}
          className="p-2 text-neutral-400 hover:text-red-400 transition-colors rounded-lg hover:bg-neutral-900"
          title="Logout"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </header>
  );
}
