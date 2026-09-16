import React, { useState } from 'react';
import {
  Shield,
  ShieldAlert,
  Cpu,
  User,
  Volume2,
  VolumeX,
  Smartphone,
  ChevronDown,
  Cloud,
  LogIn,
  LogOut,
  Search,
  KeyRound,
  Atom,
  Sparkles,
  Plus,
  X,
  Check,
} from 'lucide-react';
import { TabType, SimIdentity } from '../types';
import { User as FirebaseUser } from '../services/firebase';
import { PWAInstallButton } from './PWAInstallButton';
import { areSimNumbersMatching } from '../utils/crypto';

interface HeaderProps {
  currentTab: TabType;
  isLockdownActive: boolean;
  activeSimNumber: string;
  onSelectActiveSim: (sim: string) => void;
  availableSims: SimIdentity[];
  audioEnabled: boolean;
  onToggleAudio: () => void;
  breachCount: number;
  currentUser: FirebaseUser | null;
  onSignIn: () => void;
  onSignOut: () => void;
  isSyncing: boolean;
  onOpenCommandPalette: () => void;
  onOpenZkProofModal?: () => void;
  onOpenShamirModal?: () => void;
  onAddSim?: (sim: SimIdentity) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  isLockdownActive,
  activeSimNumber,
  onSelectActiveSim,
  availableSims,
  audioEnabled,
  onToggleAudio,
  breachCount,
  currentUser,
  onSignIn,
  onSignOut,
  isSyncing,
  onOpenCommandPalette,
  onOpenZkProofModal,
  onOpenShamirModal,
  onAddSim,
}) => {
  const [showAddSimModal, setShowAddSimModal] = useState(false);
  const [newSimNumber, setNewSimNumber] = useState('+91 ');
  const [newSimLabel, setNewSimLabel] = useState('My Phone (SIM 1)');
  const [newSimCarrier, setNewSimCarrier] = useState('Jio True 5G');

  const handleRegisterRealSim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSimNumber.trim() || !onAddSim) return;
    const cleanNum = newSimNumber.trim();
    const newSim: SimIdentity = {
      id: 'sim-' + Date.now(),
      phoneNumber: cleanNum,
      label: newSimLabel.trim() || 'My Personal SIM',
      carrier: newSimCarrier.trim() || 'Local Carrier',
      imsiHash: 'imsi-' + Math.random().toString(36).substring(2, 10),
      deviceModel: 'Hardware Enclave',
      role: 'Custodian Node',
      isOwner: true,
      status: 'active',
      decryptionsCount: 0,
      enclaveType: 'Titan M2 / Secure Enclave',
    };
    onAddSim(newSim);
    onSelectActiveSim(cleanNum);
    setShowAddSimModal(false);
  };
  const getTabSubtitle = () => {
    switch (currentTab) {
      case 'vault':
        return 'Sovereign Enclave Vault';
      case 'shield':
        return 'PQC Encapsulation Protocol';
      case 'verify':
        return 'SIM Challenge & Decrypt';
      case 'audit':
        return 'Fleet Attestation & Logs';
      case 'command_center':
        return 'AI Threat Command Center';
      default:
        return 'Sovereign Vault';
    }
  };

  const simulationSims = availableSims.map(s => ({
    number: s.phoneNumber,
    label: s.label,
    trusted: s.status === 'active',
  }));

  const currentSimInfo = simulationSims.find(s => areSimNumbersMatching(s.number, activeSimNumber)) || {
    number: activeSimNumber,
    label: 'Device SIM',
    trusted: true,
  };

  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <div className="max-w-7xl mx-auto h-16 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0">
          <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600 text-white shadow-[0_2px_8px_rgba(26,115,232,0.25)] shrink-0">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-white stroke-[2.2]" />
            {/* Google 4-color micro-badge indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 flex gap-0.5 p-0.5 rounded-full bg-white shadow-xs border border-slate-100">
              <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-[#4285F4]" />
              <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-[#EA4335]" />
              <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-[#FBBC05]" />
              <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-[#34A853]" />
            </div>
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-slate-900 font-bold text-base sm:text-lg tracking-tight leading-none font-sans">
                CipherLock
              </span>
              <span className="px-1.5 py-0.2 sm:py-0.5 rounded text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                Titan M2
              </span>
            </div>
            <span className="hidden sm:block text-slate-500 text-xs font-medium tracking-wide truncate mt-0.5">
              {getTabSubtitle()}
            </span>
          </div>
        </div>

        {/* Center: Google-Style Search & Command Bar */}
        <div className="hidden lg:flex flex-1 max-w-md mx-2">
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-150 border border-slate-200/80 text-slate-500 hover:text-slate-700 transition-all text-xs font-medium cursor-pointer shadow-xs group"
          >
            <div className="flex items-center gap-2.5 truncate">
              <Search className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform shrink-0" />
              <span className="truncate">Search capsules, commands, or audit trail...</span>
            </div>
            <kbd className="inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-500 bg-white rounded border border-slate-200 shadow-2xs shrink-0">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Status Indicators & Real SIM Controller */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Quick ZKP trigger button */}
          {onOpenZkProofModal && (
            <button
              type="button"
              onClick={onOpenZkProofModal}
              title="Zero-Knowledge Proof of SIM Possession"
              className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-medium cursor-pointer transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
              <span>zk-SIM</span>
            </button>
          )}

          {/* Quick Shamir Quorum recovery trigger */}
          {onOpenShamirModal && (
            <button
              type="button"
              onClick={onOpenShamirModal}
              title="Shamir M-of-N Quorum Disaster Recovery"
              className="hidden 2xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 text-xs font-medium cursor-pointer transition-colors"
            >
              <Atom className="w-3.5 h-3.5 text-purple-600" />
              <span>M-of-N Quorum</span>
            </button>
          )}

          {/* Mobile search trigger */}
          <button
            type="button"
            onClick={onOpenCommandPalette}
            title="Search and Commands (⌘K)"
            className="lg:hidden p-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 cursor-pointer"
          >
            <Search className="w-4 h-4 text-blue-600" />
          </button>

          {/* Audio toggle button */}
          <button
            type="button"
            onClick={onToggleAudio}
            title={audioEnabled ? 'Sound Effects Enabled (Click to Mute)' : 'Sound Effects Muted (Click to Enable)'}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
          >
            {audioEnabled ? <Volume2 className="w-4 h-4 text-blue-600" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Lockdown Indicator if Active */}
          {isLockdownActive && (
            <div className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full bg-red-50 border border-red-300 text-red-700 text-[11px] sm:text-xs font-semibold animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5 text-red-600 shrink-0" />
              <span className="hidden sm:inline">LOCKDOWN</span>
            </div>
          )}

          {/* SIM Bound Status Dropdown & Add Real SIM */}
          <div className="relative flex items-center gap-1">
            {/* Desktop dropdown */}
            <div
              className={`hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono transition-colors ${
                currentSimInfo.trusted
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                  : 'bg-red-50 border-red-300 text-red-700 animate-pulse'
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    currentSimInfo.trusted ? 'bg-blue-400' : 'bg-red-500'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    currentSimInfo.trusted ? 'bg-blue-600' : 'bg-red-600'
                  }`}
                />
              </span>
              <span className="text-slate-500 font-medium">SIM:</span>
              <select
                id="active-sim-select"
                value={activeSimNumber}
                onChange={e => {
                  if (e.target.value === '__add_custom__') {
                    setShowAddSimModal(true);
                  } else {
                    onSelectActiveSim(e.target.value);
                  }
                }}
                className="bg-transparent text-slate-900 font-bold outline-none cursor-pointer pr-4 appearance-none max-w-[180px] truncate"
              >
                {simulationSims.map((s, idx) => (
                  <option key={idx} value={s.number} className="bg-white text-slate-900">
                    {s.number} ({s.label})
                  </option>
                ))}
                {onAddSim && (
                  <option value="__add_custom__" className="bg-white text-blue-600 font-bold">
                    + Register Real SIM / Phone...
                  </option>
                )}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 -ml-3 pointer-events-none" />
            </div>

            {/* Mobile compact SIM button */}
            <button
              type="button"
              onClick={() => setShowAddSimModal(true)}
              title={`Active SIM: ${activeSimNumber}. Tap to register or switch.`}
              className="md:hidden flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-mono font-bold cursor-pointer"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
              </span>
              <Smartphone className="w-3.5 h-3.5 text-blue-600" />
              <span className="max-w-[85px] truncate text-[11px] font-mono">{activeSimNumber}</span>
            </button>

            {onAddSim && (
              <button
                type="button"
                onClick={() => setShowAddSimModal(true)}
                title="Register your real phone number as an authorized SIM anchor"
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-600 border border-slate-300 hidden md:flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* PWA In-App Install Button */}
          <PWAInstallButton />

          {/* Firebase Cloud Sync Status & Google Auth */}
          {currentUser ? (
            <div className="flex items-center gap-1 sm:gap-2">
              <div
                title={`Connected to Firebase Firestore: ${currentUser.email || currentUser.uid}`}
                className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium"
              >
                <Cloud className={`w-3.5 h-3.5 text-emerald-600 ${isSyncing ? 'animate-bounce' : ''}`} />
                <span className="font-mono">Firestore</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </div>
              <button
                type="button"
                onClick={onSignOut}
                title={`Signed in as ${currentUser.email || 'User'}. Click to Sign Out.`}
                className="flex items-center gap-1.5 py-1.5 px-2 sm:px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-medium cursor-pointer transition-colors"
              >
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt="User"
                    className="w-4 h-4 rounded-full"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <User className="w-3.5 h-3.5 text-slate-600" />
                )}
                <span className="max-w-[80px] truncate hidden lg:inline">
                  {currentUser.displayName || currentUser.email?.split('@')[0] || 'Account'}
                </span>
                <LogOut className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onSignIn}
              title="Sign in with Google / Firebase"
              className="flex items-center gap-1.5 py-1.5 px-2 sm:px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors shrink-0"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Google Sign-in</span>
              <span className="sm:hidden">Sync</span>
            </button>
          )}
        </div>
      </div>

      {/* Real SIM Registration Modal */}
      {showAddSimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Register Real SIM Anchor</h3>
                  <p className="text-[11px] text-slate-500 font-mono">Hardware Enclave eSIM / Physical SIM Binding</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddSimModal(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterRealSim} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-slate-700 mb-1">
                  Mobile Number (with country code)
                </label>
                <input
                  type="text"
                  required
                  value={newSimNumber}
                  onChange={e => setNewSimNumber(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 font-mono text-sm text-slate-900 focus:outline-none focus:border-blue-500 font-bold"
                  autoFocus
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Example: +91 98201 54321 or +91 97110 89234
                </span>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-700 mb-1">Device / SIM Label</label>
                <input
                  type="text"
                  value={newSimLabel}
                  onChange={e => setNewSimLabel(e.target.value)}
                  placeholder="Primary Jio SIM / Phone 1"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 font-mono text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-700 mb-1">Carrier Network</label>
                <input
                  type="text"
                  value={newSimCarrier}
                  onChange={e => setNewSimCarrier(e.target.value)}
                  placeholder="Jio True 5G / Airtel 5G Plus / Vi / BSNL"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 font-mono text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddSimModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Anchor &amp; Select SIM</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};

