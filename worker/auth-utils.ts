// Web Crypto API for password hashing in Cloudflare Workers
const ALGORITHM = { name: 'PBKDF2' };
const HASH = 'SHA-256';
const ITERATIONS = 100000;
const SALT_LENGTH = 16; // bytes
const KEY_LENGTH = 64; // bytes
// Helper to convert buffer to hex string
const bufferToHex = (buffer: ArrayBuffer): string => {
  return [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, '0')).join('');
};
// Helper to convert hex string to buffer
const hexToBuffer = (hex: string): ArrayBuffer => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes.buffer;
};
/**
 * Hashes a password with a new random salt.
 * @param password The password to hash.
 * @returns A promise that resolves to an object containing the hash and salt as hex strings.
 */
export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), ALGORITHM, false, ['deriveBits']);
  const hashBuffer = await crypto.subtle.deriveBits(
    { ...ALGORITHM, salt, iterations: ITERATIONS, hash: HASH },
    key,
    KEY_LENGTH * 8
  );
  return {
    hash: bufferToHex(hashBuffer),
    salt: bufferToHex(salt),
  };
}
/**
 * Verifies a password against a stored hash and salt.
 * @param password The password to verify.
 * @param hash The stored hash (hex string).
 * @param salt The stored salt (hex string).
 * @returns A promise that resolves to true if the password is correct, false otherwise.
 */
export async function verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
  const saltBuffer = hexToBuffer(salt);
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), ALGORITHM, false, ['deriveBits']);
  const hashToVerifyBuffer = await crypto.subtle.deriveBits(
    { ...ALGORITHM, salt: saltBuffer, iterations: ITERATIONS, hash: HASH },
    key,
    KEY_LENGTH * 8
  );
  const hashToVerify = bufferToHex(hashToVerifyBuffer);
  return hashToVerify === hash;
}