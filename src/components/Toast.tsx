import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export interface ToastMessage {
  id: string;
  text: string;
  type?: 'success' | 'error' | 'info';
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-22 md:bottom-8 right-4 left-4 sm:left-auto sm:right-8 z-50 flex flex-col space-y-2 pointer-events-none">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 3200);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const isError = toast.type === 'error';
  const isInfo = toast.type === 'info';

  return (
    <div
      className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-md transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 ${
        isError
          ? 'bg-red-50/95 border-red-300 text-red-900 shadow-red-500/10'
          : isInfo
          ? 'bg-sky-50/95 border-sky-300 text-sky-950 shadow-sky-500/10'
          : 'bg-white/95 border-orange-300 text-slate-900 shadow-orange-500/10'
      }`}
    >
      {isError ? (
        <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
      ) : isInfo ? (
        <Info className="w-4 h-4 text-sky-600 shrink-0" />
      ) : (
        <CheckCircle2 className="w-4 h-4 text-orange-600 shrink-0" />
      )}
      <span className="text-xs font-mono font-bold leading-snug">{toast.text}</span>
    </div>
  );
};
