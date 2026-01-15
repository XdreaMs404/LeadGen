import {
    createCipheriv,
    createDecipheriv,
    randomBytes,
    scryptSync,
} from 'crypto';

const ALGORITHM = 'aes-256-gcm' as const;
const IV_LENGTH = 16; // 16 bytes for AES-GCM
const AUTH_TAG_LENGTH = 16; // 16 bytes is standard for AES-GCM

/**
 * Derives a 32-byte key from the ENCRYPTION_KEY environment variable.
 * Uses scrypt for key derivation to ensure the key is the correct length.
 */
function getEncryptionKey(): Buffer {
    const keyEnv = process.env.ENCRYPTION_KEY;

    if (!keyEnv) {
        throw new Error('ENCRYPTION_KEY environment variable is not set');
    }

    // If the key is already 32 bytes (64 hex chars), use it directly
    if (/^[a-f0-9]{64}$/i.test(keyEnv)) {
        return Buffer.from(keyEnv, 'hex');
    }

    // Otherwise, derive a 32-byte key using scrypt
    // Use a constant salt for deterministic key derivation
    const salt = 'leadgen-token-encryption';
    return scryptSync(keyEnv, salt, 32);
}

/**
 * Encrypts a string using AES-256-GCM.
 * 
 * @param plainText - The text to encrypt
 * @returns Encrypted string in format: iv:authTag:encrypted (all base64)
 * @throws Error if ENCRYPTION_KEY is not set
 */
export function encrypt(plainText: string): string {
    const key = getEncryptionKey();
    const iv = randomBytes(IV_LENGTH);

    const cipher = createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([
        cipher.update(plainText, 'utf8'),
        cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:encrypted (all base64)
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
}

/**
 * Decrypts a string that was encrypted with AES-256-GCM.
 * 
 * @param encryptedText - The encrypted string in format: iv:authTag:encrypted
 * @returns Decrypted plain text
 * @throws Error if ENCRYPTION_KEY is not set or decryption fails
 */
export function decrypt(encryptedText: string): string {
    const key = getEncryptionKey();

    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
        throw new Error('Invalid encrypted text format');
    }

    const [ivB64, authTagB64, encryptedB64] = parts;
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(authTagB64, 'base64');
    const encrypted = Buffer.from(encryptedB64, 'base64');

    if (iv.length !== IV_LENGTH) {
        throw new Error('Invalid IV length');
    }

    if (authTag.length !== AUTH_TAG_LENGTH) {
        throw new Error('Invalid auth tag length');
    }

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
    ]);

    return decrypted.toString('utf8');
}

/**
 * Generates a secure random encryption key.
 * Use this to generate a new ENCRYPTION_KEY value for .env
 * 
 * @returns A 32-byte key as a hex string (64 characters)
 */
export function generateEncryptionKey(): string {
    return randomBytes(32).toString('hex');
}
