import React from 'react';

export default function Input({ label, type = 'text', placeholder, value, onChange, required = false, icon: Icon, error }) {
  return (
    <div className="space-y-1.5 text-left w-full">
      {label && (
        <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
          {Icon && <Icon className="w-3.5 h-3.5 text-neutral-500" />}
          {label}
        </label>
      )}
      <input
        type={type}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full bg-neutral-900 border ${error ? 'border-[#E63946]' : 'border-neutral-800'} rounded-input px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF6B00] transition-colors placeholder-neutral-600`}
      />
      {error && <span className="text-xs text-[#E63946] font-semibold">{error}</span>}
    </div>
  );
}
