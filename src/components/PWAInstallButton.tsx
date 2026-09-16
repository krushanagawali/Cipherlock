import React, { useState } from 'react';
import { Download, Smartphone, X, Check, Apple } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'full' | 'banner';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'compact', className = '' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showGeneralGuide, setShowGeneralGuide] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  // If already installed in standalone mode, hide
  if (isInstalled && !justInstalled) {
    return null;
  }

  const handleInstall = async () => {
    const success = await install();
    if (success) {
      setJustInstalled(true);
      setTimeout(() => setJustInstalled(false), 3000);
    }
  };

  if (justInstalled) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
        <Check className="w-3.5 h-3.5 text-emerald-600" />
        <span>Installed Successfully</span>
      </div>
    );
  }

  // Chromium / Android / Desktop browser installable flow
  if (isInstallable) {
    if (variant === 'banner') {
      return (
        <div className="flex items-center justify-between p-3.5 bg-blue-50/90 border border-blue-200 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Install CipherLock on this Device</p>
              <p className="text-[11px] text-slate-600">Run as a standalone native app with offline zero-trust encryption.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleInstall}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            Download / Install
          </button>
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={handleInstall}
        title="Download and install CipherLock as a native application"
        className={`inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0 ${className}`}
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Download App</span>
        <span className="sm:hidden">Install</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          title="Install on iPhone or iPad home screen"
          className={`inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-medium cursor-pointer transition-colors shrink-0 ${className}`}
        >
          <Apple className="w-3.5 h-3.5 text-slate-700" />
          <span className="hidden sm:inline">Install on iOS</span>
          <span className="sm:hidden">Install</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Install on iPhone / iPad</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                  <p>In Safari, tap the <strong className="text-slate-900">Share</strong> icon in the toolbar (square with upward arrow).</p>
                </div>
                <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                  <p>Scroll down and select <strong className="text-slate-900">Add to Home Screen</strong>.</p>
                </div>
                <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                  <p>Tap <strong className="text-slate-900">Add</strong> at the top right. The app will launch in standalone hardware enclave mode!</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-slate-900 hover:bg-slate-800 text-white py-2 text-xs font-semibold transition cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback / standard browser download helper
  return (
    <>
      <button
        type="button"
        onClick={() => setShowGeneralGuide(true)}
        title="Download and install CipherLock on your device"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-medium cursor-pointer transition-colors ${className}`}
      >
        <Download className="w-3.5 h-3.5 text-blue-600" />
        <span className="hidden sm:inline">Install App</span>
      </button>

      {showGeneralGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <Download className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Install CipherLock</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGeneralGuide(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                <p>On Chrome/Edge/Brave: Click the <strong className="text-slate-900">Install App</strong> icon in your browser address bar.</p>
              </div>
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                <p>On Android Mobile: Tap the 3 dots menu and select <strong className="text-slate-900">Add to Home screen</strong> or <strong className="text-slate-900">Install app</strong>.</p>
              </div>
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                <p>CipherLock will run in isolated standalone hardware enclave mode with full offline support.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowGeneralGuide(false)}
              className="mt-5 w-full rounded-xl bg-slate-900 hover:bg-slate-800 text-white py-2 text-xs font-semibold transition cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};
