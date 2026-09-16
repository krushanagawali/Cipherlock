import { VaultDocument, SimIdentity, AuditLogEntry } from '../types';

export interface SecurityFinding {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  category: 'CRYPTOGRAPHY' | 'SIM_IDENTITY' | 'POLICY' | 'TAMPER_EVENT';
  title: string;
  description: string;
  remediation: string;
}

export interface SecurityAuditReport {
  securityScore: number;
  threatLevel: 'SECURE' | 'ELEVATED' | 'CRITICAL';
  pqcReadinessScore: number;
  executiveSummary: string;
  findings: SecurityFinding[];
  pqcMigrationPlan: {
    currentHorizonRisk: string;
    recommendedAlgorithms: string[];
    quantumVulnerableAssets: number;
  };
  complianceStatus: {
    nistSp800_56c: boolean;
    fips140_3Level3: boolean;
    zeroTrustIdentity: boolean;
  };
}

export interface CapsuleAnalysisReport {
  capsuleId: string;
  rating: 'GRADE_A_MIL_SPEC' | 'GRADE_B_ENTERPRISE' | 'GRADE_C_REQUIRES_ATTENTION';
  encryptionStrengthBits: number;
  simBindingIntegrity: string;
  quantumVulnerability: 'SAFE_HYBRID_READY' | 'VULNERABLE_TO_SHORS_ALGORITHM' | 'POST_QUANTUM_RESISTANT';
  attackVectorAnalysis: {
    vector: string;
    risk: 'Low' | 'Medium' | 'High';
    mitigation: string;
  }[];
  recommendations: string[];
}

export interface IncidentTriageReport {
  triageId: string;
  threatClassification: string;
  severity: string;
  rootCauseHypothesis: string;
  confidenceScore: number;
  immediateActions: string[];
  automatedCountermeasureTaken: string;
}

export interface EngineStatus {
  geminiConfigured: boolean;
  activeEngine: string;
  mode: string;
}

export async function checkEngineStatus(): Promise<EngineStatus> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) return { geminiConfigured: false, activeEngine: 'Titan M2 Autonomous Engine', mode: 'autonomous_hardware_enclave' };
    const data = await res.json();
    return {
      geminiConfigured: !!data.geminiConfigured,
      activeEngine: data.activeEngine || 'Titan M2 Autonomous Engine',
      mode: data.mode || 'autonomous_hardware_enclave',
    };
  } catch {
    return { geminiConfigured: false, activeEngine: 'Titan M2 Autonomous Engine', mode: 'autonomous_hardware_enclave' };
  }
}

export async function checkServerGeminiStatus(): Promise<boolean> {
  try {
    const status = await checkEngineStatus();
    return status.geminiConfigured;
  } catch {
    return false;
  }
}

export async function requestSecurityAudit(
  documents: VaultDocument[],
  sims: SimIdentity[],
  logs: AuditLogEntry[]
): Promise<SecurityAuditReport> {
  const res = await fetch('/api/gemini/security-audit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ documents, sims, logs }),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to generate security audit');
  }

  return json.data as SecurityAuditReport;
}

export async function requestCapsuleAnalysis(
  capsule: VaultDocument
): Promise<CapsuleAnalysisReport> {
  const res = await fetch('/api/gemini/analyze-capsule', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ capsule }),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to analyze capsule');
  }

  return json.data as CapsuleAnalysisReport;
}

export async function requestIncidentTriage(
  event: AuditLogEntry
): Promise<IncidentTriageReport> {
  const res = await fetch('/api/gemini/incident-triage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event }),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to triage incident');
  }

  return json.data as IncidentTriageReport;
}
