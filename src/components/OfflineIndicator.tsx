import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-slate-900/95 backdrop-blur-md border border-amber-500/40 px-3.5 py-2 text-xs font-medium text-white shadow-lg animate-fade-in">
      <WifiOff className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
      <div className="flex items-center gap-1.5">
        <span className="font-semibold text-amber-300">Offline Vault Active:</span>
        <span className="text-slate-300">Titan M2 local cryptographic operations remain fully functional.</span>
      </div>
    </div>
  );
};
