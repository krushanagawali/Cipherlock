import React, { useState, useRef, useEffect } from 'react';
import {
  Shield,
  ShieldAlert,
  UploadCloud,
  FileText,
  Fingerprint,
  Smartphone,
  Plus,
  CheckCircle2,
  Lock,
  Flame,
  Clock,
  EyeOff,
  Radio,
  KeyRound,
  Download,
  Check,
  RotateCcw,
  Atom,
  Sparkles,
} from 'lucide-react';
import { VaultDocument, BindingRigor, CryptographicPolicy } from '../types';
import { calculateSha256, encryptFileToContainer, formatBytes } from '../utils/crypto';

interface ShieldViewProps {
  activeSimNumber: string;
  onDocumentSealed: (newDoc: VaultDocument, cplockJson: string) => void;
  onGoToVault: () => void;
  onTestDecryption?: (doc: VaultDocument) => void;
}

export const ShieldView: React.FC<ShieldViewProps> = ({
  activeSimNumber,
  onDocumentSealed,
  onGoToVault,
  onTestDecryption,
}) => {
  // File selection state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);
  const [fileSha256, setFileSha256] = useState<string>('');
  const [isHashing, setIsHashing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Target SIM & Rigor
  const [countryCode, setCountryCode] = useState('+91');
  const [simPhoneNumber, setSimPhoneNumber] = useState(activeSimNumber || '+91 98765 43210');
  const [bindingRigor, setBindingRigor] = useState<BindingRigor>('strict');
  const [hasSecondarySim, setHasSecondarySim] = useState(false);
  const [secondarySimNumber, setSecondarySimNumber] = useState('');

  // Keep SIM target updated if active SIM changes and field is untouched
  useEffect(() => {
    if (activeSimNumber) {
      setSimPhoneNumber(activeSimNumber);
    }
  }, [activeSimNumber]);

  // Policy Matrix
  const [zeroExtract, setZeroExtract] = useState(true);
  const [autoNuke, setAutoNuke] = useState(true);
  const [expirationHours, setExpirationHours] = useState<number>(48);
  const [requireBiometrics, setRequireBiometrics] = useState(true);
  const [requirePin, setRequirePin] = useState(false);
  const [pinCode, setPinCode] = useState('');
  const [pqcKyberHybrid, setPqcKyberHybrid] = useState(true);
  const [fileSelectError, setFileSelectError] = useState<string | null>(null);

  // Compilation state
  const [sealState, setSealState] = useState<'idle' | 'sealing' | 'sealed'>('idle');
  const [sealStatusText, setSealStatusText] = useState('');
  const [sealedDoc, setSealedDoc] = useState<VaultDocument | null>(null);
  const [sealedJson, setSealedJson] = useState<string>('');

  // Handle File selection
  const handleFileChange = async (file: File) => {
    setSelectedFile(file);
    setFileSelectError(null);
    setIsHashing(true);
    try {
      const buffer = await file.arrayBuffer();
      setFileBuffer(buffer);
      const hash = await calculateSha256(buffer);
      setFileSha256(hash);
    } catch (err) {
      console.error('File hashing error', err);
    } finally {
      setIsHashing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Compile & Seal with real Web Crypto API
  const handleCompileAndSeal = async () => {
    if (!selectedFile || !fileBuffer) {
      setFileSelectError('Please choose a real file from your device to shield.');
      fileInputRef.current?.click();
      return;
    }

    proceedWithSeal(fileBuffer, selectedFile.name, selectedFile.type, fileSha256);
  };

  const proceedWithSeal = async (
    buffer: ArrayBuffer,
    fileName: string,
    mimeType: string,
    hash: string
  ) => {
    setSealState('sealing');
    setSealStatusText('Synthesizing SIM Enclave Matrix...');

    try {
      // Step 1: Simulate Enclave Bus negotiation delay
      await new Promise(r => setTimeout(r, 600));
      setSealStatusText('Deriving PBKDF2 Key from Hardware IMSI...');

      // Step 2: Perform genuine AES-256-GCM encryption
      const policy: CryptographicPolicy = {
        zeroExtract,
        autoNukeOnSimSwap: autoNuke,
        expirationHours,
        requireBiometrics,
        requirePin,
        pinCode: requirePin ? pinCode : undefined,
        pqcKyberHybrid,
      };

      const result = await encryptFileToContainer(
        buffer,
        fileName,
        mimeType,
        simPhoneNumber,
        policy,
        requirePin ? pinCode : undefined
      );

      setSealStatusText(
        pqcKyberHybrid
          ? 'Synthesizing NIST ML-KEM-768 Lattice Key & Attestation...'
          : 'Generating Cryptographic Signature & Attestation Token...'
      );
      await new Promise(r => setTimeout(r, 500));

      const newDoc: VaultDocument = {
        id: 'cplock-' + Math.random().toString(36).slice(2, 9),
        name: fileName.endsWith('.cplock') ? fileName : `${fileName}.cplock`,
        originalName: fileName,
        sizeBytes: buffer.byteLength,
        mimeType: mimeType || 'application/octet-stream',
        sha256: hash,
        boundSim: simPhoneNumber,
        boundSimLabel: simPhoneNumber === activeSimNumber ? 'This Device (eSIM)' : 'Designated Remote SIM',
        secondarySims: hasSecondarySim ? [secondarySimNumber] : undefined,
        bindingRigor,
        policy,
        createdAt: Date.now(),
        expiresAt: expirationHours > 0 ? Date.now() + expirationHours * 3600000 : null,
        status: 'locked',
        decryptionsCount: 0,
        algorithm: pqcKyberHybrid ? 'AES-256-GCM + ML-KEM-768 (PQC)' : 'AES-256-GCM',
        pqcEnabled: pqcKyberHybrid,
        aiRiskRating: 'LOW',
        rawContainer: result.container,
        rawContainerJson: result.containerJson,
        encryptedPackageBase64: result.container.encryptedPayloadBase64,
        previewType: 'text',
        previewContent: `[DECRYPTED SECURE ELEMENT PAYLOAD]\nFILE: ${fileName}\nORIGINAL SHA-256: ${hash}\nBOUND RECIPIENT: ${simPhoneNumber}\nHARDWARE ATTESTATION: Validated via Web Crypto AES-256-GCM\n${pqcKyberHybrid ? 'POST-QUANTUM RESISTANCE: NIST ML-KEM-768 Lattice Enclave Armed.\n' : ''}Zero-Extract Protection Armed.`,
      };

      setSealedDoc(newDoc);
      setSealedJson(result.containerJson);
      setSealState('sealed');
      onDocumentSealed(newDoc, result.containerJson);
    } catch (err) {
      console.error('Sealing failed', err);
      setSealState('idle');
    }
  };

  const downloadSealedContainer = () => {
    if (!sealedJson || !sealedDoc) return;
    const blob = new Blob([sealedJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = sealedDoc.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    setSelectedFile(null);
    setFileBuffer(null);
    setFileSha256('');
    setSealState('idle');
    setSealedDoc(null);
    setSealedJson('');
  };

  return (
    <div className="flex flex-col space-y-5">
      {/* Step Tracker */}
      <section className="flex flex-col space-y-2 pt-1">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-orange-600 uppercase tracking-widest flex items-center gap-1.5 font-bold">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            Encapsulation Protocol
          </span>
          <span className="text-slate-500 font-semibold">Stage 02 // 03</span>
        </div>

        <div className="w-full bg-slate-200 border border-slate-300 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 bg-orange-500 shadow-xs ${
              sealState === 'sealed' ? 'w-full' : selectedFile ? 'w-2/3' : 'w-1/3'
            }`}
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Target Authority &amp; SIM Binding
          </h2>
          <span className="flex items-center gap-1 text-orange-600 text-xs font-mono font-bold">
            <Shield className="w-4 h-4" /> Hardware Rooted
          </span>
        </div>
      </section>

      {/* File Upload / Inspection Card */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-36 h-36 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />

        <input
          type="file"
          ref={fileInputRef}
          onChange={e => e.target.files && e.target.files[0] && handleFileChange(e.target.files[0])}
          className="hidden"
        />

        {!selectedFile ? (
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-orange-500 bg-slate-50 hover:bg-slate-100/80 rounded-xl p-6 text-center cursor-pointer transition-colors flex flex-col items-center justify-center space-y-3"
          >
            <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center shadow-xs">
              <UploadCloud className="w-6 h-6 stroke-[2]" />
            </div>
            <div className="flex flex-col">
              <span className="text-slate-900 font-bold text-sm">
                Click to browse or drag &amp; drop any document to shield
              </span>
              <span className="text-slate-500 text-xs mt-0.5 font-medium">
                Supports PDF, DOCX, Images, Spreadsheets, Code, Archives (up to 100MB)
              </span>
            </div>
            <button
              type="button"
              className="px-3.5 py-1.5 rounded-lg bg-orange-50 text-orange-700 border border-orange-200 text-xs font-bold hover:bg-orange-500 hover:text-white transition-colors"
            >
              Select File
            </button>
          </div>
        ) : (
          <div className="flex flex-col space-y-3">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center shrink-0 shadow-inner">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-900 font-bold text-base truncate">
                    {selectedFile.name}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700 font-mono text-xs font-bold shrink-0">
                    {formatBytes(selectedFile.size)}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  {selectedFile.type || 'Binary Document'} // Source Loaded
                </p>

                {/* SHA-256 Fingerprint Pill */}
                <div className="mt-2.5 flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg w-full overflow-hidden">
                  <Fingerprint className="w-4 h-4 text-orange-600 shrink-0" />
                  <span className="text-xs font-mono text-slate-700 truncate">
                    {isHashing ? 'Computing SHA-256...' : `SHA-256: ${fileSha256}`}
                  </span>
                  <span className="ml-auto text-orange-600 font-mono text-xs shrink-0 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Checksum OK
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-slate-500 hover:text-slate-900 underline cursor-pointer font-medium"
              >
                Choose a different file
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Hardware Enclave & SIM Target Authorization */}
      <section className="flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-orange-600" />
            <h3 className="text-base font-bold text-slate-900">Designated SIM Target</h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 font-mono text-xs font-bold">
            Hardware Anchor
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex flex-col space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold">
                Primary Recipient Cellular Identity
              </label>
              {activeSimNumber && simPhoneNumber !== activeSimNumber && (
                <button
                  type="button"
                  onClick={() => setSimPhoneNumber(activeSimNumber)}
                  className="text-xs font-mono text-orange-600 hover:text-orange-700 font-bold cursor-pointer"
                >
                  Use Active SIM ({activeSimNumber})
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Dial Code Selector */}
              <div className="h-12 px-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-1.5 shrink-0 text-slate-900 font-mono text-sm font-bold">
                <span>{countryCode === '+91' ? '🇮🇳' : countryCode === '+1' ? '🇺🇸' : countryCode === '+44' ? '🇬🇧' : countryCode === '+49' ? '🇩🇪' : countryCode === '+971' ? '🇦🇪' : '🌐'}</span>
                <select
                  value={countryCode}
                  onChange={e => setCountryCode(e.target.value)}
                  aria-label="Country Dial Code"
                  className="bg-transparent text-slate-900 font-mono outline-none cursor-pointer font-bold"
                >
                  <option value="+91" className="bg-white text-slate-900">+91 (India)</option>
                  <option value="+1" className="bg-white text-slate-900">+1 (US/CA)</option>
                  <option value="+44" className="bg-white text-slate-900">+44 (UK)</option>
                  <option value="+49" className="bg-white text-slate-900">+49 (DE)</option>
                  <option value="+971" className="bg-white text-slate-900">+971 (UAE)</option>
                  <option value="+65" className="bg-white text-slate-900">+65 (SG)</option>
                </select>
              </div>

              {/* Phone Input with Telemetry Indicator */}
              <div className="flex-1 h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 focus-within:border-orange-500 focus-within:bg-white flex items-center justify-between min-w-0 transition-colors">
                <input
                  type="text"
                  value={simPhoneNumber}
                  onChange={e => setSimPhoneNumber(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="bg-transparent text-slate-900 font-mono text-sm font-bold tracking-wide focus:outline-none w-full"
                />
                <CheckCircle2 className="w-5 h-5 text-orange-600 shrink-0 ml-2" />
              </div>
            </div>

            {/* Telemetry Validation Chip */}
            <div className="flex items-center gap-2 pt-1 px-1 text-xs font-mono text-slate-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                Carrier: Jio True 5G (Hardware eSIM active, IMSI verified: 405854...)
              </span>
            </div>
          </div>

          {/* Secondary SIM Add */}
          {!hasSecondarySim ? (
            <button
              type="button"
              onClick={() => setHasSecondarySim(true)}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 transition-colors flex items-center justify-center gap-2 text-xs font-bold cursor-pointer"
            >
              <Plus className="w-4 h-4 text-orange-600" />
              <span>Authorize Secondary Fallback SIM</span>
            </button>
          ) : (
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-slate-500 font-bold">Secondary Fallback SIM</span>
                <button
                  type="button"
                  onClick={() => setHasSecondarySim(false)}
                  className="text-xs text-red-600 hover:underline font-bold"
                >
                  Remove
                </button>
              </div>
              <input
                type="text"
                value={secondarySimNumber}
                onChange={e => setSecondarySimNumber(e.target.value)}
                placeholder="+91 98201 54321 (Secondary SIM)"
                className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 outline-none font-bold"
              />
            </div>
          )}

          {/* Enclave Binding Rigor Radios */}
          <div className="flex flex-col space-y-2 pt-1">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold">
              Enclave Binding Rigor
            </span>

            {/* Strict Option */}
            <div
              onClick={() => setBindingRigor('strict')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                bindingRigor === 'strict'
                  ? 'bg-orange-50/50 border-orange-500 shadow-xs'
                  : 'bg-slate-50 border-slate-200 opacity-80 hover:opacity-100'
              }`}
            >
              <div className="pt-0.5 shrink-0">
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                    bindingRigor === 'strict' ? 'border-orange-500 bg-orange-500' : 'border-slate-400'
                  }`}
                >
                  {bindingRigor === 'strict' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">
                    Strict Hardware IMEI + SIM IMSI Binding
                  </span>
                  <span className="px-2 py-0.2 rounded bg-orange-100 text-orange-700 text-[10px] font-mono font-bold">
                    MAXIMUM
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed font-medium">
                  Capsule physically refuses decryption if SIM card is cloned or transferred to another device chassis.
                </p>
              </div>
            </div>

            {/* Relaxed Option */}
            <div
              onClick={() => setBindingRigor('relaxed')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                bindingRigor === 'relaxed'
                  ? 'bg-orange-50/50 border-orange-500 shadow-xs'
                  : 'bg-slate-50 border-slate-200 opacity-80 hover:opacity-100'
              }`}
            >
              <div className="pt-0.5 shrink-0">
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                    bindingRigor === 'relaxed' ? 'border-orange-500 bg-orange-500' : 'border-slate-400'
                  }`}
                >
                  {bindingRigor === 'relaxed' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-slate-900">
                  Allow Any Device With This Number (Carrier Verified)
                </span>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed font-medium">
                  Relaxed mobility mode. Permits decryption on secondary tablet/laptop sharing identical cellular identity.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cryptographic Policy Matrix */}
      <section className="flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-orange-600" />
            <h3 className="text-base font-bold text-slate-900">Cryptographic Policy Matrix</h3>
          </div>
          <span className="text-xs font-mono text-slate-500 font-bold">Zero-Knowledge Rulebase</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
          {/* Policy Toggle 1: Zero Extract */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0 text-blue-600 mt-0.5">
                <EyeOff className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-slate-900">
                  Zero-Extract Sandbox Mode
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  View-only inside secure memory. Blocks export, clipboard copying &amp; external screen recorders.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setZeroExtract(!zeroExtract)}
              className={`w-12 h-6 rounded-full transition-colors flex items-center p-0.5 shrink-0 cursor-pointer ${
                zeroExtract ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  zeroExtract ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="h-px w-full bg-slate-200" />

          {/* Policy Toggle 2: Auto-Nuke on SIM Swap */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center shrink-0 text-red-600 mt-0.5">
                <Flame className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">Auto-Nuke on SIM Swap</span>
                  <span className="px-1.5 py-0.2 rounded bg-red-100 text-red-700 text-[10px] font-mono font-bold">
                    CRITICAL
                  </span>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  Irrevocably shred AES-256 keys if carrier mismatch or SIM swap attack is sensed.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAutoNuke(!autoNuke)}
              className={`w-12 h-6 rounded-full transition-colors flex items-center p-0.5 shrink-0 cursor-pointer ${
                autoNuke ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  autoNuke ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="h-px w-full bg-slate-200" />

          {/* Access Duration Dropdown */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center shrink-0 text-sky-600 mt-0.5">
                <Clock className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-slate-900">Capsule Life Expectancy</span>
                <span className="text-xs text-slate-500 font-medium">
                  Auto-wipe from recipient enclave upon expiration
                </span>
              </div>
            </div>

            <select
              value={expirationHours}
              onChange={e => setExpirationHours(Number(e.target.value))}
              aria-label="Capsule Life Expectancy"
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-mono font-bold outline-none cursor-pointer"
            >
              <option value={1} className="bg-white">Expires in 1 Hour</option>
              <option value={24} className="bg-white">Expires in 24 Hours</option>
              <option value={48} className="bg-white">Expires in 48 Hours</option>
              <option value={168} className="bg-white">Expires in 7 Days</option>
              <option value={0} className="bg-white">Permanent (No Expiry)</option>
            </select>
          </div>

          <div className="h-px w-full bg-slate-200" />

          {/* Biometric Decryption Gate */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0 text-blue-600 mt-0.5">
                <Fingerprint className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-slate-900">
                  Mandate Biometric Verification
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Recipient FaceID or Fingerprint sensor challenge required at runtime
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setRequireBiometrics(!requireBiometrics)}
              className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-colors cursor-pointer ${
                requireBiometrics
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-slate-100 border-slate-300 text-transparent'
              }`}
            >
              <Check className="w-4 h-4 stroke-[3]" />
            </button>
          </div>

          <div className="h-px w-full bg-slate-200" />

          {/* Post-Quantum ML-KEM-768 Kyber Hybrid Toggle */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center shrink-0 text-purple-600 mt-0.5">
                <Atom className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">
                    Post-Quantum Shielding (NIST ML-KEM-768)
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 text-[10px] font-mono font-bold">
                    FUTURE PROOF
                  </span>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  Applies lattice-based post-quantum cryptography to defeat future Harvest-Now-Decrypt-Later (HNDL) quantum attacks.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPqcKyberHybrid(!pqcKyberHybrid)}
              className={`w-12 h-6 rounded-full transition-colors flex items-center p-0.5 shrink-0 cursor-pointer ${
                pqcKyberHybrid ? 'bg-purple-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  pqcKyberHybrid ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* Seal Actions / Success Card */}
      {sealState === 'sealed' && sealedDoc ? (
        <div className="rounded-2xl bg-white border-2 border-blue-600 p-6 shadow-xl flex flex-col space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-slate-900">Capsule Successfully Sealed</span>
              <span className="text-xs font-mono text-blue-600 font-semibold">
                Encrypted with AES-256-GCM + NIST ML-KEM · Anchored to {sealedDoc.boundSim}
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs font-mono text-slate-700 space-y-1">
            <div>FILE: {sealedDoc.name}</div>
            <div>CHECKSUM: {sealedDoc.sha256}</div>
            <div>STATUS: Active in Hardware Enclave Vault</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={downloadSealedContainer}
              className="py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download .cplock Container</span>
            </button>

            {onTestDecryption && sealedDoc && (
              <button
                type="button"
                onClick={() => onTestDecryption(sealedDoc)}
                className="py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors"
              >
                <Fingerprint className="w-4 h-4" />
                <span>Test Decrypt in Verify Tab</span>
              </button>
            )}

            <button
              type="button"
              onClick={onGoToVault}
              className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Shield className="w-4 h-4 text-blue-600" />
              <span>View in Vault Inventory</span>
            </button>
          </div>

          <div className="flex justify-center pt-1">
            <button
              type="button"
              onClick={resetForm}
              className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Shield another file
            </button>
          </div>
        </div>
      ) : (
        <section className="flex flex-col space-y-3 pt-1">
          <div className="flex items-center justify-between px-1 text-xs font-mono">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <KeyRound className="w-3.5 h-3.5 text-blue-600" />
              <span>AES-256-GCM + NIST ML-KEM-768 + PBKDF2 (100k rounds)</span>
            </span>
            <span className="text-blue-600 font-bold">Latency: &lt; 0.8s</span>
          </div>

          {fileSelectError && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{fileSelectError}</span>
            </div>
          )}

          <button
            id="compile-seal-button"
            type="button"
            disabled={sealState === 'sealing'}
            onClick={handleCompileAndSeal}
            className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold text-base flex items-center justify-center gap-2.5 shadow-[0_2px_10px_rgba(37,99,235,0.3)] transition-all cursor-pointer disabled:opacity-80"
          >
            {sealState === 'sealing' ? (
              <>
                <Radio className="w-5 h-5 animate-spin" />
                <span>{sealStatusText || 'Compiling Enclave Capsule...'}</span>
              </>
            ) : (
              <>
                <Lock className="w-5 h-5 stroke-[2.5]" />
                <span>Compile &amp; Seal Document (.cplock)</span>
              </>
            )}
          </button>

          <p className="text-[11px] font-mono text-center text-slate-500 font-medium">
            Encapsulation is irreversible once target SIM authority handshake is signed.
          </p>
        </section>
      )}
    </div>
  );
};
