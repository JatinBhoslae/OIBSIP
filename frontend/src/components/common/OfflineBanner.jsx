import React, { useState, useEffect } from 'react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { Wifi, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function OfflineBanner() {
  const { isOnline } = useNetworkStatus();
  const [showBanner, setShowBanner] = useState(false);
  const [type, setType] = useState('offline'); // 'offline' | 'restored'

  useEffect(() => {
    if (!isOnline) {
      setType('offline');
      setShowBanner(true);
    } else {
      // Reconnected
      if (showBanner && type === 'offline') {
        setType('restored');
        setShowBanner(true);
        const timer = setTimeout(() => {
          setShowBanner(false);
        }, 3000); // Hide "Back online" notification after 3 seconds
        return () => clearTimeout(timer);
      }
    }
  }, [isOnline]);

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={`fixed top-0 left-0 right-0 z-50 text-center py-2.5 px-4 flex items-center justify-center gap-2 text-xs font-bold shadow-lg transition-colors ${
            type === 'offline' 
              ? 'bg-[#E63946] text-white' 
              : 'bg-emerald-500 text-white'
          }`}
        >
          {type === 'offline' ? (
            <>
              <WifiOff className="w-4 h-4 animate-pulse" />
              <span>You are currently offline. Working with local stored data.</span>
            </>
          ) : (
            <>
              <Wifi className="w-4 h-4" />
              <span>Back online. Restoring active connections...</span>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
