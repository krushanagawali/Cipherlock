import React, { useState, useEffect, useRef } from 'react';
import { TabType, VaultDocument, SimIdentity, AuditLogEntry } from './types';
import { INITIAL_DOCUMENTS, INITIAL_SIMS, INITIAL_AUDIT_LOGS } from './data/initialData';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { VaultView } from './components/VaultView';
import { ShieldView } from './components/ShieldView';
import { VerifyView } from './components/VerifyView';
import { AuditView } from './components/AuditView';
import { CommandCenterView } from './components/CommandCenterView';
import { DocumentModal } from './components/DocumentModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { OfflineIndicator } from './components/OfflineIndicator';
import { enclaveAudio } from './utils/audio';
import { EncryptedContainer, areSimNumbersMatching } from './utils/crypto';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  testFirestoreConnection,
} from './services/firebase';
import {
  subscribeToUserVault,
  saveVaultDocumentToFirestore,
  deleteVaultDocumentFromFirestore,
  saveSimIdentityToFirestore,
  saveAuditLogToFirestore,
} from './services/vaultSync';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('vault');

  // Firebase auth & cloud sync state
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const isInitialSyncDone = useRef(false);

  // Load from localStorage or use initial preloaded data
  const [documents, setDocuments] = useState<VaultDocument[]>(() => {
    try {
      const saved = localStorage.getItem('cipherlock_docs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((d: any) => ({
            ...d,
            policy: d.policy || {
              zeroExtract: true,
              autoNukeOnSimSwap: false,
              expirationHours: 0,
              requireBiometrics: false,
              requirePin: false,
            },
          }));
        }
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_DOCUMENTS;
  });

  const [sims, setSims] = useState<SimIdentity[]>(() => {
    try {
      const saved = localStorage.getItem('cipherlock_sims');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_SIMS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem('cipherlock_logs');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_AUDIT_LOGS;
  });

  const [activeSimNumber, setActiveSimNumber] = useState<string>(() => sims[0]?.phoneNumber || '+91 98765 43210');
  const [isLockdownActive, setIsLockdownActive] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [selectedDocForDecrypt, setSelectedDocForDecrypt] = useState<VaultDocument | null>(null);
  const [inspectingDoc, setInspectingDoc] = useState<VaultDocument | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Count breaches
  const breachCount = auditLogs.filter(l => l.status === 'breach').length;

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('cipherlock_docs', JSON.stringify(documents));
    } catch (e) {
      console.error(e);
    }
  }, [documents]);

  useEffect(() => {
    try {
      localStorage.setItem('cipherlock_sims', JSON.stringify(sims));
    } catch (e) {
      console.error(e);
    }
  }, [sims]);

  useEffect(() => {
    try {
      localStorage.setItem('cipherlock_logs', JSON.stringify(auditLogs));
    } catch (e) {
      console.error(e);
    }
  }, [auditLogs]);

  // Test connection to Firestore on initial boot
  useEffect(() => {
    testFirestoreConnection();
  }, []);

  // Handle Firebase Auth state & Firestore subscription
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        addToast(`Connected to Firebase: ${user.email || 'Google User'}`, 'success');
        setIsSyncing(true);

        const unsubVault = subscribeToUserVault(user.uid, {
          onDocuments: (loadedDocs) => {
            if (loadedDocs && loadedDocs.length > 0) {
              const normalized = loadedDocs.map((d: any) => ({
                ...d,
                policy: d.policy || {
                  zeroExtract: true,
                  autoNukeOnSimSwap: false,
                  expirationHours: 0,
                  requireBiometrics: false,
                  requirePin: false,
                },
              }));
              setDocuments(normalized);
            } else if (!isInitialSyncDone.current) {
              // Seed initial documents to cloud on first login
              documents.forEach((d) => saveVaultDocumentToFirestore(user.uid, d));
            }
            setIsSyncing(false);
          },
          onSims: (loadedSims) => {
            if (loadedSims && loadedSims.length > 0) {
              setSims(loadedSims);
            } else if (!isInitialSyncDone.current) {
              sims.forEach((s) => saveSimIdentityToFirestore(user.uid, s));
            }
          },
          onAuditLogs: (loadedLogs) => {
            if (loadedLogs && loadedLogs.length > 0) {
              setAuditLogs(loadedLogs);
            } else if (!isInitialSyncDone.current) {
              auditLogs.forEach((l) => saveAuditLogToFirestore(user.uid, l));
            }
          },
        });

        isInitialSyncDone.current = true;
        return () => {
          unsubVault();
        };
      } else {
        isInitialSyncDone.current = false;
        setIsSyncing(false);
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Firebase Sign In error:', err);
      addToast('Authentication cancelled or failed. Please check browser popups.', 'error');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      addToast('Signed out of Firebase. Using local offline cache.', 'info');
    } catch (err) {
      console.error('Firebase Sign Out error:', err);
    }
  };

  const addToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts(prev => [...prev, { id, text, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleToggleAudio = () => {
    const nextState = !audioEnabled;
    setAudioEnabled(nextState);
    enclaveAudio.enabled = nextState;
    addToast(nextState ? 'Tactile Sound Effects Enabled' : 'Tactile Sound Effects Muted', 'info');
  };

  const handleSelectActiveSim = (newSim: string) => {
    setActiveSimNumber(newSim);
    addToast(`Active Device SIM Switched: ${newSim}`, 'info');
  };

  // Shield new document callback
  const handleDocumentSealed = (newDoc: VaultDocument, cplockJson: string) => {
    setDocuments(prev => [newDoc, ...prev]);

    const newLog: AuditLogEntry = {
      id: 'log-' + Date.now(),
      timestamp: Date.now(),
      type: 'shield_created',
      title: `Capsule Sealed: ${newDoc.name}`,
      details: `Compiled with AES-256-GCM. Bound to SIM ${newDoc.boundSim}. Zero-Extract: ${newDoc.policy?.zeroExtract ? 'ON' : 'OFF'}.`,
      simNumber: newDoc.boundSim,
      status: 'success',
      ipAddress: 'Local Secure Element',
      enclaveHash: '0x' + newDoc.sha256.slice(0, 8).toUpperCase(),
    };
    setAuditLogs(prev => [newLog, ...prev]);
    addToast(`Document successfully sealed into Vault: ${newDoc.name}`);

    if (currentUser) {
      saveVaultDocumentToFirestore(currentUser.uid, newDoc);
      saveAuditLogToFirestore(currentUser.uid, newLog);
    }
  };

  // Import external .cplock container
  const handleImportContainer = (container: EncryptedContainer, rawJson: string) => {
    const importedDoc: VaultDocument = {
      id: 'imported-' + Date.now(),
      name: container.originalName.endsWith('.cplock') ? container.originalName : `${container.originalName}.cplock`,
      originalName: container.originalName,
      sizeBytes: container.sizeBytes,
      mimeType: container.mimeType,
      sha256: container.fileSha256,
      boundSim: container.boundSim,
      boundSimLabel: `Imported SIM Anchor (${container.boundSim})`,
      bindingRigor: 'strict',
      policy: {
        zeroExtract: container.policy?.zeroExtract ?? true,
        autoNukeOnSimSwap: container.policy?.autoNukeOnSimSwap ?? false,
        expirationHours: container.policy?.expirationTimestamp ? 24 : 0,
        requireBiometrics: container.policy?.requireBiometrics ?? false,
        requirePin: false,
      },
      createdAt: container.sealedAt,
      expiresAt: container.policy?.expirationTimestamp ?? null,
      status: 'locked',
      decryptionsCount: 0,
      algorithm: container.cipher,
      rawContainer: container,
      rawContainerJson: rawJson,
      encryptedPackageBase64: container.encryptedPayloadBase64,
    };

    setDocuments(prev => [importedDoc, ...prev]);
    if (container.boundSim && !areSimNumbersMatching(container.boundSim, activeSimNumber)) {
      setActiveSimNumber(container.boundSim);
    }
    setSelectedDocForDecrypt(importedDoc);
    setCurrentTab('verify');
    addToast(`Imported external container: ${importedDoc.name}`);

    if (currentUser) {
      saveVaultDocumentToFirestore(currentUser.uid, importedDoc);
    }
  };

  // Switch to decrypt view with smart SIM alignment
  const handleSelectDocToDecrypt = (doc: VaultDocument) => {
    setSelectedDocForDecrypt(doc);
    if (doc.boundSim && !areSimNumbersMatching(doc.boundSim, activeSimNumber)) {
      setActiveSimNumber(doc.boundSim);
    }
    setCurrentTab('verify');
  };

  // Authorize device SIM as secondary anchor for a container
  const handleAuthorizeSimForDocument = (docId: string, simNumber: string) => {
    setDocuments(prev =>
      prev.map(d => {
        if (d.id === docId) {
          const secondary = d.secondarySims || [];
          if (!secondary.some(s => areSimNumbersMatching(s, simNumber))) {
            const updated: VaultDocument = {
              ...d,
              secondarySims: [...secondary, simNumber],
            };
            if (currentUser) {
              saveVaultDocumentToFirestore(currentUser.uid, updated);
            }
            return updated;
          }
        }
        return d;
      })
    );
    addToast(`Device SIM ${simNumber} authorized as hardware anchor`, 'info');
  };

  // Decryption success callback
  const handleDecryptionSuccess = (docId: string) => {
    const targetDoc = documents.find(d => d.id === docId);
    if (!targetDoc) return;

    if (isLockdownActive && !areSimNumbersMatching(targetDoc.boundSim, activeSimNumber)) {
      addToast('Lockdown Violation: Decryption blocked by sovereign policy', 'error');
      const failLog: AuditLogEntry = {
        id: 'log-' + Date.now(),
        timestamp: Date.now(),
        type: 'decryption_failure',
        title: 'Lockdown Block: Unauthorized Decryption Attempt',
        details: `Decryption of ${targetDoc.name} repudiated during active lockdown state.`,
        simNumber: targetDoc.boundSim,
        status: 'breach',
        ipAddress: '198.51.100.44',
      };
      setAuditLogs(prev => [failLog, ...prev]);
      if (currentUser) {
        saveAuditLogToFirestore(currentUser.uid, failLog);
      }
      return;
    }

    const updatedDoc: VaultDocument = {
      ...targetDoc,
      decryptionsCount: targetDoc.decryptionsCount + 1,
      lastDecryptedAt: Date.now(),
    };

    setDocuments(prev =>
      prev.map(d => (d.id === docId ? updatedDoc : d))
    );

    const newLog: AuditLogEntry = {
      id: 'log-' + Date.now(),
      timestamp: Date.now(),
      type: 'decryption_success',
      title: `Decryption Certified: ${targetDoc.name}`,
      details: `Hardware challenge ECDSA-P384 passed for SIM ${activeSimNumber}. Zero-extract sandbox frame loaded.`,
      simNumber: activeSimNumber,
      status: 'success',
      ipAddress: '127.0.0.1 (Local Bus)',
      enclaveHash: '0xSEP_' + targetDoc.sha256.slice(0, 6).toUpperCase(),
    };
    setAuditLogs(prev => [newLog, ...prev]);
    addToast(`Container Decrypted in Enclave: ${targetDoc.name}`);

    if (currentUser) {
      saveVaultDocumentToFirestore(currentUser.uid, updatedDoc);
      saveAuditLogToFirestore(currentUser.uid, newLog);
    }
  };

  // Decryption failure / breach callback
  const handleDecryptionFailure = (docName: string, simUsed: string, reason: string) => {
    const failLog: AuditLogEntry = {
      id: 'log-' + Date.now(),
      timestamp: Date.now(),
      type: 'decryption_failure',
      title: `SECURITY BREACH BLOCKED: ${docName}`,
      details: `Unauthorized attempt with SIM ${simUsed}. Hardware authentication repudiated (${reason}).`,
      simNumber: simUsed,
      status: 'breach',
      ipAddress: '198.51.100.124 (Untrusted Node)',
      enclaveHash: '0xERR_TAMPER_' + Math.floor(Math.random() * 10000),
    };
    setAuditLogs(prev => [failLog, ...prev]);
    addToast(`Security Breach Repudiated: ${reason}`, 'error');

    if (currentUser) {
      saveAuditLogToFirestore(currentUser.uid, failLog);
    }
  };

  // Add new authorized SIM
  const handleAddSim = (newSim: SimIdentity) => {
    setSims(prev => [...prev, newSim]);
    const log: AuditLogEntry = {
      id: 'log-' + Date.now(),
      timestamp: Date.now(),
      type: 'sim_authorized',
      title: `New SIM Key Root Issued: ${newSim.label}`,
      details: `Number: ${newSim.phoneNumber} (${newSim.carrier}). Enclave profile provisioned.`,
      status: 'success',
      ipAddress: 'Sovereign Root Controller',
    };
    setAuditLogs(prev => [log, ...prev]);
    addToast(`New SIM Node Authorized: ${newSim.phoneNumber}`);

    if (currentUser) {
      saveSimIdentityToFirestore(currentUser.uid, newSim);
      saveAuditLogToFirestore(currentUser.uid, log);
    }
  };

  // Reset to initial demo fleet
  const handleResetToDemoData = () => {
    localStorage.removeItem('cipherlock_docs');
    localStorage.removeItem('cipherlock_sims');
    localStorage.removeItem('cipherlock_logs');
    setDocuments(INITIAL_DOCUMENTS);
    setSims(INITIAL_SIMS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setActiveSimNumber('+91 98765 43210');
    setIsLockdownActive(false);
    addToast('Vault reset to pristine demo fleet state', 'info');
  };

  // Delete document
  const handleDeleteDocument = (docId: string) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc) return;
    setDocuments(prev => prev.filter(d => d.id !== docId));
    addToast(`Document purged from Enclave Vault: ${doc.name}`, 'info');

    if (currentUser) {
      deleteVaultDocumentFromFirestore(currentUser.uid, docId);
    }
  };

  // Download container
  const handleDownloadPackage = (doc: VaultDocument) => {
    let outputString = doc.rawContainerJson;
    if (!outputString) {
      const container: EncryptedContainer = {
        format: 'CIPHERLOCK_V1',
        cipher: 'AES-256-GCM',
        saltHex: 'a109fe829ba34c11b0e381029c7712ba',
        ivHex: '3910c2849182bb190284ab91',
        boundSim: doc.boundSim,
        imsiHash: '310410' + doc.boundSim.replace(/\D/g, '').slice(-6),
        fileSha256: doc.sha256,
        originalName: doc.originalName,
        mimeType: doc.mimeType,
        sizeBytes: doc.sizeBytes,
        policy: {
          zeroExtract: doc.policy?.zeroExtract ?? true,
          autoNukeOnSimSwap: doc.policy?.autoNukeOnSimSwap ?? false,
          requireBiometrics: doc.policy?.requireBiometrics ?? false,
          expirationTimestamp: doc.expiresAt ?? null,
        },
        sealedAt: doc.createdAt,
        encryptedPayloadBase64:
          doc.encryptedPackageBase64 ||
          'Q1BMT0NLX1NFQ1VSRV9FTkNMQVZFX0FFUzI1NkdDTV9TRUFMRURfUEFZTE9BRA==',
      };
      outputString = JSON.stringify(container, null, 2);
    }

    const blob = new Blob([outputString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.name.endsWith('.cplock') ? doc.name : `${doc.name}.cplock`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast(`Downloaded sealed package: ${doc.name}`);
  };

  // Revoke SIM identity
  const handleRevokeSim = (simId: string, simLabel: string) => {
    const updatedSims = sims.map(s => (s.id === simId ? { ...s, status: 'revoked' as const } : s));
    setSims(updatedSims);
    const log: AuditLogEntry = {
      id: 'log-' + Date.now(),
      timestamp: Date.now(),
      type: 'key_revoked',
      title: `SIM Authority Revoked: ${simLabel}`,
      details: `Hardware key burned across distributed enclave nodes. Further decryptions repudiated.`,
      status: 'warning',
      ipAddress: 'Sovereign Root Controller',
    };
    setAuditLogs(prev => [log, ...prev]);
    addToast(`Key Revocation Propagated Across Enclave: ${simLabel}`, 'error');

    if (currentUser) {
      const revoked = updatedSims.find(s => s.id === simId);
      if (revoked) {
        saveSimIdentityToFirestore(currentUser.uid, revoked);
      }
      saveAuditLogToFirestore(currentUser.uid, log);
    }
  };

  // Toggle Lockdown
  const handleToggleLockdown = () => {
    const nextState = !isLockdownActive;
    setIsLockdownActive(nextState);

    const log: AuditLogEntry = {
      id: 'log-' + Date.now(),
      timestamp: Date.now(),
      type: nextState ? 'lockdown_engaged' : 'lockdown_lifted',
      title: nextState ? 'Lockdown Engaged' : 'Lockdown Lifted',
      details: nextState
        ? 'All external non-owner decryptions suspended globally.'
        : 'Normal multi-SIM attestation rules restored.',
      status: nextState ? 'warning' : 'success',
      ipAddress: 'Sovereign Root Controller',
    };
    setAuditLogs(prev => [log, ...prev]);
    addToast(
      nextState
        ? 'Lockdown Active: Remote Decryptions Suspended'
        : 'Lockdown Lifted: SIM Verification Restored'
    );

    if (currentUser) {
      saveAuditLogToFirestore(currentUser.uid, log);
    }
  };

  // Trigger Kill Switch
  const handleTriggerKillSwitch = () => {
    const updatedSims = sims.map(s => (!s.isOwner ? { ...s, status: 'revoked' as const } : s));
    setSims(updatedSims);
    const log: AuditLogEntry = {
      id: 'log-' + Date.now(),
      timestamp: Date.now(),
      type: 'kill_switch',
      title: 'EMERGENCY REMOTE KILL SWITCH ACTIVATED',
      details: 'All distributed hardware keys zeroed globally. Remote nodes permanently destroyed.',
      status: 'breach',
      ipAddress: 'Sovereign Root Controller',
    };
    setAuditLogs(prev => [log, ...prev]);
    addToast('Cryptographic Burn Broadcasted: All Remote Keys Zeroed.', 'error');

    if (currentUser) {
      updatedSims.forEach(s => saveSimIdentityToFirestore(currentUser.uid, s));
      saveAuditLogToFirestore(currentUser.uid, log);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] flex flex-col antialiased selection:bg-orange-500 selection:text-white pb-24 md:pb-12">
      {/* App Header */}
      <Header
        currentTab={currentTab}
        isLockdownActive={isLockdownActive}
        activeSimNumber={activeSimNumber}
        onSelectActiveSim={handleSelectActiveSim}
        availableSims={sims}
        audioEnabled={audioEnabled}
        onToggleAudio={handleToggleAudio}
        breachCount={breachCount}
        currentUser={currentUser}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        isSyncing={isSyncing}
        onAddSim={handleAddSim}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full pt-20">
        {/* Desktop Top Sub-Navigation */}
        <Navigation
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          vaultCount={documents.length}
        />

        {/* Tab Viewport */}
        <div className="max-w-4xl mx-auto px-3 sm:px-6 py-5 sm:py-8 pb-28 md:pb-12">
          {currentTab === 'vault' && (
            <VaultView
              documents={documents}
              activeSimNumber={activeSimNumber}
              simCount={sims.length}
              breachCount={breachCount}
              onGoToShield={() => setCurrentTab('shield')}
              onGoToCommandCenter={() => setCurrentTab('command_center')}
              onSelectDocumentToDecrypt={handleSelectDocToDecrypt}
              onInspectDocument={doc => setInspectingDoc(doc)}
              onDeleteDocument={handleDeleteDocument}
              onDownloadPackage={handleDownloadPackage}
            />
          )}

          {currentTab === 'command_center' && (
            <CommandCenterView
              documents={documents}
              sims={sims}
              auditLogs={auditLogs}
              onSelectDocForDecrypt={handleSelectDocToDecrypt}
              onRevokeSim={handleRevokeSim}
              onToggleLockdown={handleToggleLockdown}
              isLockdownActive={isLockdownActive}
            />
          )}

          {currentTab === 'shield' && (
            <ShieldView
              activeSimNumber={activeSimNumber}
              onDocumentSealed={handleDocumentSealed}
              onGoToVault={() => setCurrentTab('vault')}
              onTestDecryption={handleSelectDocToDecrypt}
            />
          )}

          {currentTab === 'verify' && (
            <VerifyView
              documents={documents}
              selectedDoc={selectedDocForDecrypt}
              onSelectDoc={setSelectedDocForDecrypt}
              activeSimNumber={activeSimNumber}
              onSelectActiveSim={handleSelectActiveSim}
              sims={sims}
              onAuthorizeCurrentSim={handleAuthorizeSimForDocument}
              onDecryptionSuccess={handleDecryptionSuccess}
              onDecryptionFailure={handleDecryptionFailure}
              onImportContainer={handleImportContainer}
            />
          )}

          {currentTab === 'audit' && (
            <AuditView
              sims={sims}
              auditLogs={auditLogs}
              isLockdownActive={isLockdownActive}
              onToggleLockdown={handleToggleLockdown}
              onRevokeSim={handleRevokeSim}
              onTriggerKillSwitch={handleTriggerKillSwitch}
              onCopyHash={hash => addToast(`Hash copied to clipboard: ${hash.slice(0, 20)}...`)}
              onAddSim={handleAddSim}
              onResetToDemoData={handleResetToDemoData}
            />
          )}
        </div>
      </main>

      {/* Document Details / Cryptographic Header Modal */}
      <DocumentModal
        document={inspectingDoc}
        onClose={() => setInspectingDoc(null)}
        onDownload={handleDownloadPackage}
        onVerifyDecrypt={handleSelectDocToDecrypt}
      />

      {/* Offline Status Banner */}
      <OfflineIndicator />

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
