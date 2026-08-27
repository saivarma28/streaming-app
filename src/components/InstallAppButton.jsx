import React, { useState, useEffect } from 'react';
import { FiDownload, FiShare, FiPlusSquare, FiInfo } from 'react-icons/fi';

export default function InstallAppButton({ className = "" }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if the app is already running in standalone mode (installed)
    const checkStandalone = () => {
      const isStandaloneMode = 
        window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone ||
        document.referrer.includes('android-app://');
      setIsStandalone(!!isStandaloneMode);
    };

    checkStandalone();

    // Check device operating systems
    const ua = window.navigator.userAgent.toLowerCase();
    const isMobileAndroid = /android/.test(ua);
    const isAppleiOS = /iphone|ipad|ipod/.test(ua);
    
    setIsAndroid(isMobileAndroid);
    setIsIOS(isAppleiOS);

    // Capture the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log('[PWA] beforeinstallprompt event captured in InstallAppButton.');
    };

    // Detect when the app is successfully installed
    const handleAppInstalled = () => {
      console.log('[PWA] App was installed successfully.');
      setIsStandalone(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the native PWA install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] Install prompt outcome: ${outcome}`);

    // Clear the deferred prompt, as it can only be used once
    setDeferredPrompt(null);
  };

  // If already installed and running standalone, do not show anything
  if (isStandalone) {
    return null;
  }

  // Case 1: Browser supports native PWA installation and prompt event is ready
  if (deferredPrompt) {
    return (
      <div className={`w-full ${className}`}>
        <button
          onClick={handleInstallClick}
          className="w-full flex items-center justify-center gap-2.5 py-3 px-5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-xl border border-red-500/20 transition-all duration-300 shadow-[0_4px_15px_rgba(229,9,20,0.3)] active:scale-98 cursor-pointer text-sm sm:text-base tracking-wide"
        >
          <FiDownload className="h-5 w-5 animate-bounce" />
          📱 Download StreamApp
        </button>
      </div>
    );
  }

  // Case 2: No native prompt available, but the user is on an Android device
  if (isAndroid) {
    return (
      <div className={`w-full p-4 rounded-xl bg-red-500/5 border border-red-500/10 text-left ${className}`}>
        <div className="flex gap-2.5 items-start">
          <FiInfo className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-gray-200 uppercase tracking-wider mb-1">Install StreamApp</p>
            <p className="text-xs text-gray-400 font-light leading-relaxed">
              Tap the Chrome menu <strong className="text-white font-semibold">⋮</strong> in the top-right corner of your browser and select <strong className="text-white font-semibold">"Install app"</strong> or <strong className="text-white font-semibold">"Add to Home screen"</strong>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Case 3: No native prompt available, but the user is on an iOS device (iPhone/iPad)
  if (isIOS) {
    return (
      <div className={`w-full p-4 rounded-xl bg-red-500/5 border border-red-500/10 text-left ${className}`}>
        <div className="flex gap-2.5 items-start">
          <FiDownload className="h-5 w-5 text-[#e50914] shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-gray-200 uppercase tracking-wider mb-1.5">Install on iPhone / iPad</p>
            <p className="text-xs text-gray-400 font-light leading-relaxed mb-3">
              Add StreamApp to your Home Screen using Safari:
            </p>
            <div className="space-y-2 text-[11px] text-gray-300 font-light">
              <div className="flex items-center gap-2">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20 text-red-500 font-bold text-[9px]">1</span>
                <span>Tap the Share button <FiShare className="h-3.5 w-3.5 text-sky-400 inline shrink-0" /> in Safari.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20 text-red-500 font-bold text-[9px]">2</span>
                <span>Select <strong className="text-white font-medium">Add to Home Screen</strong> <FiPlusSquare className="h-3.5 w-3.5 text-emerald-400 inline shrink-0" />.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Case 4: Unsupported desktop/mobile browsers without native prompt support - hide gracefully
  return null;
}
