import React, { useState, useEffect } from 'react';
import { FiWifiOff, FiRefreshCw } from 'react-icons/fi';

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // Automatically refresh pages to pull fresh contents once connection returns
      window.location.reload();
    };
    
    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] px-4 py-3 bg-red-950/95 border-t border-red-500/20 backdrop-blur-md text-white shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left transition-all duration-300 animate-slide-up">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-500 shrink-0">
          <FiWifiOff className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-bold uppercase tracking-wider">You're Offline</p>
          <p className="text-xs text-gray-400 font-light mt-0.5 leading-normal">
            Streaming video playback is unavailable. Please check your internet connection.
          </p>
        </div>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors shadow-lg cursor-pointer"
      >
        <FiRefreshCw className="h-3.5 w-3.5" />
        Retry Connection
      </button>
    </div>
  );
}
