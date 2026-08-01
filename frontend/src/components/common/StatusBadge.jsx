import React from 'react';

export default function StatusBadge({ status }) {
  const styles = {
    pending: "bg-orange-500/10 text-orange-400 border border-orange-500/25",
    confirmed: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/25",
    preparing: "bg-blue-500/10 text-blue-400 border border-blue-500/25",
    'in-kitchen': "bg-purple-500/10 text-purple-400 border border-purple-500/25",
    ready: "bg-green-500/10 text-green-400 border border-green-500/25",
    'out-for-delivery': "bg-cyan-500/10 text-cyan-400 border border-cyan-500/25",
    delivered: "bg-emerald-800/20 text-emerald-400 border border-emerald-800/30",
    cancelled: "bg-red-500/10 text-red-400 border border-red-500/25"
  };

  return (
    <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full ${styles[status] || styles.pending}`}>
      {status}
    </span>
  );
}
