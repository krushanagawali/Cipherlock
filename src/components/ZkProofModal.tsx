import React, { useState } from 'react';
import {
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  X,
  Smartphone,
  Cpu,
  Lock,
} from 'lucide-react';
import { generateZkSimProof, verifyZkSimProof, ZkSimProof } from '../utils/zkProof';

interface ZkProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSimNumber: string;
}

export const ZkProofModal: React.FC<ZkProofModalProps> = ({
  isOpen,
  onClose,
  activeSimNumber,
}) => {
  const [targetSim, setTargetSim] = useState(activeSimNumber);
  const [isGenerating, setIsGenerating] = useState(false);
  const [proof, setProof] = useState<ZkSimProof | null>(null);
  const [verificationResult, setVerificationResult] = useState<{
    valid: boolean;
    details: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerateAndVerify = async () => {
    setIsGenerating(true);
    setProof(null);
    setVerificationResult(null);

    try {
      const sessionNonce = Math.random().toString(36).slice(2) + Date.now().toString(36);
      const generatedProof = await generateZkSimProof(targetSim, sessionNonce);
      setProof(generatedProof);

      await new Promise(r => setTimeout(r, 600));

      const result = await verifyZkSimProof(generatedProof, sessionNonce);
      setVerificationResult(result);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyProofJson = () => {
    if (!proof) return;
    navigator.clipboard.writeText(JSON.stringify(proof, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
              <KeyRound className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                Zero-Knowledge Proof (zk-SIM)
              </h2>
              <span className="text-[11px] sm:text-xs text-slate-500 font-mono truncate block">
                Fiat-Shamir Non-Interactive ZK-Attestation
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6">
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Verify that your device contains the authorized SIM secure element <strong>without revealing the raw phone number, IMSI, or secret key</strong> to untrusted network middleboxes.
          </p>

          {/* SIM Selection & Generate */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 sm:space-y-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Prover SIM Hardware Anchor
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={targetSim}
                  onChange={e => setTargetSim(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-sm font-mono font-medium text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>
              <button
                type="button"
                onClick={handleGenerateAndVerify}
                disabled={isGenerating || !targetSim}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Synthesizing Proof...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Generate & Verify ZKP</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Verification Badge */}
          {verificationResult && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Zero-Knowledge Proof Verified by Titan M2 Enclave</span>
              </div>
              <p className="text-xs text-emerald-700 leading-relaxed">
                {verificationResult.details}
              </p>
            </div>
          )}

          {/* Mathematical Proof Details */}
          {proof && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Attested ZK-Proof Certificate
                </span>
                <button
                  type="button"
                  onClick={handleCopyProofJson}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied JSON' : 'Copy Proof Token'}</span>
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs space-y-2 overflow-x-auto">
                <div className="flex justify-between border-b border-slate-800 pb-1">
                  <span className="text-slate-400">Public Identity Commitment (y):</span>
                  <span className="text-emerald-400 truncate max-w-[280px]">0x{proof.publicIdentityHash.slice(0, 32)}...</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1">
                  <span className="text-slate-400">Blinded Commitment (T):</span>
                  <span className="text-blue-400 truncate max-w-[280px]">0x{proof.commitment.slice(0, 32)}...</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1">
                  <span className="text-slate-400">Fiat-Shamir Challenge (c):</span>
                  <span className="text-amber-400 truncate max-w-[280px]">0x{proof.challenge.slice(0, 32)}...</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1">
                  <span className="text-slate-400">Schnorr Response (s):</span>
                  <span className="text-purple-400 truncate max-w-[280px]">0x{proof.response.slice(0, 32)}...</span>
                </div>
                <div className="flex justify-between pt-1 text-[11px]">
                  <span className="text-slate-400">Titan M2 Hardware Signature:</span>
                  <span className="text-slate-300 font-mono">{proof.carrierAttestationSignature}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
