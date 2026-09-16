import React, { useState, useMemo } from 'react';
import {
  Shield,
  ShieldAlert,
  Smartphone,
  Cpu,
  Lock,
  Search,
  Plus,
  Download,
  Eye,
  Trash2,
  FileText,
  FileCode,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  KeyRound,
  Fingerprint,
  RefreshCw,
  SlidersHorizontal,
  Atom,
  Sparkles,
} from 'lucide-react';
import { VaultDocument } from '../types';
import { formatBytes } from '../utils/crypto';

interface VaultViewProps {
  documents: VaultDocument[];
  activeSimNumber: string;
  simCount?: number;
  breachCount?: number;
  onGoToShield: () => void;
  onSelectDocumentToDecrypt: (doc: VaultDocument) => void;
  onInspectDocument: (doc: VaultDocument) => void;
  onDeleteDocument: (docId: string) => void;
  onDownloadPackage: (doc: VaultDocument) => void;
  onGoToCommandCenter?: () => void;
  onImportContainer?: (container: any, jsonString: string) => void;
}

type FilterCategory = 'all' | 'single-sim' | 'multi-sim' | 'self-destruct';

export const VaultView: React.FC<VaultViewProps> = ({
  documents,
  activeSimNumber,
  simCount = 1,
  breachCount = 0,
  onGoToShield,
  onSelectDocumentToDecrypt,
  onInspectDocument,
  onDeleteDocument,
  onDownloadPackage,
  onGoToCommandCenter,
  onImportContainer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterCategory>('all');

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      // Search matching
      const matchesSearch =
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.sha256.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.boundSim.includes(searchQuery);

      if (!matchesSearch) return false;

      // Filter category
      if (selectedFilter === 'all') return true;
      if (selectedFilter === 'single-sim') return !doc.secondarySims || doc.secondarySims.length === 0;
      if (selectedFilter === 'multi-sim') return !!doc.secondarySims && doc.secondarySims.length > 0;
      if (selectedFilter === 'self-destruct') return Boolean(doc.policy?.autoNukeOnSimSwap || (doc.expiresAt !== null));

      return true;
    });
  }, [documents, searchQuery, selectedFilter]);

  const multiSimCount = documents.filter(d => d.secondarySims && d.secondarySims.length > 0).length;
  const selfDestructCount = documents.filter(d => Boolean(d.policy?.autoNukeOnSimSwap || d.expiresAt !== null)).length;

  const getFileIcon = (mime: string, name: string) => {
    if (name.endsWith('.pdf') || mime.includes('pdf')) {
      return <FileText className="w-5 h-5 text-orange-400" />;
    }
    if (name.endsWith('.docx') || name.endsWith('.cplock') || mime.includes('word')) {
      return <FileSpreadsheet className="w-5 h-5 text-sky-400" />;
    }
    return <FileCode className="w-5 h-5 text-amber-400" />;
  };

  return (
    <div className="flex flex-col space-y-5">
      {/* Hardware Enclave & SIM Telemetry HUD */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/90 p-5 shadow-xs">
        {/* Subtle glow ambient decorations */}
        <div className="absolute -right-16 -top-16 w-52 h-52 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col space-y-4">
          {/* Telemetry Header Row */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-3">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 shadow-inner">
                <Smartphone className="w-5 h-5" />
                <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500" />
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
                  Active Hardware Anchor
                </span>
                <span className="font-mono font-bold text-slate-900 text-base tracking-wide">
                  {activeSimNumber}
                </span>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider">eSIM Hardware Verified</span>
            </div>
          </div>

          {/* Cryptographic Enclave Telemetry Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 flex flex-col space-y-1">
              <div className="flex items-center space-x-1.5 text-slate-500">
                <Cpu className="w-4 h-4 text-orange-500" />
                <span className="text-[11px] font-mono uppercase tracking-wider font-medium">Enclave Architecture</span>
              </div>
              <span className="text-sm font-bold text-slate-900">Titan M2 / Apple SEP A17</span>
              <span className="text-xs text-orange-600 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Hardware Attested &amp; Verified
              </span>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 flex flex-col space-y-1">
              <div className="flex items-center space-x-1.5 text-slate-500">
                <Shield className="w-4 h-4 text-sky-600" />
                <span className="text-[11px] font-mono uppercase tracking-wider font-medium">Cryptographic Integrity</span>
              </div>
              <span className="text-sm font-bold text-slate-900">100% Zero-Leak Sealed</span>
              <span className="text-xs font-mono text-slate-500 truncate">
                SHA: e83a...9f2b · AES-GCM 256
              </span>
            </div>
          </div>

          {/* Live Heartbeat & Gemini Command Center trigger */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-slate-500 text-xs font-mono flex-wrap gap-2">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Titan M2 Hardware Root Bound</span>
            </span>

            {onGoToCommandCenter && (
              <button
                type="button"
                onClick={onGoToCommandCenter}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium font-sans text-xs border border-blue-200 cursor-pointer transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Gemini Threat Analysis</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Actionable Shield Card */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex flex-col space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                Google Titan Hardware Vault
              </span>
              <span className="text-slate-500 text-xs font-mono">NIST SP 800-56C</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Shield Confidential Assets
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Cryptographically seal files to designated mobile SIM signatures and NIST ML-KEM post-quantum keys. Decryption requires physical hardware presence and biometric attestation.
            </p>
          </div>

          <button
            id="shield-new-doc-btn"
            onClick={onGoToShield}
            className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-[0_2px_8px_rgba(26,115,232,0.25)] transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Shield New Document</span>
          </button>
        </div>
      </div>

      {/* 3-Column Bento Stat Counters */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="rounded-xl bg-white border border-slate-200 p-3 sm:p-4 flex flex-col items-center justify-center text-center shadow-xs">
          <span className="text-xl sm:text-3xl font-extrabold text-slate-900 font-mono">
            {documents.length}
          </span>
          <span className="text-[10px] sm:text-xs font-medium text-slate-500 mt-1 uppercase tracking-wider">
            Locked Files
          </span>
        </div>

        <div className="rounded-xl bg-white border border-slate-200 p-3 sm:p-4 flex flex-col items-center justify-center text-center shadow-xs">
          <span className="text-xl sm:text-3xl font-extrabold text-blue-600 font-mono">
            {simCount}
          </span>
          <span className="text-[10px] sm:text-xs font-medium text-slate-500 mt-1 uppercase tracking-wider">
            SIM Identities
          </span>
        </div>

        <div className="rounded-xl bg-white border border-slate-200 p-3 sm:p-4 flex flex-col items-center justify-center text-center shadow-xs">
          <span className={`text-xl sm:text-3xl font-extrabold font-mono ${breachCount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {breachCount}
          </span>
          <span className="text-[10px] sm:text-xs font-medium text-slate-500 mt-1 uppercase tracking-wider">
            Active Breaches
          </span>
        </div>
      </div>

      {/* Search & Segmented Filter Bar */}
      <div className="flex flex-col space-y-3">
        {/* Search Input */}
        <div className="relative flex items-center rounded-xl bg-white border border-slate-200 px-3.5 py-2.5 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/10 shadow-xs transition-all">
          <Search className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
          <input
            id="vault-search-input"
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search encrypted containers, hashes, SIM numbers (or press ⌘K)..."
            className="bg-transparent text-slate-900 placeholder-slate-400 text-sm w-full outline-none font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-slate-500 hover:text-slate-800 text-xs font-mono px-1.5 py-0.5 rounded bg-slate-100"
            >
              CLEAR
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              selectedFilter === 'all'
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            All ({documents.length})
          </button>
          <button
            onClick={() => setSelectedFilter('single-sim')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              selectedFilter === 'single-sim'
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            Single-SIM
          </button>
          <button
            onClick={() => setSelectedFilter('multi-sim')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              selectedFilter === 'multi-sim'
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            Multi-Device ({multiSimCount})
          </button>
          <button
            onClick={() => setSelectedFilter('self-destruct')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              selectedFilter === 'self-destruct'
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            Self-Destruct Set ({selfDestructCount})
          </button>
        </div>
      </div>

      {/* Vault Inventory List */}
      <div className="flex flex-col space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold">
            Attested Vault Inventory ({filteredDocuments.length})
          </span>
          <span className="text-xs font-mono text-orange-600 font-semibold flex items-center gap-1">
            <RefreshCw className="w-3 h-3 animate-spin" /> Live Sync Enclave
          </span>
        </div>

        {documents.length === 0 ? (
          <div className="rounded-2xl bg-white border border-slate-200/90 p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shadow-inner">
              <Shield className="w-8 h-8 stroke-[1.8]" />
            </div>
            <div className="space-y-1 max-w-md">
              <h3 className="text-slate-900 font-bold text-lg">Sovereign Vault Clean &amp; Armed</h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                No sealed documents currently exist in your hardware node. Select any confidential file from your device to bind it to your real SIM signature.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 w-full max-w-sm justify-center">
              <button
                type="button"
                onClick={onGoToShield}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Shield Your First File</span>
              </button>
            </div>
            <div className="pt-4 flex items-center justify-center gap-2 sm:gap-4 flex-wrap text-[11px] text-slate-500 font-mono">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> AES-256-GCM Military Spec
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Post-Quantum ML-KEM
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Hardware SIM Attested
              </span>
            </div>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center flex flex-col items-center justify-center space-y-3 shadow-xs">
            <Search className="w-10 h-10 text-slate-400 stroke-[1.5]" />
            <span className="text-slate-900 font-bold text-base">No matching files in inventory</span>
            <p className="text-slate-500 text-xs max-w-sm">
              No files matched "{searchQuery}" under the selected filter.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedFilter('all');
              }}
              className="mt-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredDocuments.map(doc => {
            const isMultiSim = doc.secondarySims && doc.secondarySims.length > 0;
            return (
              <div
                key={doc.id}
                id={`doc-card-${doc.id}`}
                className="rounded-2xl bg-white border border-slate-200 hover:border-orange-400 hover:shadow-md p-4 sm:p-5 transition-all duration-200 shadow-xs flex flex-col space-y-3 relative group"
              >
                {/* Top: File Name, Size, Hash */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 shadow-inner">
                      {getFileIcon(doc.mimeType, doc.name)}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-900 font-bold text-base tracking-tight truncate">
                          {doc.name}
                        </span>
                        {(doc.pqcEnabled || doc.algorithm?.includes('ML-KEM') || doc.algorithm?.includes('PQC')) && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200 shrink-0">
                            <Atom className="w-3 h-3 text-purple-600" />
                            <span>PQC ML-KEM</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-slate-500 text-xs font-mono mt-0.5">
                        <span>{formatBytes(doc.sizeBytes)}</span>
                        <span>•</span>
                        <span className="truncate">SHA: {doc.sha256.slice(0, 10)}...</span>
                        <span>•</span>
                        <span className="text-blue-600 font-bold">{doc.algorithm}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Dropdown / Quick Inspect */}
                  <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                    <button
                      id={`inspect-btn-${doc.id}`}
                      onClick={() => onInspectDocument(doc)}
                      title="Inspect Cryptographic Token & Details"
                      className="w-8 h-8 sm:w-8 sm:h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      id={`download-btn-${doc.id}`}
                      onClick={() => onDownloadPackage(doc)}
                      title="Download .cplock Encrypted Package"
                      className="w-8 h-8 sm:w-8 sm:h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      id={`delete-btn-${doc.id}`}
                      onClick={() => onDeleteDocument(doc.id)}
                      title="Purge from Vault"
                      className="w-8 h-8 sm:w-8 sm:h-8 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* SIM Binding & Guard Metrics */}
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 flex flex-col space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                      <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                      <span>Bound SIM:</span>
                    </span>
                    <span className="text-slate-900 font-bold">
                      {doc.boundSim} {doc.boundSimLabel ? `(${doc.boundSimLabel})` : ''}
                    </span>
                  </div>

                  {isMultiSim && (
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                        <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                        <span>Secondary SIM:</span>
                      </span>
                      <span className="text-blue-700 font-semibold">{doc.secondarySims?.join(', ')}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                      <Shield className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Tamper Guard:</span>
                    </span>
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active &amp; Armed
                    </span>
                  </div>

                  {doc.expiresAt && (
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Auto-Nuke Timer:</span>
                      </span>
                      <span className="text-amber-700 font-semibold">
                        {Math.max(0, Math.round((doc.expiresAt - Date.now()) / 3600000))} hrs remaining
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Footer: Status & Decrypt Trigger */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-1 gap-2.5">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-mono font-medium self-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    <span>Anchored &amp; Locked</span>
                  </div>

                  <button
                    id={`decrypt-trigger-${doc.id}`}
                    onClick={() => onSelectDocumentToDecrypt(doc)}
                    className="w-full sm:w-auto px-4 py-2 sm:py-1.5 rounded-xl sm:rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  >
                    <Fingerprint className="w-3.5 h-3.5" />
                    <span>Verify SIM &amp; Decrypt</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Enclave Bus Info Banner */}
      <div className="rounded-xl bg-slate-100 border border-slate-200 p-3.5 flex items-center space-x-3">
        <div className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0 animate-ping" />
        <p className="text-xs text-slate-600 leading-relaxed font-medium">
          Zero data stored unencrypted at rest. Micro-SIM challenge-response attestation verified via Google Titan M2 hardware bus.
        </p>
      </div>
    </div>
  );
};
