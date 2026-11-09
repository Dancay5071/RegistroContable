const ALGORITHM = "AES-GCM";
const KEY_DERIVATION = "PBKDF2";
const HASH = "SHA-256";
const ITERATIONS = 100000;
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;

function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToBuffer(base64) {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function deriveKey(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    KEY_DERIVATION,
    false,
    ["deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: KEY_DERIVATION,
      salt,
      iterations: ITERATIONS,
      hash: HASH
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptBackupPayload(plainText, password) {
  if (!password || typeof password !== "string" || password.trim().length === 0) {
    throw new Error("Se requiere una contraseña para cifrar el respaldo.");
  }

  const enc = new TextEncoder();
  const salt = window.crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const key = await deriveKey(password, salt);
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    enc.encode(plainText)
  );

  return {
    app: "FinTrack",
    encrypted: true,
    version: "1.0",
    algorithm: "AES-256-GCM",
    kdf: "PBKDF2-SHA256",
    iterations: ITERATIONS,
    salt: bufferToBase64(salt),
    iv: bufferToBase64(iv),
    ciphertext: bufferToBase64(encryptedBuffer),
    createdAt: new Date().toISOString()
  };
}

export async function decryptBackupPayload(encryptedObj, password) {
  if (!password || typeof password !== "string") {
    throw new Error("Ingresa la contraseña de descifrado.");
  }

  if (!encryptedObj || !encryptedObj.ciphertext || !encryptedObj.salt || !encryptedObj.iv) {
    throw new Error("El archivo no tiene la estructura de cifrado requerida.");
  }

  const salt = new Uint8Array(base64ToBuffer(encryptedObj.salt));
  const iv = new Uint8Array(base64ToBuffer(encryptedObj.iv));
  const ciphertextBuffer = base64ToBuffer(encryptedObj.ciphertext);

  const key = await deriveKey(password, salt);

  try {
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      ciphertextBuffer
    );
    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch {
    throw new Error("Contraseña incorrecta o archivo de respaldo dañado.");
  }
}

