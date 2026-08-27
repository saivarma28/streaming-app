import { useState, useEffect } from 'react';

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isSafari, setIsSafari] = useState(false);

  useEffect(() => {
    // Check if the app is running in standalone mode (already installed)
    const checkStandalone = () => {
      const isStandaloneMode = 
        window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone || 
        document.referrer.includes('android-app://');
      setIsStandalone(!!isStandaloneMode);
    };

    checkStandalone();

    // Detect user agent properties
    const ua = window.navigator.userAgent.toLowerCase();
    const isAppleiOS = /iphone|ipad|ipod/.test(ua);
    const isAppleSafari = isAppleiOS && !/crios|fxios|opios|twitter|fbios|edgios/.test(ua) && /safari/.test(ua);

    setIsIOS(isAppleiOS);
    setIsSafari(isAppleSafari);

    // Listen for beforeinstallprompt event (Android / Chromium desktop)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      // Store the event so it can be triggered later
      setDeferredPrompt(e);
      setCanInstall(true);
      console.log('[PWA] beforeinstallprompt event fired and captured.');
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      console.log('[PWA] App installed successfully.');
      setDeferredPrompt(null);
      setCanInstall(false);
      setIsStandalone(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) {
      console.warn('[PWA] No installation prompt deferred.');
      return false;
    }

    // Show the installation prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] User choice outcome: ${outcome}`);

    // We've used the prompt, and cannot use it again
    setDeferredPrompt(null);
    setCanInstall(false);

    return outcome === 'accepted';
  };

  return {
    canInstall,
    isStandalone,
    isIOS,
    isSafari,
    promptInstall
  };
}
