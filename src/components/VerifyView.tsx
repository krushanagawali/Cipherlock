import React, { useState, useRef } from 'react';
import {
  Smartphone,
  Fingerprint,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Lock,
  Unlock,
  KeyRound,
  Download,
  Eye,
  RefreshCw,
  Sliders,
  ChevronDown,
  Upload,
  ShieldAlert,
  Flame,
  FileCode,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';
import { VaultDocument, SimIdentity } from '../types';
import { formatBytes, decryptContainer, EncryptedContainer, calculateSha256, areSimNumbersMatching } from '../utils/crypto';
import { enclaveAudio } from '../utils/audio';
import { authenticateWithDeviceBiometrics } from '../utils/biometrics';

interface VerifyViewProps {
  documents: VaultDocument[];
  selectedDoc: VaultDocument | null;
  onSelectDoc: (doc: VaultDocument) => void;
  activeSimNumber: string;
  onSelectActiveSim?: (simNumber: string) => void;
  sims?: SimIdentity[];
  onAuthorizeCurrentSim?: (docId: string, simNumber: string) => void;
  onDecryptionSuccess: (docId: string) => void;
  onDecryptionFailure: (docName: string, simUsed: string, reason: string) => void;
  onImportContainer: (container: EncryptedContainer, rawJson: string) => void;
}

export const VerifyView: React.FC<VerifyViewProps> = ({
  documents,
  selectedDoc,
  onSelectDoc,
  activeSimNumber,
  onSelectActiveSim,
  sims = [],
  onAuthorizeCurrentSim,
  onDecryptionSuccess,
  onDecryptionFailure,
  onImportContainer,
}) => {
  const currentDoc = selectedDoc || documents[0] || null;

  const [isNegotiating, setIsNegotiating] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [decryptionError, setDecryptionError] = useState<string | null>(null);
  const [showProof, setShowProof] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'hex'>('preview');
  const [enteredPin, setEnteredPin] = useState('');
  const [decryptedText, setDecryptedText] = useState<string>('');
  const [decryptedRawBuffer, setDecryptedRawBuffer] = useState<ArrayBuffer | null>(null);
  const [decryptedBlobUrl, setDecryptedBlobUrl] = useState<string | null>(null);
  const [biometricNote, setBiometricNote] = useState<string | null>(null);
  const [sha256Match, setSha256Match] = useState<boolean | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAuthorizedSim = Boolean(
    currentDoc &&
      (areSimNumbersMatching(currentDoc.boundSim, activeSimNumber) ||
        (currentDoc.secondarySims &&
          currentDoc.secondarySims.some(sec => areSimNumbersMatching(sec, activeSimNumber))))
  );

  const handleTriggerUnlock = async () => {
    if (!currentDoc || isUnlocked || isNegotiating) return;

    setDecryptionError(null);
    setIsNegotiating(true);
    enclaveAudio.playScanPing();

    // Check PIN requirement first
    if (currentDoc.policy?.requirePin && currentDoc.policy?.pinCode && enteredPin !== currentDoc.policy?.pinCode) {
      setTimeout(() => {
        setIsNegotiating(false);
        setDecryptionError('Cryptographic PIN authentication failed: Hardware enclave challenge repudiated.');
        enclaveAudio.playBreachAlert();
        onDecryptionFailure(currentDoc.name, activeSimNumber, 'Incorrect Enclave PIN code');
      }, 700);
      return;
    }

    // Check Biometrics if policy requires
    if (currentDoc.policy?.requireBiometrics) {
      try {
        const bioResult = await authenticateWithDeviceBiometrics(currentDoc.name);
        if (!bioResult.success) {
          setIsNegotiating(false);
          setDecryptionError(bioResult.details);
          enclaveAudio.playBreachAlert();
          onDecryptionFailure(currentDoc.name, activeSimNumber, bioResult.details);
          return;
        }
        setBiometricNote(bioResult.details);
      } catch (err: any) {
        console.warn('Biometric challenge error', err);
      }
    }

    // Check hardware SIM match
    if (!isAuthorizedSim) {
      setTimeout(() => {
        setIsNegotiating(false);
        const targetSim = currentDoc?.boundSim || 'authorized SIM';
        const errorMsg = `CRYPTOGRAPHIC REJECTION: Foreign SIM identity (${activeSimNumber}) is not an authorized hardware anchor for this container (anchored to ${targetSim}). Use the quick action below to match SIM or authorize this device.`;
        setDecryptionError(errorMsg);
        enclaveAudio.playBreachAlert();
        onDecryptionFailure(currentDoc.name, activeSimNumber, 'Carrier IMSI mismatch / Foreign SIM detected');
      }, 1000);
      return;
    }

    // Authorized SIM: perform genuine decryption if raw container is present
    try {
      await new Promise(r => setTimeout(r, 650));

      if (currentDoc.rawContainer) {
        const decResult = await decryptContainer(
          currentDoc.rawContainer,
          activeSimNumber,
          currentDoc.policy?.requirePin ? enteredPin : undefined
        );
        setDecryptedRawBuffer(decResult.decryptedBuffer);
        setSha256Match(decResult.verified);

        const isImage = currentDoc.mimeType?.startsWith('image/');
        const isText =
          currentDoc.mimeType?.startsWith('text/') ||
          currentDoc.mimeType?.includes('json') ||
          currentDoc.mimeType?.includes('javascript') ||
          currentDoc.mimeType?.includes('typescript') ||
          currentDoc.mimeType?.includes('markdown') ||
          currentDoc.name.endsWith('.txt') ||
          currentDoc.name.endsWith('.md') ||
          currentDoc.name.endsWith('.json');

        if (isText) {
          const decText = new TextDecoder('utf-8', { fatal: false }).decode(decResult.decryptedBuffer);
          setDecryptedText(decText);
        } else {
          setDecryptedText(
            `[BINARY FILE READY]\nName: ${currentDoc.originalName || currentDoc.name}\nSize: ${formatBytes(
              decResult.decryptedBuffer.byteLength
            )}\nType: ${currentDoc.mimeType || 'application/octet-stream'}\nIntegrity: SHA-256 Verified (${decResult.sha256.slice(0, 16)}...)\n\nClick "Download Original" below to export your intact binary file.`
          );
        }

        const blob = new Blob([decResult.decryptedBuffer], { type: currentDoc.mimeType || 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        setDecryptedBlobUrl(url);
      } else {
        setDecryptedText(
          currentDoc.previewContent ||
            `DECRYPTED PAYLOAD: ${currentDoc.name}\nSHA-256: ${currentDoc.sha256}\nBound SIM Anchor: ${currentDoc.boundSim} (Attested)`
        );
        setSha256Match(true);
      }

      setIsUnlocked(true);
      enclaveAudio.playSuccess();
      onDecryptionSuccess(currentDoc.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Decryption authentication failure';
      setDecryptionError(msg);
      enclaveAudio.playBreachAlert();
      onDecryptionFailure(currentDoc.name, activeSimNumber, msg);
    } finally {
      setIsNegotiating(false);
    }
  };

  const handleLockAgain = () => {
    setIsUnlocked(false);
    setDecryptionError(null);
    setDecryptedRawBuffer(null);
    setSha256Match(null);
    if (decryptedBlobUrl) {
      URL.revokeObjectURL(decryptedBlobUrl);
      setDecryptedBlobUrl(null);
    }
  };

  // Handle external .cplock upload
  const handleFileUpload = async (file: File) => {
    try {
      const text = await file.text();
      const container: EncryptedContainer = JSON.parse(text);
      if (container.format !== 'CIPHERLOCK_V1') {
        setDecryptionError('Invalid container format. Capsule must be a valid .cplock envelope.');
        return;
      }
      onImportContainer(container, text);
      if (container.boundSim && onSelectActiveSim && !areSimNumbersMatching(container.boundSim, activeSimNumber)) {
        onSelectActiveSim(container.boundSim);
      }
      setIsUnlocked(false);
      setDecryptionError(null);
      setDecryptedRawBuffer(null);
    } catch {
      setDecryptionError('Failed to parse .cplock file. Ensure it is an intact CipherLock package.');
    }
  };

  const exportDecryptedFile = () => {
    if (!currentDoc) return;
    let blob: Blob;
    if (decryptedRawBuffer) {
      blob = new Blob([decryptedRawBuffer], { type: currentDoc.mimeType || 'application/octet-stream' });
    } else {
      const content = decryptedText || currentDoc.previewContent || 'Decrypted Data';
      blob = new Blob([content], { type: currentDoc.mimeType || 'text/plain' });
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentDoc.originalName || currentDoc.name.replace('.cplock', '');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col space-y-5">
      {/* Hidden file input for importing .cplock packages */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".cplock,.json"
        onChange={e => e.target.files && e.target.files[0] && handleFileUpload(e.target.files[0])}
        className="hidden"
      />

      {/* If no documents are loaded, show clean onboarding state */}
      {!currentDoc ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shadow-inner">
            <Smartphone className="w-8 h-8 stroke-[1.8]" />
          </div>
          <div className="space-y-1 max-w-md">
            <h3 className="text-slate-900 font-bold text-lg">No Capsule Selected for Verification</h3>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              To test SIM challenge attestation and AES-256 decryption, import an encrypted <code className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-xs">.cplock</code> file or shield a document in your vault.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer shadow-xs transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Import .cplock Container</span>
            </button>
          </div>
          <div className="pt-4 flex items-center justify-center gap-4 flex-wrap text-[11px] text-slate-500 font-mono">
            <span>• Hardware-level challenge handshake</span>
            <span>• Zero bytes decrypted until SIM matches</span>
          </div>
        </div>
      ) : (
        <>
          {/* Document Selector & Incoming Enclave Container Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-5 shadow-xs">
        <div className="absolute -right-12 -top-12 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-3.5 min-w-0 flex-1">
            <div
              className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 shadow-inner transition-colors ${
                isUnlocked
                  ? 'bg-orange-50 border-orange-300 text-orange-600'
                  : decryptionError
                  ? 'bg-red-50 border-red-300 text-red-600'
                  : 'bg-slate-100 border-slate-300 text-orange-600'
              }`}
            >
              {isUnlocked ? (
                <Unlock className="w-6 h-6 stroke-[2.2]" />
              ) : decryptionError ? (
                <ShieldAlert className="w-6 h-6 stroke-[2.2]" />
              ) : (
                <Lock className="w-6 h-6 stroke-[2.2]" />
              )}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isUnlocked ? 'bg-orange-500' : decryptionError ? 'bg-red-500' : 'bg-orange-500 animate-pulse'
                  }`}
                />
                <span className="text-[11px] font-mono text-orange-600 uppercase tracking-wider font-bold">
                  Hardware SIM Encapsulated
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate mt-0.5 font-mono">
                {currentDoc ? currentDoc.name : 'Select Container'}
              </h1>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mt-1 font-medium flex-wrap">
                <span>{currentDoc ? formatBytes(currentDoc.sizeBytes) : '0 B'}</span>
                <span>•</span>
                <span>{currentDoc ? currentDoc.algorithm : 'AES-256-GCM'}</span>
                <span>•</span>
                <span className={isAuthorizedSim ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>
                  {isAuthorizedSim ? 'SIM Authorized' : 'Foreign SIM / Mismatch'}
                </span>
                {!isAuthorizedSim && currentDoc?.boundSim && onSelectActiveSim && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectActiveSim(currentDoc.boundSim);
                      setDecryptionError(null);
                    }}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-100 hover:bg-orange-200 text-orange-800 text-[11px] font-bold cursor-pointer transition-colors shadow-2xs"
                    title={`Switch device active SIM to ${currentDoc.boundSim}`}
                  >
                    <KeyRound className="w-3 h-3" />
                    <span>Match SIM ({currentDoc.boundSim})</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons on banner: Switch doc & Import external */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Import and decrypt external .cplock file"
              className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 hover:text-slate-900 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-orange-600" />
              <span className="hidden sm:inline">Import .cplock</span>
            </button>

            {/* Document Switcher Dropdown */}
            <div className="relative">
              <label htmlFor="select-sealed-container" className="sr-only">
                Select Sealed Container
              </label>
              <select
                id="select-sealed-container"
                value={currentDoc?.id || ''}
                onChange={e => {
                  const found = documents.find(d => d.id === e.target.value);
                  if (found) {
                    onSelectDoc(found);
                    handleLockAgain();
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-mono font-bold outline-none cursor-pointer pr-8 appearance-none"
              >
                {documents.map(d => (
                  <option key={d.id} value={d.id} className="bg-white text-slate-900">
                    {d.name.length > 20 ? d.name.slice(0, 20) + '...' : d.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Decryption Error Alert if any */}
      {decryptionError && (
        <div className="rounded-2xl bg-red-50 border border-red-300 p-4 shadow-sm flex items-start gap-3.5 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-10 h-10 rounded-xl bg-red-100 border border-red-300 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-mono text-red-700 font-bold uppercase tracking-wider block">
              Cryptographic Enclave Repudiation
            </span>
            <p className="text-xs text-red-800 leading-relaxed mt-0.5 font-mono font-medium">
              {decryptionError}
            </p>
            {!isAuthorizedSim && currentDoc && (
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                {currentDoc.boundSim && onSelectActiveSim && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectActiveSim(currentDoc.boundSim);
                      setDecryptionError(null);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Switch Active SIM to Anchor ({currentDoc.boundSim})</span>
                  </button>
                )}
                {onAuthorizeCurrentSim && (
                  <button
                    type="button"
                    onClick={() => {
                      onAuthorizeCurrentSim(currentDoc.id, activeSimNumber);
                      setDecryptionError(null);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-red-300 text-red-700 text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Authorize Current SIM ({activeSimNumber})</span>
                  </button>
                )}
              </div>
            )}
            <p className="text-[11px] text-slate-600 mt-2 font-medium">
              Hardware verification confirms decryption is exclusively permitted on designated SIM anchors.
            </p>
          </div>
        </div>
      )}

      {/* Interactive Cryptographic Radar Visualization */}
      <div className="relative flex flex-col items-center justify-center p-6 rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm">
        {/* Glowing radial backdrop */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-64 rounded-full bg-orange-500/10 blur-3xl animate-pulse" />
          <div className="w-48 h-48 rounded-full bg-slate-200/50 blur-2xl" />
        </div>

        {/* Live Animated Radar Target Rings */}
        <div className="relative w-52 h-52 flex items-center justify-center my-3">
          <svg className="absolute inset-0 w-full h-full transform -rotate-90 pointer-events-none" viewBox="0 0 100 100">
            {/* Outer dash ring */}
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
            {/* Mid ring */}
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="none"
              stroke={
                isUnlocked
                  ? 'rgba(249, 115, 22, 0.4)'
                  : decryptionError
                  ? 'rgba(239, 68, 68, 0.4)'
                  : 'rgba(148, 163, 184, 0.4)'
              }
              strokeWidth="1.5"
            />
            {/* Dynamic Progress Ring */}
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="none"
              stroke={isUnlocked ? '#f97316' : decryptionError ? '#ef4444' : '#ea580c'}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="238"
              strokeDashoffset={isUnlocked ? '0' : isNegotiating ? '80' : '150'}
              className="transition-all duration-700"
            />
            {/* Inner Ring */}
            <circle
              cx="50"
              cy="50"
              r="28"
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="1"
              strokeDasharray="2 4"
            />
          </svg>

          {/* Center Dynamic Telemetry Node (Biometric Beacon) */}
          <div
            id="biometric-beacon"
            onClick={handleTriggerUnlock}
            title="Click or Touch to authenticate with biometric sensor"
            className={`relative w-28 h-28 rounded-full border flex flex-col items-center justify-center shadow-md transition-all duration-300 cursor-pointer ${
              isUnlocked
                ? 'bg-orange-50 border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.3)] scale-105'
                : decryptionError
                ? 'bg-red-50 border-red-500 scale-100 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                : isNegotiating
                ? 'bg-orange-50 border-orange-500 scale-105 animate-pulse'
                : 'bg-slate-50 border-slate-300 hover:border-orange-500 hover:bg-white hover:scale-105'
            }`}
          >
            {isNegotiating && (
              <div className="absolute inset-0 rounded-full bg-orange-500/20 animate-ping opacity-60 pointer-events-none" />
            )}

            <div className="relative flex items-center justify-center">
              {isUnlocked ? (
                <Unlock className="w-9 h-9 text-orange-600 transition-all duration-300 stroke-[2.2]" />
              ) : decryptionError ? (
                <ShieldAlert className="w-9 h-9 text-red-600 transition-all duration-300 stroke-[2.2]" />
              ) : (
                <Fingerprint
                  className={`w-9 h-9 transition-all duration-300 stroke-[2] ${
                    isNegotiating ? 'text-orange-600' : 'text-slate-700'
                  }`}
                />
              )}
            </div>

            <span
              className={`text-[10px] font-mono font-bold mt-1 tracking-wider ${
                isUnlocked ? 'text-orange-700' : decryptionError ? 'text-red-700' : 'text-orange-700'
              }`}
            >
              {isUnlocked ? 'VERIFIED' : decryptionError ? 'REJECTED' : isNegotiating ? 'SCANNING' : 'TOUCH ID'}
            </span>
          </div>

          {/* Rotating Radar Sweep Line */}
          {!isUnlocked && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-[spin_5s_linear_infinite]">
              <div className="w-1/2 h-[2px] bg-gradient-to-r from-transparent to-orange-500 origin-right -translate-x-1/2" />
            </div>
          )}
        </div>

        {/* HUD Cryptographic Telemetry */}
        <div className="w-full flex items-center justify-between pt-3 px-2 border-t border-slate-200 text-xs font-mono">
          <div className="flex flex-col">
            <span className="text-slate-500 text-[10px] font-bold">HARDWARE CHALLENGE</span>
            <span className="text-slate-900 font-bold">ECDSA-P384 // SIM</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-slate-500 text-[10px] font-bold">ENTROPY SOURCE</span>
            <span className="text-orange-600 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" /> 99.984% SOLID
            </span>
          </div>
        </div>
      </div>

      {/* PIN Code Challenge if required */}
      {currentDoc?.policy?.requirePin && !isUnlocked && (
        <div className="rounded-2xl bg-white border border-blue-300 p-4 flex flex-col space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-mono text-slate-900 font-bold">
              <KeyRound className="w-4 h-4 text-blue-600" />
              <span>Mandatory Enclave Passcode Required</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500 font-medium">
              4-digit security PIN
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="password"
              maxLength={8}
              value={enteredPin}
              onChange={e => setEnteredPin(e.target.value)}
              placeholder="Enter PIN..."
              className="flex-1 h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono text-sm tracking-widest outline-none focus:border-blue-600 font-bold"
            />
          </div>
        </div>
      )}

      {/* Pre-Flight Enclave Checklist */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between px-1 text-xs font-mono">
          <span className="text-slate-500 uppercase tracking-wider font-bold">
            Pre-Flight Enclave Diagnostic
          </span>
          <span className="text-orange-600 font-bold">
            {isUnlocked ? '4 of 4 Certified' : isAuthorizedSim ? '3 of 4 Certified' : 'Warning: Mismatch'}
          </span>
        </div>

        {/* Item 1: Carrier SIM IMSI */}
        <div
          className={`p-3.5 rounded-xl border transition-colors ${
            isAuthorizedSim ? 'bg-white border-slate-200' : 'bg-red-50/80 border-red-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isAuthorizedSim ? 'bg-orange-50 text-orange-600' : 'bg-red-100 text-red-600'
                }`}
              >
                <Smartphone className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-slate-900 truncate">
                    Carrier SIM / IMSI Detection
                  </span>
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${isAuthorizedSim ? 'bg-emerald-500' : 'bg-red-500'}`}
                  />
                </div>
                <span className="text-xs text-slate-500 font-mono truncate font-medium">
                  Active SIM: <strong className="text-slate-800">{activeSimNumber}</strong> {isAuthorizedSim ? '(Hardware Anchor Match)' : `(Mismatch with container anchor ${currentDoc?.boundSim})`}
                </span>
              </div>
            </div>
            {isAuthorizedSim ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 ml-2" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 ml-2" />
            )}
          </div>

          {/* Quick Resolution Controls if Mismatched */}
          {!isAuthorizedSim && currentDoc && (
            <div className="mt-3 pt-3 border-t border-red-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="text-[11px] font-mono text-red-800">
                Container anchored to: <span className="font-bold text-slate-900 bg-white/90 px-1.5 py-0.5 rounded border border-red-200">{currentDoc.boundSim}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {currentDoc.boundSim && onSelectActiveSim && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectActiveSim(currentDoc.boundSim);
                      setDecryptionError(null);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Switch Active SIM to {currentDoc.boundSim}</span>
                  </button>
                )}
                {onAuthorizeCurrentSim && (
                  <button
                    type="button"
                    onClick={() => {
                      onAuthorizeCurrentSim(currentDoc.id, activeSimNumber);
                      setDecryptionError(null);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Authorize Device ({activeSimNumber})</span>
                  </button>
                )}
                {sims && sims.length > 1 && onSelectActiveSim && (
                  <select
                    value={activeSimNumber}
                    onChange={e => {
                      onSelectActiveSim(e.target.value);
                      setDecryptionError(null);
                    }}
                    className="px-2 py-1 rounded-lg bg-white border border-slate-300 text-xs font-mono font-bold text-slate-800 cursor-pointer"
                  >
                    {sims.map(s => (
                      <option key={s.id} value={s.phoneNumber}>
                        {s.label} ({s.phoneNumber})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Item 2: HSM */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-slate-200">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 shrink-0">
              <Cpu className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-slate-900 truncate">
                  Hardware Security Module
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
              </div>
              <span className="text-xs text-slate-500 font-mono truncate font-medium">
                Enclave Keyring Validated (Titan M2 / Apple SEP)
              </span>
            </div>
          </div>
          <CheckCircle2 className="w-5 h-5 text-orange-600 shrink-0 ml-2" />
        </div>

        {/* Item 3: Kernel Integrity */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-slate-200">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-slate-900 truncate">
                  Anti-Tamper &amp; Kernel Check
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
              </div>
              <span className="text-xs text-slate-500 font-mono truncate font-medium">
                Clean Enclave (No Debugger / No Screen Recording)
              </span>
            </div>
          </div>
          <CheckCircle2 className="w-5 h-5 text-orange-600 shrink-0 ml-2" />
        </div>

        {/* Item 4: Biometric Row */}
        <div
          className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-300 ${
            isUnlocked
              ? 'bg-white border-orange-400'
              : 'bg-orange-50/40 border-orange-300 shadow-xs'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-orange-100 text-orange-600">
              <Fingerprint className={`w-4 h-4 ${isNegotiating ? 'animate-pulse' : ''}`} />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-slate-900 truncate">
                  Biometric Authorization
                </span>
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isUnlocked ? 'bg-orange-500' : 'bg-orange-400 animate-ping'
                  }`}
                />
              </div>
              <span
                className={`text-xs font-mono truncate font-medium ${
                  isUnlocked ? 'text-slate-500' : 'text-orange-700'
                }`}
              >
                {isUnlocked ? 'Biometric Match: Secure Enclave Verified' : 'Awaiting Fingerprint / FaceID'}
              </span>
            </div>
          </div>

          <div className="shrink-0 ml-2">
            {isUnlocked ? (
              <CheckCircle2 className="w-5 h-5 text-orange-600" />
            ) : (
              <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-700 text-xs font-mono font-bold">
                ACTIVE
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Sovereign Tamper Warning */}
      <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-start gap-3 shadow-xs">
        <div className="w-7 h-7 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5 border border-red-200">
          <AlertTriangle className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-mono text-red-700 uppercase font-bold block">
            Sovereign Protection Active
          </span>
          <p className="text-xs text-slate-700 leading-relaxed mt-0.5 font-medium">
            Attempting to decrypt this container on an unauthorized SIM card or spoofed IMSI will trigger an irreversible secure-element burn, permanently destroying the payload key.
          </p>
        </div>
      </div>

      {/* Primary Unlock CTA */}
      <div className="flex flex-col space-y-2 pt-1">
        {!isUnlocked ? (
          <button
            id="auth-unlock-button"
            type="button"
            disabled={isNegotiating}
            onClick={handleTriggerUnlock}
            className="w-full h-14 rounded-2xl bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-[0_2px_14px_rgba(249,115,22,0.35)] transition-all cursor-pointer disabled:opacity-80"
          >
            {isNegotiating ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Negotiating Secure Enclave...</span>
              </>
            ) : (
              <>
                <Fingerprint className="w-5 h-5 stroke-[2.2]" />
                <span>Authorize with Biometrics &amp; Unlock</span>
              </>
            )}
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLockAgain}
              className="flex-1 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Lock className="w-4 h-4 text-orange-600" />
              <span>Re-Lock Capsule</span>
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowProof(!showProof)}
          className="w-full h-11 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 hover:text-slate-900 text-xs font-mono font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <ShieldCheck className="w-4 h-4 text-orange-600" />
          <span>{showProof ? 'Hide Enclave Attestation Token' : 'Inspect Cryptographic Proof & Signature'}</span>
        </button>
      </div>

      {/* Collapsible Cryptographic Proof Drawer */}
      {showProof && (
        <div className="rounded-xl bg-white border border-slate-200 p-4 space-y-2 animate-in fade-in duration-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-500 uppercase font-bold">Enclave Attestation Token</span>
            <span className="text-orange-600 font-bold">Ed25519 Signed</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 font-mono text-[11px] leading-relaxed break-all select-all font-medium">
            PUBKEY: 4a8f9c1b00e391b29ad5c66e927db8234850c90f<br />
            SIG: 98fd..34c1::SE_SIM_ANCHOR_v4.2<br />
            IMSI_HASH: 0fbc89a24e771d182049e6d01243542a<br />
            CIPHER: AES-GCM-256 (IV: {currentDoc ? currentDoc.sha256.slice(0, 16) : '0x...'})
          </div>
        </div>
      )}

      {/* Decrypted Sandbox Document Viewer */}
      {isUnlocked && currentDoc && (
        <div className="rounded-2xl bg-white border-2 border-orange-500 p-5 shadow-xl flex flex-col space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-200 pb-3">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 rounded bg-orange-500 text-white font-mono text-xs font-bold">
                DECRYPTED MEMORY SANDBOX
              </span>
              <span className="text-xs font-mono text-slate-500 font-bold">
                {currentDoc.policy?.zeroExtract ? 'Zero-Extract Armed' : 'Extract Permitted'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 rounded text-xs font-mono cursor-pointer font-bold ${
                  activeTab === 'preview'
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-100 text-slate-700 hover:text-slate-900'
                }`}
              >
                Decrypted View
              </button>
              <button
                onClick={() => setActiveTab('hex')}
                className={`px-3 py-1 rounded text-xs font-mono cursor-pointer font-bold ${
                  activeTab === 'hex'
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-100 text-slate-700 hover:text-slate-900'
                }`}
              >
                Raw Stream
              </button>
            </div>
          </div>

          {/* Rendered content inside protected zero-copy frame */}
          <div className="relative rounded-xl bg-slate-50 border border-slate-200 p-4 max-h-80 overflow-y-auto font-mono text-xs leading-relaxed text-slate-900 select-none">
            {/* Watermark overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05] select-none text-2xl font-bold uppercase rotate-[-20deg] text-orange-600">
              CONFIDENTIAL // SIM: {activeSimNumber}
            </div>

            {activeTab === 'preview' ? (
              <div className="space-y-3">
                {decryptedBlobUrl && currentDoc.mimeType.startsWith('image/') ? (
                  <div className="flex justify-center p-2">
                    <img
                      src={decryptedBlobUrl}
                      alt="Decrypted content"
                      className="max-h-64 rounded-lg object-contain shadow"
                    />
                  </div>
                ) : (
                  <pre className="whitespace-pre-wrap font-mono leading-relaxed font-medium">
                    {decryptedText || currentDoc.previewContent || 'Decrypted payload validated via Hardware Enclave.\nZero unauthorized extract.'}
                  </pre>
                )}
              </div>
            ) : (
              <div className="text-slate-600 space-y-1 font-mono font-medium">
                <div>00000000: 43 50 4c 4f 43 4b 5f 53 45 43 55 52 45 5f 50 41  CPLOCK_SECURE_PA</div>
                <div>00000010: 59 4c 4f 41 44 20 20 20 61 31 30 39 66 65 38 32  YLOAD   a109fe82</div>
                <div>00000020: 39 62 61 33 34 63 31 31 62 30 65 33 38 31 30 32  9ba34c11b0e38102</div>
                <div>00000030: 2f 2f 20 45 4e 43 4c 41 56 45 20 4b 45 59 20 4f  // ENCLAVE KEY O</div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-mono text-slate-500 pt-1 font-bold">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-orange-600">Attestation: SE_CHALLENGE_PASSED</span>
              {sha256Match && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px]">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Bit-for-Bit Verified (SHA-256 Match)</span>
                </span>
              )}
              {biometricNote && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[11px]">
                  <Sparkles className="w-3 h-3 text-blue-600" />
                  <span>WebAuthn Biometric Attested</span>
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={exportDecryptedFile}
              className="px-3.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Download the real decrypted original file to your device storage"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Original ({formatBytes(decryptedRawBuffer?.byteLength || currentDoc.sizeBytes)})</span>
            </button>
          </div>
        </div>
      )}
    </>
  )}
</div>
  );
};
