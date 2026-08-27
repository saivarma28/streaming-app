import React, { useState, useEffect } from 'react';
import { FiDownload, FiShare, FiPlusSquare, FiAlertCircle } from 'react-icons/fi';

export default function InstallAppButton({ className = "" }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    // Check if app is already running as standalone
    const checkStandalone = () => {
      const isStandaloneMode = 
        window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone ||
        document.referrer.includes('android-app://');
      setIsStandalone(!!isStandaloneMode);
    };

    checkStandalone();

    // Check device OS for targeted fallback instructions
    const ua = window.navigator.userAgent.toLowerCase();
    const isMobileAndroid = /android/.test(ua);
    const isAppleiOS = /iphone|ipad|ipod/.test(ua);
    
    setIsAndroid(isMobileAndroid);
    setIsIOS(isAppleiOS);

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log('[PWA] beforeinstallprompt event captured.');
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
      console.log('[PWA] App installed successfully.');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`[PWA] Install prompt outcome: ${outcome}`);
      // Clear the prompt reference after interaction
      setDeferredPrompt(null);
    } else {
      // Toggle the clean manual instructions banner below the card
      setShowFallback(true);
    }
  };

  // If already installed and running standalone, do not render the card
  if (isStandalone) {
    return null;
  }

  return (
    <div className={`rounded-2xl border border-white/5 bg-[#12131a]/85 p-6 sm:p-8 backdrop-blur-xl shadow-2xl text-left ${className}`}>
      <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
          {/* Download Icon Wrapper */}
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-[#e50914] to-orange-600 flex items-center justify-center text-white shrink-0 shadow-[0_4px_15px_rgba(229,9,20,0.4)]">
            <FiDownload className="h-6 w-6" />
          </div>
          
          {/* Card Text Content */}
          <div>
            <h3 className="text-lg font-black uppercase text-white tracking-wider">DOWNLOAD STREAMAPP</h3>
            <p className="text-sm text-gray-400 font-light mt-1 max-w-xl leading-relaxed">
              Install StreamApp on your device for a faster and better experience.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="w-full md:w-auto shrink-0 self-center md:self-start">
          <button
            onClick={handleInstallClick}
            className="w-full md:w-auto px-6 py-3 bg-[#e50914] hover:bg-red-700 text-white text-sm font-bold uppercase tracking-wider rounded-xl transition-all duration-300 shadow-[0_4px_15px_rgba(229,9,20,0.3)] hover:shadow-[0_4px_20px_rgba(229,9,20,0.5)] active:scale-97 cursor-pointer"
          >
            Download StreamApp
          </button>
        </div>
      </div>

      {/* Fallback Instructions - Only visible after button click when API is unsupported */}
      {showFallback && (
        <div className="mt-6 border-t border-white/5 pt-6 animate-slide-up">
          {isIOS ? (
            <div className="space-y-3">
              <p className="text-xs text-red-400 font-semibold flex items-center gap-1.5">
                <FiAlertCircle className="h-4 w-4 shrink-0" />
                iOS Safari Manual Installation Required
              </p>
              <p className="text-xs text-gray-400 leading-relaxed font-light">
                Safari on iOS does not support direct PWA downloads. Follow these steps to install:
              </p>
              <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col gap-2.5 text-xs text-gray-300 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20 text-red-500 font-bold text-[10px]">1</span>
                  <span className="font-light">Tap the share button <FiShare className="h-3.5 w-3.5 text-sky-400 inline shrink-0" /> at the bottom of Safari.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20 text-red-500 font-bold text-[10px]">2</span>
                  <span className="font-light">Select <strong className="text-white font-semibold">Add to Home Screen</strong> <FiPlusSquare className="h-3.5 w-3.5 text-emerald-400 inline shrink-0" /> from the menu.</span>
                </div>
              </div>
            </div>
          ) : isAndroid ? (
            <div className="space-y-3">
              <p className="text-xs text-red-400 font-semibold flex items-center gap-1.5">
                <FiAlertCircle className="h-4 w-4 shrink-0" />
                Android Chrome Manual Installation Required
              </p>
              <p className="text-xs text-gray-400 leading-relaxed font-light">
                Your browser settings require manual installation. Follow these steps:
              </p>
              <div className="bg-white/5 border border-white/5 rounded-xl p-4 text-xs text-gray-300 max-w-xl leading-relaxed font-light">
                Tap Chrome's options menu <strong className="text-white font-semibold">⋮</strong> in the top-right corner of your browser and select <strong className="text-white font-semibold">"Install app"</strong> or <strong className="text-white font-semibold">"Add to Home screen"</strong>.
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-red-400 font-semibold flex items-center gap-1.5">
                <FiAlertCircle className="h-4 w-4 shrink-0" />
                Manual Installation Recommended
              </p>
              <p className="text-xs text-gray-400 leading-relaxed font-light">
                Direct installation is not supported by your current browser settings. You can still install the app:
              </p>
              <div className="bg-white/5 border border-white/5 rounded-xl p-4 text-xs text-gray-300 max-w-xl leading-relaxed font-light">
                Open your browser's options menu (usually represented by <strong className="text-white font-semibold">⋯</strong> or <strong className="text-white font-semibold">⋮</strong>) and select <strong className="text-white font-semibold">"Install StreamApp"</strong> or <strong className="text-white font-semibold">"Add to Home screen"</strong>.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
