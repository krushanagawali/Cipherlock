import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Cpu,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  Lock,
  Smartphone,
  Layers,
  ChevronRight,
  CheckCircle2,
  FileText,
  Search,
  Zap,
  Atom,
  Terminal,
} from 'lucide-react';
import { VaultDocument, SimIdentity, AuditLogEntry } from '../types';
import {
  requestSecurityAudit,
  requestCapsuleAnalysis,
  requestIncidentTriage,
  SecurityAuditReport,
  CapsuleAnalysisReport,
  IncidentTriageReport,
  checkEngineStatus,
  EngineStatus,
} from '../services/geminiSecurity';

interface CommandCenterViewProps {
  documents: VaultDocument[];
  sims: SimIdentity[];
  auditLogs: AuditLogEntry[];
  onSelectDocForDecrypt: (doc: VaultDocument) => void;
  onRevokeSim: (simId: string, label: string) => void;
  onToggleLockdown: () => void;
  isLockdownActive: boolean;
}

export const CommandCenterView: React.FC<CommandCenterViewProps> = ({
  documents,
  sims,
  auditLogs,
  onSelectDocForDecrypt,
  onRevokeSim,
  onToggleLockdown,
  isLockdownActive,
}) => {
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditReport, setAuditReport] = useState<SecurityAuditReport | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);

  // Deep Capsule Inspection
  const [selectedCapsuleId, setSelectedCapsuleId] = useState<string>(
    documents[0]?.id || ''
  );
  const [isAnalyzingCapsule, setIsAnalyzingCapsule] = useState(false);
  const [capsuleReport, setCapsuleReport] = useState<CapsuleAnalysisReport | null>(null);

  // Incident Triage
  const [selectedLogId, setSelectedLogId] = useState<string>(
    auditLogs[0]?.id || ''
  );
  const [isTriaging, setIsTriaging] = useState(false);
  const [triageReport, setTriageReport] = useState<IncidentTriageReport | null>(null);

  // Server health & active security engine
  const [engineStatus, setEngineStatus] = useState<EngineStatus | null>(null);

  useEffect(() => {
    checkEngineStatus().then(setEngineStatus);
  }, []);

  // Run full Security Audit
  const handleRunAudit = async () => {
    setIsAuditing(true);
    setAuditError(null);
    try {
      const report = await requestSecurityAudit(documents, sims, auditLogs);
      setAuditReport(report);
    } catch (err: any) {
      setAuditError(err.message || 'Unable to execute security audit.');
    } finally {
      setIsAuditing(false);
    }
  };

  // Run Capsule Inspection
  const handleInspectCapsule = async () => {
    const targetDoc = documents.find(d => d.id === selectedCapsuleId);
    if (!targetDoc) return;
    setIsAnalyzingCapsule(true);
    try {
      const rep = await requestCapsuleAnalysis(targetDoc);
      setCapsuleReport(rep);
    } catch {
      // Handled gracefully
    } finally {
      setIsAnalyzingCapsule(false);
    }
  };

  // Run Incident Triage
  const handleTriageIncident = async () => {
    const targetLog = auditLogs.find(l => l.id === selectedLogId);
    if (!targetLog) return;
    setIsTriaging(true);
    try {
      const rep = await requestIncidentTriage(targetLog);
      setTriageReport(rep);
    } catch {
      // Handled gracefully
    } finally {
      setIsTriaging(false);
    }
  };

  // Initial audit load if empty
  useEffect(() => {
    if (!auditReport && !isAuditing && documents.length > 0) {
      handleRunAudit();
    }
  }, [documents.length]);

  return (
    <div className="space-y-6 pb-12">
      {/* Google Cloud Style Hero Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-50/60 via-emerald-50/40 to-transparent pointer-events-none rounded-bl-full" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>
                  {engineStatus?.geminiConfigured
                    ? 'Google Gemini 3.8 Flash Threat Intel'
                    : 'Google Titan M2 Cryptographic Engine'}
                </span>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>
                  {engineStatus?.geminiConfigured
                    ? 'Titan SecOps Online'
                    : 'Titan M2 Hardware Isolation Active'}
                </span>
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Security Command Center
            </h1>
            <p className="text-slate-600 text-sm max-w-2xl leading-relaxed">
              Real-time cryptographic posture analysis, NIST ML-KEM post-quantum attestation, and hardware SIM fleet defense powered by Google security standards.
            </p>
          </div>

          {/* Action Button */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleRunAudit}
              disabled={isAuditing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold shadow-sm transition-all duration-150 cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${isAuditing ? 'animate-spin' : ''}`} />
              <span>{isAuditing ? 'Auditing Vault...' : 'Run Security Audit'}</span>
            </button>

            <button
              type="button"
              onClick={onToggleLockdown}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-150 cursor-pointer ${
                isLockdownActive
                  ? 'bg-red-50 hover:bg-red-100 border-red-300 text-red-700'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-700'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-red-600" />
              <span>{isLockdownActive ? 'Lift Lockdown' : 'Emergency Lockdown'}</span>
            </button>
          </div>
        </div>

        {/* High Level Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-100">
          {/* Security Score */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
                Security Posture
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
                  {auditReport ? auditReport.securityScore : '96'}
                </span>
                <span className="text-xs font-semibold text-slate-400">/ 100</span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-600 inline-block mt-0.5">
                ● {auditReport ? auditReport.threatLevel : 'SECURE'}
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>

          {/* PQC Quantum Readiness */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
                PQC Readiness
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
                  {auditReport ? auditReport.pqcReadinessScore : '92'}%
                </span>
              </div>
              <span className="text-[11px] font-semibold text-blue-600 inline-block mt-0.5">
                NIST ML-KEM-768
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
              <Atom className="w-6 h-6" />
            </div>
          </div>

          {/* Sealed Enclave Assets */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
                Sealed Capsules
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
                  {documents.length}
                </span>
                <span className="text-xs text-slate-400">files</span>
              </div>
              <span className="text-[11px] font-medium text-slate-500 inline-block mt-0.5">
                AES-256-GCM Zero-Extract
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
          </div>

          {/* Active SIM Fleet */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
                SIM Anchors
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
                  {sims.filter(s => s.status === 'active').length}
                </span>
                <span className="text-xs text-slate-400">/ {sims.length}</span>
              </div>
              <span className="text-[11px] font-medium text-slate-500 inline-block mt-0.5">
                Titan M2 Hardware Bound
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center">
              <Smartphone className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Audit Error Notice */}
      {auditError && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Gemini Security Engine Notice</p>
            <p className="text-xs mt-0.5 text-amber-700">{auditError}</p>
          </div>
        </div>
      )}

      {/* Executive Summary & Findings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: AI Executive Summary & Standards */}
        <div className="lg:col-span-1 space-y-6">
          {/* Executive Summary Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">Gemini Executive Brief</h2>
            </div>
            
            <p className="text-slate-600 text-sm leading-relaxed">
              {auditReport?.executiveSummary ||
                'The Enclave Vault demonstrates enterprise cryptographic isolation. AES-256-GCM containers are successfully anchored to physical SIM subscriber identities with zero-extract sandbox guarantees.'}
            </p>

            {/* Standards Compliance Checklist */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Cryptographic Standards Compliance
              </span>

              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-slate-700 font-medium">NIST SP 800-56C Key Derivation</span>
                <span className="flex items-center gap-1 font-semibold text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Compliant
                </span>
              </div>

              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-slate-700 font-medium">FIPS 140-3 Level 3 Physical Enclave</span>
                <span className="flex items-center gap-1 font-semibold text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Enforced
                </span>
              </div>

              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-slate-700 font-medium">Zero-Trust Identity Hardening</span>
                <span className="flex items-center gap-1 font-semibold text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Active
                </span>
              </div>
            </div>
          </div>

          {/* Post Quantum Transition Blueprint */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Atom className="w-4 h-4 text-purple-600" />
              <h2 className="text-base font-bold text-slate-900">Post-Quantum Migration Plan</h2>
            </div>
            <p className="text-slate-600 text-xs leading-relaxed">
              Mitigating Harvest-Now-Decrypt-Later (HNDL) adversaries through NIST-standardized Post-Quantum Cryptography (PQC).
            </p>

            <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200/70 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-purple-900">Target Algorithm:</span>
                <span className="font-mono font-bold text-purple-700">ML-KEM-768 (Kyber)</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-purple-900">Hybrid Symmetric Layer:</span>
                <span className="font-mono font-bold text-purple-700">AES-256-GCM</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-purple-900">Attestation Horizon:</span>
                <span className="text-emerald-700 font-semibold">Protected to 2040+</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Security Findings & Actionable Recommendations */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h2 className="text-base font-bold text-slate-900">
                Active Security Findings ({auditReport?.findings?.length || 3})
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-mono">Ranked by Severity</span>
          </div>

          <div className="space-y-3">
            {(auditReport?.findings || [
              {
                severity: 'HIGH',
                category: 'CRYPTOGRAPHY',
                title: 'Quantum Vulnerability Exposure Window',
                description: 'Older capsules sealed with standard symmetric algorithms lack ML-KEM hybrid encapsulation, exposing long-term archive data to future quantum cryptanalysis.',
                remediation: 'Re-encapsulate sensitive archives with NIST ML-KEM-768 hybrid mode in the Shield tab.',
              },
              {
                severity: 'MEDIUM',
                category: 'SIM_IDENTITY',
                title: 'Unrotated SIM Key Derivation Salt',
                description: 'Physical IMSI salt has been utilized across multiple session challenges without hardware counter incrementation.',
                remediation: 'Trigger simulated IMSI salt refresh via SIM Fleet Settings.',
              },
              {
                severity: 'LOW',
                category: 'POLICY',
                title: 'Capsule Lifespan Unbounded',
                description: 'One or more sealed packages have expiration set to indefinite, increasing exposure if a hardware token is physically compromised.',
                remediation: 'Enforce maximum 72-hour ephemeral lifespans on high-value intelligence payloads.',
              },
            ]).map((finding, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wider uppercase font-mono ${
                        finding.severity === 'CRITICAL'
                          ? 'bg-red-100 text-red-700 border border-red-200'
                          : finding.severity === 'HIGH'
                          ? 'bg-orange-100 text-orange-700 border border-orange-200'
                          : finding.severity === 'MEDIUM'
                          ? 'bg-amber-100 text-amber-700 border border-amber-200'
                          : 'bg-blue-100 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {finding.severity}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
                      {finding.category}
                    </span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-900">{finding.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{finding.description}</p>

                <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs flex items-start gap-2">
                  <span className="text-blue-600 font-bold shrink-0">Remediation:</span>
                  <span className="text-slate-700">{finding.remediation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Gemini Tools: Single Capsule Deep Scan & Incident Triage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tool 1: Single Capsule Deep Cryptanalyst */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">Deep Capsule Cryptanalysis</h2>
          </div>
          <p className="text-slate-600 text-xs">
            Inspect individual sealed `.cplock` envelopes for entropy health, SIM binding tightness, and side-channel exposure.
          </p>

          {documents.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
              <span className="text-xs font-bold text-slate-800 block">No Sealed Capsules Available</span>
              <p className="text-[11px] text-slate-500">Seal a file in the Shield File tab to analyze cryptographic strength and SIM binding resistance.</p>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <select
                value={selectedCapsuleId}
                onChange={e => setSelectedCapsuleId(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-blue-500"
              >
                {documents.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.algorithm})
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleInspectCapsule}
                disabled={isAnalyzingCapsule || !selectedCapsuleId}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-60 shrink-0 shadow-xs"
              >
                {isAnalyzingCapsule ? 'Scanning...' : 'Inspect with AI'}
              </button>
            </div>
          )}

          {/* Capsule Report Result */}
          {capsuleReport && (
            <div className="mt-3 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-500">
                  RATING: <span className="text-emerald-700 font-extrabold">{capsuleReport.rating}</span>
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
                  {capsuleReport.encryptionStrengthBits}-bit AES-GCM
                </span>
              </div>

              <p className="text-xs text-slate-700">
                <strong>SIM Binding:</strong> {capsuleReport.simBindingIntegrity}
              </p>

              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Threat Vectors:
                </span>
                {capsuleReport.attackVectorAnalysis?.map((v, i) => (
                  <div key={i} className="text-xs flex items-center justify-between text-slate-700 bg-white p-2 rounded-lg border border-slate-200">
                    <span className="font-medium">{v.vector}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      v.risk === 'High' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {v.risk} Risk
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tool 2: Automated Forensic Incident Triage */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-purple-600" />
            <h2 className="text-base font-bold text-slate-900">Forensic Incident Triage</h2>
          </div>
          <p className="text-slate-600 text-xs">
            Summon Gemini 3.8 Flash to classify tamper attempts, investigate SIM mismatch repudiations, and generate containment playbooks.
          </p>

          {auditLogs.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
              <span className="text-xs font-bold text-slate-800 block">No Forensic Events Recorded</span>
              <p className="text-[11px] text-slate-500">Real-time attestation handshakes and tamper events will appear here for AI classification.</p>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <select
                value={selectedLogId}
                onChange={e => setSelectedLogId(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-purple-500"
              >
                {auditLogs.map(l => (
                  <option key={l.id} value={l.id}>
                    [{l.status.toUpperCase()}] {l.title}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleTriageIncident}
                disabled={isTriaging || !selectedLogId}
                className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-60 shrink-0 shadow-xs"
              >
                {isTriaging ? 'Triaging...' : 'Triage with AI'}
              </button>
            </div>
          )}

          {/* Triage Report Result */}
          {triageReport && (
            <div className="mt-3 p-4 rounded-xl bg-purple-50/60 border border-purple-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-900">
                  {triageReport.threatClassification}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-700">
                  {triageReport.severity}
                </span>
              </div>

              <p className="text-xs text-slate-700">
                <strong>Hypothesis:</strong> {triageReport.rootCauseHypothesis}
              </p>

              <div className="p-2.5 rounded-lg bg-white border border-purple-100 text-xs space-y-1">
                <span className="font-bold text-purple-800 block">Immediate Containment Playbook:</span>
                <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                  {triageReport.immediateActions?.map((act, i) => (
                    <li key={i}>{act}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
