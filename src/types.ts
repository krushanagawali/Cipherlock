import { EncryptedContainer } from './utils/crypto';

export type TabType = 'vault' | 'shield' | 'verify' | 'audit' | 'command_center';

export type BindingRigor = 'strict' | 'relaxed';

export interface CryptographicPolicy {
  zeroExtract: boolean;
  autoNukeOnSimSwap: boolean;
  expirationHours: number; // 0 = never
  requireBiometrics: boolean;
  requirePin: boolean;
  pinCode?: string;
  pqcKyberHybrid?: boolean; // NIST ML-KEM-768 Post-Quantum Resistance
}

export interface VaultDocument {
  id: string;
  name: string;
  originalName: string;
  sizeBytes: number;
  mimeType: string;
  sha256: string;
  boundSim: string;
  boundSimLabel?: string;
  secondarySims?: string[];
  targetRecipient?: string;
  bindingRigor: BindingRigor;
  policy: CryptographicPolicy;
  createdAt: number;
  expiresAt: number | null;
  status: 'locked' | 'unlocked' | 'revoked' | 'destroyed';
  decryptionsCount: number;
  lastDecryptedAt?: number;
  algorithm: string;
  pqcEnabled?: boolean;
  aiRiskRating?: 'LOW' | 'MEDIUM' | 'HIGH';
  // Raw container and encrypted data
  rawContainer?: EncryptedContainer;
  rawContainerJson?: string;
  encryptedPackageBase64?: string;
  // Unencrypted preview content for sandbox viewing once unlocked
  previewContent?: string;
  previewType?: 'text' | 'image' | 'pdf_mock' | 'binary';
  decryptedBlobUrl?: string;
}

export interface SimIdentity {
  id: string;
  phoneNumber: string;
  label: string;
  carrier: string;
  imsiHash: string;
  deviceModel: string;
  role: string;
  isOwner: boolean;
  status: 'active' | 'revoked' | 'pending';
  lastAccess?: string;
  decryptionsCount: number;
  enclaveType: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  type: 
    | 'decryption_success'
    | 'decryption_failure'
    | 'shield_created'
    | 'key_revoked'
    | 'lockdown_engaged'
    | 'lockdown_lifted'
    | 'kill_switch'
    | 'integrity_check'
    | 'sim_authorized';
  title: string;
  details: string;
  simNumber?: string;
  status: 'success' | 'warning' | 'breach' | 'revoked';
  ipAddress?: string;
  enclaveHash?: string;
}

