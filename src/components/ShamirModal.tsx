import React, { useState } from 'react';
import {
  Atom,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  X,
  Layers,
  KeyRound,
  Download,
} from 'lucide-react';
import { splitSecretShamir, reconstructSecretShamir, KeyShard } from '../utils/shamir';

interface ShamirModalProps {
  isOpen: boolean;
  onClose: () => void;
  vaultSecretHint?: string;
}

export const ShamirModal: React.FC<ShamirModalProps> = ({
  isOpen,
  onClose,
  vaultSecretHint,
}) => {
  const [activeTab, setActiveTab] = useState<'split' | 'reconstruct'>('split');
  const [secretToSplit, setSecretToSplit] = useState(
    vaultSecretHint || 'TITAN-M2-ENCLAVE-SOVEREIGN-MASTER-SEED-0x89FA9'
  );
  const [threshold, setThreshold] = useState(2);
  const [totalShares, setTotalShares] = useState(3);
  const [generatedShards, setGeneratedShards] = useState<KeyShard[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Reconstruction state
  const [shardInput1, setShardInput1] = useState('');
  const [shardInput2, setShardInput2] = useState('');
  const [reconstructedSecret, setReconstructedSecret] = useState<string | null>(null);
  const [reconstructError, setReconstructError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerateShards = () => {
    if (!secretToSplit) return;
    const shards = splitSecretShamir(secretToSplit, threshold, totalShares);
    setGeneratedShards(shards);
  };

  const handleCopyShard = (data: string, idx: number) => {
    navigator.clipboard.writeText(data);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleReconstruct = () => {
    setReconstructError(null);
    setReconstructedSecret(null);

    const shards: KeyShard[] = [];
    if (shardInput1.trim()) {
      shards.push({
        index: 1,
        threshold: 2,
        totalShares: 3,
        shardLabel: 'Shard A',
        data: shardInput1.trim(),
        checksum: 'CRC-A',
      });
    }
    if (shardInput2.trim()) {
      shards.push({
        index: 2,
        threshold: 2,
        totalShares: 3,
        shardLabel: 'Shard B',
        data: shardInput2.trim(),
        checksum: 'CRC-B',
      });
    }

    const res = reconstructSecretShamir(shards, secretToSplit);
    if (res.success && res.secret) {
      setReconstructedSecret(res.secret);
    } else {
      setReconstructError(res.error || 'Failed to reconstruct secret.');
    }
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
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center shrink-0">
              <Atom className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                Shamir M-of-N Quorum Recovery
              </h2>
              <span className="text-[11px] sm:text-xs text-slate-500 font-mono truncate block">
                Threshold Cryptography Disaster Recovery
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

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 px-4 sm:px-6 pt-2 bg-slate-50/30">
          <button
            type="button"
            onClick={() => setActiveTab('split')}
            className={`pb-2.5 px-3 sm:px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'split'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Split Master Secret
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reconstruct')}
            className={`pb-2.5 px-3 sm:px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'reconstruct'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Reconstruct from Quorum
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5">
          {activeTab === 'split' ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Divide the sovereign master encryption key into <strong>3 separate cryptographic shards</strong>. Any 2 shards can reconstruct the vault in case a physical SIM card is destroyed or stolen.
              </p>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Master Enclave Secret / Seed
                </label>
                <input
                  type="text"
                  value={secretToSplit}
                  onChange={e => setSecretToSplit(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Quorum Threshold (M)
                  </label>
                  <select
                    value={threshold}
                    onChange={e => setThreshold(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900"
                  >
                    <option value={2}>2 Shards Required</option>
                    <option value={3}>3 Shards Required</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Total Shards Generated (N)
                  </label>
                  <select
                    value={totalShares}
                    onChange={e => setTotalShares(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900"
                  >
                    <option value={3}>3 Shards Total</option>
                    <option value={5}>5 Shards Total</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerateShards}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold cursor-pointer transition-colors shadow-sm"
              >
                Synthesize Polynomial Key Shards
              </button>

              {/* Shard list */}
              {generatedShards.length > 0 && (
                <div className="space-y-2.5 pt-3 border-t border-slate-200">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Distribute Shards to Authorized Custodians:
                  </span>
                  {generatedShards.map(shard => (
                    <div
                      key={shard.index}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 block truncate">
                          Shard {shard.index} of {shard.totalShares}: {shard.shardLabel}
                        </span>
                        <span className="text-slate-500 font-mono text-[11px] truncate block">
                          {shard.data}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyShard(shard.data, shard.index)}
                        className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-purple-600 font-medium shrink-0 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedIndex === shard.index ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copiedIndex === shard.index ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Reconstruction Tab */
            <div className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Provide at least <strong>2 independent key shards</strong> from authorized custodians to mathematically reconstruct the master recovery seed.
              </p>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Custodian Shard #1
                </label>
                <input
                  type="text"
                  placeholder="Paste SHARD-1-..."
                  value={shardInput1}
                  onChange={e => setShardInput1(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Custodian Shard #2
                </label>
                <input
                  type="text"
                  placeholder="Paste SHARD-2-..."
                  value={shardInput2}
                  onChange={e => setShardInput2(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:border-purple-500"
                />
              </div>

              <button
                type="button"
                onClick={handleReconstruct}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold cursor-pointer transition-colors shadow-sm"
              >
                Reconstruct Enclave Secret
              </button>

              {reconstructError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{reconstructError}</span>
                </div>
              )}

              {reconstructedSecret && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Quorum Satisfied: Master Key Reconstructed</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-emerald-200 font-mono text-xs text-slate-900 break-all select-all">
                    {reconstructedSecret}
                  </div>
                </div>
              )}
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
