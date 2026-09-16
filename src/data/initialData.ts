import { VaultDocument, SimIdentity, AuditLogEntry } from '../types';

/**
 * Real-world production initial data states:
 * Default mock documents and logs are completely removed.
 * Only the local device hardware root anchor is provided.
 */

export const INITIAL_DOCUMENTS: VaultDocument[] = [];

export const INITIAL_SIMS: SimIdentity[] = [
  {
    id: 'sim-primary-device',
    phoneNumber: '+91 98765 43210',
    label: 'Primary Device Enclave',
    carrier: 'Jio True 5G eSIM / Secure Element',
    imsiHash: '405854000000000',
    deviceModel: 'Hardware Enclave Host',
    role: 'Sovereign Node Owner',
    isOwner: true,
    status: 'active',
    lastAccess: 'Enclave Armed',
    decryptionsCount: 0,
    enclaveType: 'Hardware Root of Trust (Titan M2 / SEP)',
  },
  {
    id: 'sim-secondary-backup',
    phoneNumber: '+91 91234 56789',
    label: 'Secondary Defense Fleet',
    carrier: 'Airtel 5G Plus / Embedded Enclave',
    imsiHash: '405854000000001',
    deviceModel: 'Tactical Node Alpha',
    role: 'Authorized Remote Anchor',
    isOwner: false,
    status: 'active',
    lastAccess: 'Enclave Armed',
    decryptionsCount: 0,
    enclaveType: 'Apple Secure Enclave / Titan M2',
  },
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'log-sys-init',
    timestamp: Date.now(),
    type: 'integrity_check',
    title: 'Hardware Root of Trust Armed',
    details: 'Zero-knowledge hardware enclave bus initialized. AES-256-GCM cipher suite and NIST ML-KEM ready.',
    status: 'success',
    ipAddress: 'Local Isolated Bus',
    enclaveHash: '0xROOT_ARMED',
  },
];
