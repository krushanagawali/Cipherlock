import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Shield,
  ShieldAlert,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  History,
  KeyRound,
  Trash2,
  Lock,
  PauseCircle,
  Flame,
  Radio,
  Copy,
  Check,
  Plus,
  RotateCcw,
  UserPlus,
  X,
} from 'lucide-react';
import { SimIdentity, AuditLogEntry } from '../types';

interface AuditViewProps {
  sims: SimIdentity[];
  auditLogs: AuditLogEntry[];
  isLockdownActive: boolean;
  onToggleLockdown: () => void;
  onRevokeSim: (simId: string, simLabel: string) => void;
  onTriggerKillSwitch: () => void;
  onCopyHash: (hashText: string) => void;
  onAddSim: (newSim: SimIdentity) => void;
  onResetToDemoData: () => void;
}

export const AuditView: React.FC<AuditViewProps> = ({
  sims,
  auditLogs,
  isLockdownActive,
  onToggleLockdown,
  onRevokeSim,
  onTriggerKillSwitch,
  onCopyHash,
  onAddSim,
  onResetToDemoData,
}) => {
  const [logFilter, setLogFilter] = useState<'all' | 'success' | 'breach'>('all');
  const [showKillModal, setShowKillModal] = useState(false);
  const [showAddSimModal, setShowAddSimModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // New SIM form state
  const [newPhone, setNewPhone] = useState('+91 ');
  const [newLabel, setNewLabel] = useState('');
  const [newRole, setNewRole] = useState('SecOps Officer');
  const [newDevice, setNewDevice] = useState('Google Pixel 9 Pro • Titan M2');
  const [newCarrier, setNewCarrier] = useState('Jio True 5G eSIM');

  const filteredLogs = auditLogs.filter(log => {
    if (logFilter === 'all') return true;
    if (logFilter === 'success') return log.status === 'success';
    if (logFilter === 'breach') return log.status === 'breach';
    return true;
  });

  const handleCopy = () => {
    onCopyHash('SHA256: 4f8a8924x9102c902b938174aa9128fe39102941');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const confirmKillSwitch = () => {
    setShowKillModal(false);
    onTriggerKillSwitch();
  };

  const handleCreateSimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhone || !newLabel) return;

    const digits = newPhone.replace(/\D/g, '');
    const newSimItem: SimIdentity = {
      id: 'sim-' + Date.now(),
      phoneNumber: newPhone,
      label: newLabel,
      carrier: newCarrier,
      imsiHash: `405854${digits.slice(-9)}00`,
      deviceModel: newDevice,
      role: newRole,
      isOwner: false,
      status: 'active',
      lastAccess: 'Just authorized',
      decryptionsCount: 0,
      enclaveType: 'Hardware Authenticated Security Element',
    };

    onAddSim(newSimItem);
    setShowAddSimModal(false);
    setNewPhone('+91 ');
    setNewLabel('');
  };

  return (
    <div className="flex flex-col space-y-5">
      {/* Document & Enclave Breadcrumb */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center space-x-2 text-slate-500 text-xs font-mono">
          <Shield className="w-4 h-4 text-orange-600" />
          <span className="uppercase tracking-wider font-bold">Zero-Trust Vault</span>
          <span className="text-slate-400">/</span>
          <span className="text-slate-900 font-bold">SecOps-SIM-Enclave</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onResetToDemoData}
            title="Reset to default initial simulation data"
            className="px-2.5 py-1 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-600 hover:text-slate-900 text-xs font-mono font-medium flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3 text-orange-600" />
            <span>Reset Demo</span>
          </button>

          <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-50 border border-slate-300 text-slate-700 text-xs font-mono font-medium">
            <KeyRound className="w-3.5 h-3.5 text-orange-600 mr-1.5" />
            <span>Hardware Rooted</span>
          </div>
        </div>
      </div>

      {/* Security Perimeter Visualizer Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-900">
                SIM Cryptographic Binding Grid
              </span>
              <span className="text-xs text-slate-500 font-mono font-medium">
                eSIM + Physical Enclave handshake active
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 hover:text-slate-900 text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-orange-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? 'Copied' : 'Root Fingerprint'}</span>
            </button>
            <span className="text-xs font-mono font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-orange-600" /> 100% Locked
            </span>
          </div>
        </div>
      </div>

      {/* Authorized SIM Identities */}
      <div className="flex flex-col space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2">
            <Smartphone className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-mono uppercase tracking-wider text-slate-900 font-bold">
              Authorized SIM Identities ({sims.length})
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowAddSimModal(true)}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Authorize New SIM</span>
          </button>
        </div>

        {sims.length === 0 ? (
          <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center flex flex-col items-center justify-center space-y-2 shadow-xs">
            <Smartphone className="w-10 h-10 text-slate-300 stroke-[1.5]" />
            <span className="text-slate-900 font-bold text-sm">No Authorized SIMs Registered</span>
            <p className="text-slate-500 text-xs max-w-sm">
              Authorize a cellular SIM identity to grant hardware-rooted decryption access to sealed assets.
            </p>
            <button
              type="button"
              onClick={() => setShowAddSimModal(true)}
              className="mt-2 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Authorize New SIM</span>
            </button>
          </div>
        ) : (
          sims.map(sim => (
          <div
            key={sim.id}
            id={`sim-card-${sim.id}`}
            className={`rounded-2xl border p-4 sm:p-5 transition-all duration-200 shadow-xs flex flex-col space-y-3 ${
              sim.status === 'revoked'
                ? 'bg-slate-50 border-slate-200 opacity-60'
                : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start space-x-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    sim.isOwner
                      ? 'bg-blue-50 text-blue-600 border border-blue-200'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {sim.isOwner ? <Shield className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
                </div>

                <div className="flex flex-col min-w-0">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className="font-mono font-bold text-slate-900 text-sm sm:text-base truncate">
                      {sim.phoneNumber}
                    </span>
                    {sim.isOwner && (
                      <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                        This Device
                      </span>
                    )}
                    <span className="text-xs text-slate-500 font-medium">({sim.label})</span>
                  </div>

                  <span className="text-xs text-slate-700 mt-0.5 font-medium">Role: {sim.role}</span>
                  <div className="flex items-center space-x-2 mt-1 text-slate-500 text-xs font-mono font-medium">
                    <span>{sim.deviceModel}</span>
                    <span>•</span>
                    <span>{sim.carrier}</span>
                  </div>
                </div>
              </div>

              <div className="shrink-0">
                {sim.status === 'active' ? (
                  <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                    Authorized
                  </span>
                ) : sim.status === 'revoked' ? (
                  <span className="text-xs font-mono font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                    Revoked
                  </span>
                ) : (
                  <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                    Pending
                  </span>
                )}
              </div>
            </div>

            {/* Diagnostic bar */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-mono text-slate-600 font-medium">
              <div className="flex items-center space-x-2">
                <History className="w-3.5 h-3.5 text-blue-600" />
                <span>Last Access: {sim.lastAccess || 'Never'}</span>
              </div>
              <span className="text-slate-900 font-bold">{sim.decryptionsCount} Decryptions</span>
            </div>

            {/* Revoke Action */}
            {!sim.isOwner && sim.status !== 'revoked' && (
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => onRevokeSim(sim.id, `${sim.label} (${sim.phoneNumber})`)}
                  className="px-3.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 hover:text-red-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Revoke SIM Key Authority</span>
                </button>
              </div>
            )}
          </div>
        )))}
      </div>

      {/* Remote Cryptographic Controls Bento */}
      <div className="flex flex-col space-y-3 pt-2">
        <div className="flex items-center space-x-2 px-1">
          <ShieldAlert className="w-4 h-4 text-orange-600" />
          <span className="text-xs font-mono uppercase tracking-wider text-slate-900 font-bold">
            Remote Cryptographic Controls
          </span>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4 shadow-xs">
          {/* Lockdown Switch */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center space-x-3 pr-2">
              <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0">
                <PauseCircle className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-900">Lockdown Mode</span>
                <span className="text-xs text-slate-500 font-medium">
                  Instantly freeze all non-owner external decryption attempts
                </span>
              </div>
            </div>

            <button
              id="lockdown-toggle-btn"
              type="button"
              onClick={onToggleLockdown}
              className={`w-12 h-6 rounded-full transition-colors flex items-center p-0.5 shrink-0 cursor-pointer ${
                isLockdownActive ? 'bg-orange-500' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  isLockdownActive ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {isLockdownActive && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-300 text-red-700 text-xs font-mono font-bold flex items-center space-x-2 animate-pulse">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
              <span>LOCKDOWN ENGAGED: Decryptions suspended across external SIMs.</span>
            </div>
          )}

          {/* Emergency Kill Switch */}
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex flex-col space-y-3">
            <div className="flex items-start space-x-3">
              <Flame className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-red-700 uppercase tracking-wide">
                  Emergency Remote Kill Switch
                </span>
                <span className="text-xs text-slate-700 mt-1 leading-relaxed font-medium">
                  Cryptographically purge distributed keys globally. This causes an irreversible secure-element key burn on all remote nodes.
                </span>
              </div>
            </div>

            <button
              id="emergency-kill-switch-btn"
              type="button"
              onClick={() => setShowKillModal(true)}
              className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-transform cursor-pointer"
            >
              <Flame className="w-4 h-4" />
              <span>Wipe Remote Keys (Instant Self-Destruct)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Forensic Audit Trail */}
      <div className="flex flex-col space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-mono uppercase tracking-wider text-slate-900 font-bold">
              Forensic Real-Time Audit Log
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-600 flex items-center">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1.5" /> Enclave Active
          </span>
        </div>

        {/* Filters for audit logs */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setLogFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-mono cursor-pointer font-bold transition-colors ${
              logFilter === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            All Events ({auditLogs.length})
          </button>
          <button
            onClick={() => setLogFilter('success')}
            className={`px-3 py-1 rounded-lg text-xs font-mono cursor-pointer font-bold transition-colors ${
              logFilter === 'success'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            Authorized
          </button>
          <button
            onClick={() => setLogFilter('breach')}
            className={`px-3 py-1 rounded-lg text-xs font-mono cursor-pointer font-bold transition-colors ${
              logFilter === 'breach'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            Breaches / Blocked
          </button>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 space-y-3 shadow-xs">
          {filteredLogs.length === 0 ? (
            <div className="py-8 text-center flex flex-col items-center justify-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <span className="text-slate-900 font-bold text-sm">No Audit Logs Recorded</span>
              <p className="text-slate-500 text-xs max-w-sm">
                Real-time enclave access events, cryptographic handshakes, and tamper warnings will be logged here with SHA-256 integrity proofs.
              </p>
            </div>
          ) : (
            filteredLogs.map(entry => {
            const isBreach = entry.status === 'breach';
            const isWarning = entry.status === 'warning' || entry.status === 'revoked';

            return (
              <div
                key={entry.id}
                className={`p-3.5 rounded-xl border flex items-start space-x-3 ${
                  isBreach
                    ? 'bg-red-50 border-red-200 text-red-900'
                    : isWarning
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    isBreach
                      ? 'bg-red-100 text-red-600 border border-red-200'
                      : 'bg-blue-100 text-blue-600 border border-blue-200'
                  }`}
                >
                  {isBreach ? <AlertTriangle className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                </div>

                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <span
                      className={`text-xs font-bold font-mono ${
                        isBreach ? 'text-red-700' : 'text-slate-900'
                      }`}
                    >
                      {entry.title}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 font-medium">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <span className="text-xs text-slate-700 mt-1 leading-relaxed font-medium">
                    {entry.details}
                  </span>

                  {entry.enclaveHash && (
                    <div className="mt-1 text-[11px] font-mono text-slate-500 flex items-center gap-2 font-medium">
                      <span>Hash: {entry.enclaveHash}</span>
                      <span>•</span>
                      <span>Gateway: {entry.ipAddress || '127.0.0.1'}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          }))}
        </div>
      </div>

      {/* Add SIM Modal */}
      {showAddSimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 shadow-2xl flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-orange-600" />
                <h3 className="text-base font-bold text-slate-900 font-mono">Authorize New SIM Identity</h3>
              </div>
              <button
                onClick={() => setShowAddSimModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSimSubmit} className="flex flex-col space-y-3.5">
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-mono font-bold text-slate-700">Cellular Phone Number</label>
                <input
                  type="text"
                  required
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono text-xs focus:border-orange-500 outline-none font-bold"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-xs font-mono font-bold text-slate-700">Identity / Holder Label</label>
                <input
                  type="text"
                  required
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  placeholder="e.g. Krushana Gawali (Chief Security Officer)"
                  className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:border-orange-500 outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-mono font-bold text-slate-700">Role</label>
                  <select
                    value={newRole}
                    onChange={e => setNewRole(e.target.value)}
                    className="h-10 px-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs outline-none font-medium"
                  >
                    <option value="SecOps Officer">SecOps Officer</option>
                    <option value="External Auditor">External Auditor</option>
                    <option value="Legal Counsel">Legal Counsel</option>
                    <option value="Executive Reviewer">Executive Reviewer</option>
                  </select>
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-mono font-bold text-slate-700">Carrier Root</label>
                  <select
                    value={newCarrier}
                    onChange={e => setNewCarrier(e.target.value)}
                    className="h-10 px-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs outline-none font-medium"
                  >
                    <option value="Jio True 5G eSIM">Jio True 5G (eSIM)</option>
                    <option value="Airtel 5G Plus SIM">Airtel 5G Plus</option>
                    <option value="Vodafone Idea (Vi) 5G">Vodafone Idea (Vi)</option>
                    <option value="BSNL 4G/5G SIM">BSNL Mobile</option>
                    <option value="Tata Communications IoT">Tata IoT</option>
                    <option value="International eSIM">International eSIM</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-xs font-mono font-bold text-slate-700">Hardware Enclave Target</label>
                <input
                  type="text"
                  value={newDevice}
                  onChange={e => setNewDevice(e.target.value)}
                  className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs outline-none font-medium"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSimModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold font-mono flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Sign &amp; Issue Key Root</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Kill Switch Confirmation Modal */}
      {showKillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white border border-red-300 p-6 shadow-2xl flex flex-col space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 mx-auto">
              <Flame className="w-8 h-8" />
            </div>

            <div className="text-center flex flex-col space-y-1.5">
              <h3 className="text-lg font-bold text-slate-900 font-mono">Revoke All Remote SIM Keys?</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                This triggers a cryptographic burn. All distributed authorized SIMs will immediately and permanently lose decryption capabilities.
              </p>
            </div>

            <div className="flex flex-col space-y-2 pt-2">
              <button
                type="button"
                onClick={confirmKillSwitch}
                className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Flame className="w-4 h-4" />
                <span>Confirm Hardware Burn &amp; Revoke</span>
              </button>
              <button
                type="button"
                onClick={() => setShowKillModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono font-bold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

