import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Unsubscribe
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { VaultDocument, SimIdentity, AuditLogEntry } from '../types';

export function subscribeToUserVault(
  userId: string,
  callbacks: {
    onDocuments: (docs: VaultDocument[]) => void;
    onSims: (sims: SimIdentity[]) => void;
    onAuditLogs: (logs: AuditLogEntry[]) => void;
  }
): () => void {
  const unsubscribes: Unsubscribe[] = [];

  // 1. Vault Documents
  const docsPath = `users/${userId}/vault_documents`;
  try {
    const docsRef = collection(db, 'users', userId, 'vault_documents');
    const unsubDocs = onSnapshot(
      docsRef,
      (snapshot) => {
        const loaded: VaultDocument[] = [];
        snapshot.forEach((docSnap) => {
          loaded.push(docSnap.data() as VaultDocument);
        });
        callbacks.onDocuments(loaded);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, docsPath);
      }
    );
    unsubscribes.push(unsubDocs);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, docsPath);
  }

  // 2. SIM Identities
  const simsPath = `users/${userId}/sim_identities`;
  try {
    const simsRef = collection(db, 'users', userId, 'sim_identities');
    const unsubSims = onSnapshot(
      simsRef,
      (snapshot) => {
        const loaded: SimIdentity[] = [];
        snapshot.forEach((docSnap) => {
          loaded.push(docSnap.data() as SimIdentity);
        });
        callbacks.onSims(loaded);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, simsPath);
      }
    );
    unsubscribes.push(unsubSims);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, simsPath);
  }

  // 3. Audit Logs
  const logsPath = `users/${userId}/audit_logs`;
  try {
    const logsRef = collection(db, 'users', userId, 'audit_logs');
    const q = query(logsRef, orderBy('timestamp', 'desc'));
    const unsubLogs = onSnapshot(
      q,
      (snapshot) => {
        const loaded: AuditLogEntry[] = [];
        snapshot.forEach((docSnap) => {
          loaded.push(docSnap.data() as AuditLogEntry);
        });
        callbacks.onAuditLogs(loaded);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, logsPath);
      }
    );
    unsubscribes.push(unsubLogs);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, logsPath);
  }

  return () => {
    unsubscribes.forEach((unsub) => unsub());
  };
}

export async function saveVaultDocumentToFirestore(userId: string, vaultDoc: VaultDocument): Promise<void> {
  const cleanId = vaultDoc.id.replace(/[^a-zA-Z0-9_-]/g, '_');
  const path = `users/${userId}/vault_documents/${cleanId}`;
  try {
    const payload = {
      id: cleanId,
      name: vaultDoc.name || 'Untitled Capsule',
      originalName: vaultDoc.originalName || 'file.bin',
      sizeBytes: vaultDoc.sizeBytes || 0,
      mimeType: vaultDoc.mimeType || 'application/octet-stream',
      sha256: vaultDoc.sha256 || '',
      boundSim: vaultDoc.boundSim || '',
      boundSimLabel: vaultDoc.boundSimLabel || '',
      bindingRigor: vaultDoc.bindingRigor || 'strict',
      secondarySims: vaultDoc.secondarySims || [],
      policy: vaultDoc.policy || {
        zeroExtract: true,
        autoNukeOnSimSwap: false,
        expirationHours: 0,
        requireBiometrics: false,
        requirePin: false,
      },
      status: vaultDoc.status || 'locked',
      decryptionsCount: vaultDoc.decryptionsCount || 0,
      algorithm: vaultDoc.algorithm || 'AES-256-GCM',
      ownerId: userId,
      createdAt: vaultDoc.createdAt || Date.now(),
      rawContainerJson: vaultDoc.rawContainerJson || ''
    };
    await setDoc(doc(db, 'users', userId, 'vault_documents', cleanId), payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteVaultDocumentFromFirestore(userId: string, docId: string): Promise<void> {
  const cleanId = docId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const path = `users/${userId}/vault_documents/${cleanId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'vault_documents', cleanId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveSimIdentityToFirestore(userId: string, sim: SimIdentity): Promise<void> {
  const cleanId = sim.id.replace(/[^a-zA-Z0-9_-]/g, '_');
  const path = `users/${userId}/sim_identities/${cleanId}`;
  try {
    const payload = {
      id: cleanId,
      phoneNumber: sim.phoneNumber || '',
      label: sim.label || '',
      carrier: sim.carrier || 'Unknown',
      imsiHash: sim.imsiHash || '',
      deviceModel: sim.deviceModel || '',
      role: sim.role || 'Member',
      isOwner: !!sim.isOwner,
      status: sim.status || 'active',
      decryptionsCount: sim.decryptionsCount || 0,
      enclaveType: sim.enclaveType || 'Hardware eUICC',
      ownerId: userId
    };
    await setDoc(doc(db, 'users', userId, 'sim_identities', cleanId), payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveAuditLogToFirestore(userId: string, log: AuditLogEntry): Promise<void> {
  const cleanId = log.id.replace(/[^a-zA-Z0-9_-]/g, '_');
  const path = `users/${userId}/audit_logs/${cleanId}`;
  try {
    const payload = {
      id: cleanId,
      timestamp: log.timestamp || Date.now(),
      type: log.type || 'integrity_check',
      title: log.title || 'Security Event',
      details: log.details || '',
      simNumber: log.simNumber || '',
      status: log.status || 'success',
      ipAddress: log.ipAddress || '127.0.0.1',
      enclaveHash: log.enclaveHash || '',
      ownerId: userId
    };
    await setDoc(doc(db, 'users', userId, 'audit_logs', cleanId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}
