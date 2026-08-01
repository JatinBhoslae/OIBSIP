import React from 'react';
import { motion } from 'framer-motion';

const accentMap = {
  orange: 'from-[#FF6B00]/20 to-[#FF6B00]/5 border-[#FF6B00]/30 text-[#FF6B00]',
  green: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-400',
  blue: 'from-sky-500/20 to-sky-500/5 border-sky-500/30 text-sky-400',
  red: 'from-rose-500/20 to-rose-500/5 border-rose-500/30 text-rose-400',
  purple: 'from-violet-500/20 to-violet-500/5 border-violet-500/30 text-violet-400',
  yellow: 'from-amber-400/20 to-amber-400/5 border-amber-400/30 text-amber-400',
};

export default function DashboardCard({ icon: Icon, title, value, accent = 'orange', subtitle }) {
  const colors = accentMap[accent] || accentMap.orange;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`bg-gradient-to-br ${colors} border rounded-2xl p-5 flex items-start gap-4`}
    >
      <div className="p-3 rounded-xl bg-white/5 shrink-0">
        {Icon && <Icon className="w-6 h-6" />}
      </div>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wider text-neutral-400 font-medium">{title}</p>
        <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
        {subtitle && <p className="text-xs text-neutral-500 mt-1">{subtitle}</p>}
      </div>
    </motion.div>
  );
}
