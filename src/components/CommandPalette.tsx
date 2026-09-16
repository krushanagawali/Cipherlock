import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Shield,
  Sparkles,
  Smartphone,
  FileSpreadsheet,
  ShieldAlert,
  Lock,
  Atom,
  KeyRound,
  FileText,
  Terminal,
  Download,
  CheckCircle2,
  X,
  Sliders,
  ChevronRight,
} from 'lucide-react';
import { TabType, VaultDocument, SimIdentity } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: TabType) => void;
  documents: VaultDocument[];
  sims: SimIdentity[];
  activeSimNumber: string;
  onSelectSim: (simNumber: string) => void;
  onSelectDoc: (doc: VaultDocument) => void;
  onTriggerAudit: () => void;
  onToggleLockdown: () => void;
  isLockdownActive: boolean;
  onOpenZkProofModal: () => void;
  onOpenShamirModal: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  documents,
  sims,
  activeSimNumber,
  onSelectSim,
  onSelectDoc,
  onTriggerAudit,
  onToggleLockdown,
  isLockdownActive,
  onOpenZkProofModal,
  onOpenShamirModal,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Trigger open in parent
        }
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredDocs = documents.filter(
    d =>
      d.name.toLowerCase().includes(query.toLowerCase()) ||
      d.algorithm.toLowerCase().includes(query.toLowerCase()) ||
      d.boundSim.includes(query)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-14 sm:pt-24 px-2 sm:px-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Google Style Search Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 gap-3 bg-white">
          <Search className="w-5 h-5 text-blue-600 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search capsules, commands, or SIM identities..."
            className="w-full text-sm sm:text-base text-slate-900 placeholder:text-slate-400 bg-transparent outline-none font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-mono font-semibold text-slate-500 bg-slate-100 rounded border border-slate-200">
            ESC
          </kbd>
        </div>

        {/* Scrollable Command & Result List */}
        <div className="overflow-y-auto p-2 space-y-4 divide-y divide-slate-100">
          {/* Quick Actions Group */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 block pt-1">
              Command Actions
            </span>

            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigate('command_center');
                onTriggerAudit();
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-blue-50/70 text-slate-700 hover:text-blue-700 transition-colors text-left text-sm cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold block text-slate-900 group-hover:text-blue-700">
                    Run Gemini AI Threat Audit
                  </span>
                  <span className="text-xs text-slate-500">
                    Real-time NIST SP 800-56C & quantum readiness evaluation
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenZkProofModal();
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-emerald-50/70 text-slate-700 hover:text-emerald-700 transition-colors text-left text-sm cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold block text-slate-900 group-hover:text-emerald-700">
                    Verify Zero-Knowledge Proof (zk-SIM)
                  </span>
                  <span className="text-xs text-slate-500">
                    Prove possession of private SIM IMSI without disclosing secret
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenShamirModal();
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-purple-50/70 text-slate-700 hover:text-purple-700 transition-colors text-left text-sm cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Atom className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold block text-slate-900 group-hover:text-purple-700">
                    Shamir M-of-N Quorum Recovery
                  </span>
                  <span className="text-xs text-slate-500">
                    Split master enclave key into threshold disaster recovery shares
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600" />
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onToggleLockdown();
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-red-50 text-slate-700 hover:text-red-700 transition-colors text-left text-sm cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold block text-slate-900 group-hover:text-red-700">
                    {isLockdownActive ? 'Lift Emergency Lockdown' : 'Trigger Emergency Lockdown'}
                  </span>
                  <span className="text-xs text-slate-500">
                    {isLockdownActive ? 'Restore normal enclave decryption operations' : 'Instantly freeze all decryption challenges'}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-100 text-red-700">
                {isLockdownActive ? 'ACTIVE' : 'READY'}
              </span>
            </button>
          </div>

          {/* Navigation Shortcuts */}
          <div className="pt-2 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 block">
              Workspace Views
            </span>
            <div className="grid grid-cols-2 gap-1 px-1">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigate('vault');
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 text-xs font-semibold text-left cursor-pointer"
              >
                <Shield className="w-4 h-4 text-blue-600" />
                <span>Encrypted Vault ({documents.length})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigate('shield');
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 text-xs font-semibold text-left cursor-pointer"
              >
                <Lock className="w-4 h-4 text-orange-600" />
                <span>Shield New File</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigate('verify');
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 text-xs font-semibold text-left cursor-pointer"
              >
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span>SIM Challenge & Decrypt</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigate('audit');
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 text-xs font-semibold text-left cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-purple-600" />
                <span>Access Logs & Fleet</span>
              </button>
            </div>
          </div>

          {/* Matching Sealed Capsules */}
          {filteredDocs.length > 0 && (
            <div className="pt-2 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 block">
                Vault Capsules ({filteredDocs.length})
              </span>
              <div className="space-y-0.5">
                {filteredDocs.slice(0, 4).map(doc => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => {
                      onClose();
                      onSelectDoc(doc);
                      onNavigate('verify');
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-100 text-left text-xs cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-4 h-4 text-slate-500 group-hover:text-blue-600 shrink-0" />
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-900 block truncate">
                          {doc.name}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          Bound: {doc.boundSim} • {doc.algorithm}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-blue-600 group-hover:underline shrink-0">
                      Decrypt →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Titan M2 Secure Enclave Ready</span>
          </div>
          <span>Google Workspace / Cloud Security Integration</span>
        </div>
      </div>
    </div>
  );
};
