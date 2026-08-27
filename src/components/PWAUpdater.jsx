import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { FiRefreshCw, FiX } from 'react-icons/fi';

export default function PWAUpdater() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('[PWA] Service worker successfully registered:', r);
    },
    onRegisterError(error) {
      console.error('[PWA] Service worker registration failed:', error);
    }
  });

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] max-w-md w-full sm:w-[380px] bg-[#12131a]/95 border border-red-500/20 backdrop-blur-md rounded-2xl shadow-2xl p-4 text-white animate-slide-up">
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#e50914] to-orange-600 flex items-center justify-center text-white shrink-0 shadow-[0_0_15px_rgba(229,9,20,0.3)]">
            <FiRefreshCw className="h-5 w-5 animate-spin-slow" />
          </div>
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">Update Available</h4>
            <p className="text-xs text-gray-400 font-light mt-1 leading-relaxed">
              A newer version of StreamApp is ready. Refresh now to experience new features.
            </p>
          </div>
        </div>
        <button
          onClick={() => setNeedRefresh(false)}
          className="text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <FiX className="h-4.5 w-4.5" />
        </button>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2.5">
        <button
          onClick={() => setNeedRefresh(false)}
          className="px-3.5 py-1.5 rounded-lg border border-white/5 hover:bg-white/5 text-gray-400 hover:text-white text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
        >
          Later
        </button>
        <button
          onClick={() => updateServiceWorker(true)}
          className="px-4 py-1.5 bg-[#e50914] hover:bg-red-700 text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors shadow-lg cursor-pointer"
        >
          Update Now
        </button>
      </div>
    </div>
  );
}
