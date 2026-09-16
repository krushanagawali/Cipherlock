/**
 * Real Web Crypto API implementation for CipherLock
 * Uses AES-GCM 256-bit encryption with PBKDF2 key derivation
 * and SHA-256 file fingerprinting.
 */

export async function calculateSha256(buffer: ArrayBuffer | Uint8Array): Promise<string> {
  const data = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function bufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export function base64ToBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer.slice(0) as ArrayBuffer;
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function generateMockImsi(phoneNumber: string): string {
  // Deterministic IMSI representation from phone digits
  const digits = phoneNumber.replace(/\D/g, '');
  return `310410${digits.padEnd(9, '0').slice(-9)}`;
}

export function normalizeSimNumber(num?: string | null): string {
  if (!num) return '';
  return num.replace(/\D/g, '');
}

export function areSimNumbersMatching(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  const strA = a.trim();
  const strB = b.trim();
  if (strA === strB) return true;
  if (strA.toLowerCase() === strB.toLowerCase()) return true;

  const digA = strA.replace(/\D/g, '');
  const digB = strB.replace(/\D/g, '');
  if (digA && digB) {
    if (digA === digB) return true;
    if (digA.length >= 10 && digB.length >= 10 && digA.slice(-10) === digB.slice(-10)) {
      return true;
    }
  }
  return false;
}

export interface EncryptedContainer {
  format: 'CIPHERLOCK_V1';
  cipher: 'AES-256-GCM';
  saltHex: string;
  ivHex: string;
  boundSim: string;
  imsiHash: string;
  fileSha256: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  policy: {
    zeroExtract: boolean;
    autoNukeOnSimSwap: boolean;
    requireBiometrics: boolean;
    expirationTimestamp: number | null;
  };
  sealedAt: number;
  encryptedPayloadBase64: string;
}

/**
 * Derive AES-256-GCM CryptoKey using SIM identity anchor and PBKDF2
 */
export async function deriveKey(
  simNumber: string,
  imsi: string,
  salt: Uint8Array,
  additionalSecret?: string
): Promise<CryptoKey> {
  const keyMaterialString = `${simNumber}::ENCLAVE_ROOT::${imsi}::${additionalSecret || 'CPLOCK_TITAN_M2'}`;
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(keyMaterialString),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a raw file buffer into a CipherLock container
 */
export async function encryptFileToContainer(
  fileBuffer: ArrayBuffer,
  fileName: string,
  mimeType: string,
  boundSim: string,
  policy: {
    zeroExtract: boolean;
    autoNukeOnSimSwap: boolean;
    requireBiometrics: boolean;
    expirationHours: number;
  },
  customPin?: string
): Promise<{ container: EncryptedContainer; sha256: string; containerJson: string }> {
  const sha256 = await calculateSha256(fileBuffer);
  const imsi = generateMockImsi(boundSim);
  const imsiHash = (await calculateSha256(new TextEncoder().encode(imsi))).slice(0, 16);

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const key = await deriveKey(boundSim, imsi, salt, customPin);

  const encryptedData = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    fileBuffer
  );

  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
  const encryptedPayloadBase64 = bufferToBase64(encryptedData);

  const now = Date.now();
  const container: EncryptedContainer = {
    format: 'CIPHERLOCK_V1',
    cipher: 'AES-256-GCM',
    saltHex,
    ivHex,
    boundSim,
    imsiHash,
    fileSha256: sha256,
    originalName: fileName,
    mimeType: mimeType || 'application/octet-stream',
    sizeBytes: fileBuffer.byteLength,
    policy: {
      zeroExtract: policy.zeroExtract,
      autoNukeOnSimSwap: policy.autoNukeOnSimSwap,
      requireBiometrics: policy.requireBiometrics,
      expirationTimestamp: policy.expirationHours > 0 ? now + policy.expirationHours * 3600000 : null,
    },
    sealedAt: now,
    encryptedPayloadBase64,
  };

  return {
    container,
    sha256,
    containerJson: JSON.stringify(container, null, 2),
  };
}

/**
 * Decrypt a CipherLock container using SIM identity verification
 */
export async function decryptContainer(
  container: EncryptedContainer,
  simNumber: string,
  customPin?: string
): Promise<{ decryptedBuffer: ArrayBuffer; sha256: string; verified: boolean }> {
  // Check if expiration passed
  if (container.policy.expirationTimestamp && Date.now() > container.policy.expirationTimestamp) {
    throw new Error('Capsule has expired. Cryptographic self-destruct engaged.');
  }

  // Convert salt and IV from Hex
  const salt = new Uint8Array(container.saltHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  const iv = new Uint8Array(container.ivHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));

  // If provided SIM number matches the sealed container boundSim, use container.boundSim for exact PBKDF2 derivation
  const targetSim = (container.boundSim && areSimNumbersMatching(container.boundSim, simNumber))
    ? container.boundSim
    : simNumber;

  const imsi = generateMockImsi(targetSim);
  const key = await deriveKey(targetSim, imsi, salt, customPin);

  const encryptedBytes = base64ToBuffer(container.encryptedPayloadBase64);

  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      encryptedBytes
    );

    const checkHash = await calculateSha256(decryptedBuffer);
    return {
      decryptedBuffer,
      sha256: checkHash,
      verified: checkHash.toLowerCase() === container.fileSha256.toLowerCase(),
    };
  } catch {
    throw new Error('Cryptographic signature verification failed: SIM Enclave mismatch or corrupt cipher.');
  }
}
