import React, { useState } from 'react';
import {
  X,
  Shield,
  Fingerprint,
  Smartphone,
  Copy,
  Check,
  Download,
  Lock,
  Clock,
  KeyRound,
  FileText,
} from 'lucide-react';
import { VaultDocument } from '../types';
import { formatBytes } from '../utils/crypto';

interface DocumentModalProps {
  document: VaultDocument | null;
  onClose: () => void;
  onDownload: (doc: VaultDocument) => void;
  onVerifyDecrypt: (doc: VaultDocument) => void;
}

export const DocumentModal: React.FC<DocumentModalProps> = ({
  document,
  onClose,
  onDownload,
  onVerifyDecrypt,
}) => {
  const [copied, setCopied] = useState(false);

  if (!document) return null;

  const handleCopyHash = () => {
    navigator.clipboard?.writeText(document.sha256);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-2xl flex flex-col space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-slate-900 font-bold text-base truncate font-mono">
                {document.name}
              </span>
              <span className="text-xs text-slate-500 font-mono font-medium">
                Enclave Capsule ID: #{document.id}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cryptographic Specifications */}
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2.5 text-xs font-mono">
          <div className="flex items-center justify-between text-slate-500 font-medium">
            <span>FILE SIZE:</span>
            <span className="text-slate-900 font-bold">{formatBytes(document.sizeBytes)}</span>
          </div>

          <div className="flex items-center justify-between text-slate-500 font-medium">
            <span>ALGORITHM:</span>
            <span className="text-orange-600 font-bold">{document.algorithm}</span>
          </div>

          <div className="flex items-center justify-between text-slate-500 font-medium">
            <span>BOUND SIM IDENTITY:</span>
            <span className="text-slate-900 font-bold">{document.boundSim}</span>
          </div>

          {document.secondarySims && (
            <div className="flex items-center justify-between text-slate-500 font-medium">
              <span>SECONDARY SIMS:</span>
              <span className="text-slate-800 font-bold">{document.secondarySims.join(', ')}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-slate-500 font-medium">
            <span>BINDING RIGOR:</span>
            <span className="text-orange-600 uppercase font-bold">
              {document.bindingRigor === 'strict' ? 'Strict IMEI+IMSI' : 'Carrier Verified SMS'}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-500 font-medium">
            <span>ZERO-EXTRACT SANDBOX:</span>
            <span className="text-slate-900 font-bold">
              {document.policy?.zeroExtract ? 'Armed (No Export)' : 'Standard'}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-500 font-medium">
            <span>SEALED TIMESTAMP:</span>
            <span className="text-slate-800 font-bold">
              {new Date(document.createdAt).toLocaleString()}
            </span>
          </div>
        </div>

        {/* SHA-256 Fingerprint */}
        <div className="flex flex-col space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 font-medium">
            <span>CRYPTOGRAPHIC SHA-256 CHECKSUM</span>
            <button
              onClick={handleCopyHash}
              className="text-orange-600 hover:text-orange-700 font-bold flex items-center gap-1 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Hash'}</span>
            </button>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-800 break-all select-all font-medium">
            {document.sha256}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
          <button
            onClick={() => {
              onClose();
              onVerifyDecrypt(document);
            }}
            className="py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
          >
            <Fingerprint className="w-4 h-4" />
            <span>Decrypt in Verify SIM</span>
          </button>

          <button
            onClick={() => onDownload(document)}
            className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Download className="w-4 h-4 text-orange-600" />
            <span>Download .cplock</span>
          </button>
        </div>
      </div>
    </div>
  );
};
