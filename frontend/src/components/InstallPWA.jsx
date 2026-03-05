import { useState, useEffect } from 'react';
import { X, Smartphone, Download } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const InstallPWA = () => {
  const { theme } = useTheme();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
                               window.navigator.standalone ||
                               document.referrer.includes('android-app://');
    
    setIsStandalone(isInStandaloneMode);

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIOSDevice);

    // Listen for beforeinstallprompt event (Android/Desktop)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Show install prompt after 10 seconds or on user action
      setTimeout(() => {
        const hasSeenPrompt = localStorage.getItem('pwa-install-prompt-seen');
        if (!hasSeenPrompt && !isInStandaloneMode) {
          setShowInstallPrompt(true);
        }
      }, 10000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      localStorage.setItem('pwa-install-prompt-seen', 'true');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Show iOS instructions if on iOS
      if (isIOS) {
        setShowInstallPrompt(true);
        return;
      }
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    
    if (outcome === 'accepted') {
      localStorage.setItem('pwa-install-prompt-seen', 'true');
      setShowInstallPrompt(false);
    }
    
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-prompt-seen', 'true');
    localStorage.setItem('pwa-install-prompt-dismissed-at', Date.now().toString());
  };

  // Don't show prompt if already installed
  if (isStandalone) {
    return null;
  }

  // iOS Install Instructions
  if (showInstallPrompt && isIOS) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto">
        <div className={`${theme === 'dark' ? 'bg-[#1c2027] border-[#282f39]' : 'bg-white border-gray-200'} border rounded-lg shadow-2xl p-4`}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Smartphone className="text-blue-500" size={20} />
              <h3 className={`font-bold text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Install TaskFlow App
              </h3>
            </div>
            <button onClick={handleDismiss} className={`${theme === 'dark' ? 'text-[#9da8b9] hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
              <X size={18} />
            </button>
          </div>
          <p className={`text-sm ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} mb-3`}>
            To install this app on your iPhone/iPad:
          </p>
          <ol className={`text-xs ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} space-y-2 ml-4 list-decimal`}>
            <li>Tap the <strong>Share</strong> button <span className="inline-block bg-blue-500 text-white rounded px-1">↑</span> in Safari</li>
            <li>Scroll and tap <strong>"Add to Home Screen"</strong></li>
            <li>Tap <strong>Add</strong> to confirm</li>
          </ol>
        </div>
      </div>
    );
  }

  // Android/Desktop Install Prompt
  if (showInstallPrompt && deferredPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto">
        <div className={`${theme === 'dark' ? 'bg-[#1c2027] border-[#282f39]' : 'bg-white border-gray-200'} border rounded-lg shadow-2xl p-4`}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Smartphone className="text-blue-500" size={20} />
              <h3 className={`font-bold text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Install TaskFlow App
              </h3>
            </div>
            <button onClick={handleDismiss} className={`${theme === 'dark' ? 'text-[#9da8b9] hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
              <X size={18} />
            </button>
          </div>
          <p className={`text-sm ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} mb-4`}>
            Install our app for a better experience! Works offline, faster, and feels like a native app.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleInstallClick}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors"
            >
              <Download size={16} />
              Install Now
            </button>
            <button
              onClick={handleDismiss}
              className={`px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                theme === 'dark'
                  ? 'bg-[#282f39] text-[#9da8b9] hover:bg-[#363d4a]'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Not Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show an install button in the header/menu for manual trigger
  return null;
};

export default InstallPWA;
