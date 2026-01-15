import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { encrypt, decrypt, generateEncryptionKey } from '@/lib/crypto/encrypt';

describe('Encryption Module', () => {
    const TEST_ENCRYPTION_KEY = 'a'.repeat(64); // 64 hex chars = 32 bytes

    beforeEach(() => {
        vi.stubEnv('ENCRYPTION_KEY', TEST_ENCRYPTION_KEY);
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    describe('generateEncryptionKey', () => {
        it('should generate a 64-character hex string', () => {
            const key = generateEncryptionKey();

            expect(key).toHaveLength(64);
            expect(/^[a-f0-9]{64}$/i.test(key)).toBe(true);
        });

        it('should generate unique keys each time', () => {
            const key1 = generateEncryptionKey();
            const key2 = generateEncryptionKey();

            expect(key1).not.toBe(key2);
        });
    });

    describe('encrypt', () => {
        it('should return a string in iv:authTag:encrypted format', () => {
            const plainText = 'test-token-value';

            const encrypted = encrypt(plainText);

            expect(encrypted.split(':')).toHaveLength(3);
        });

        it('should encrypt and decrypt empty string correctly', () => {
            const plainText = '';
            const encrypted = encrypt(plainText);
            const decrypted = decrypt(encrypted);

            expect(decrypted).toBe(plainText);
            expect(encrypted.length).toBeGreaterThan(0);
        });

        it('should produce different ciphertext for same input (random IV)', () => {
            const plainText = 'same-input';

            const encrypted1 = encrypt(plainText);
            const encrypted2 = encrypt(plainText);

            expect(encrypted1).not.toBe(encrypted2);
        });

        it('should throw if ENCRYPTION_KEY is not set', () => {
            vi.unstubAllEnvs();
            vi.stubEnv('ENCRYPTION_KEY', '');

            expect(() => encrypt('test')).toThrow(
                'ENCRYPTION_KEY environment variable is not set'
            );
        });
    });

    describe('decrypt', () => {
        it('should decrypt encrypted text correctly (roundtrip)', () => {
            const plainText = 'my-secret-refresh-token-12345';

            const encrypted = encrypt(plainText);
            const decrypted = decrypt(encrypted);

            expect(decrypted).toBe(plainText);
        });

        it('should handle special characters', () => {
            const plainText = 'token-with-special-chars!@#$%^&*()_+{}[]|\\:";\'<>?,./`~';

            const encrypted = encrypt(plainText);
            const decrypted = decrypt(encrypted);

            expect(decrypted).toBe(plainText);
        });

        it('should handle long text (OAuth tokens are typically long)', () => {
            const plainText = 'ya29.' + 'a'.repeat(1000); // Long access token

            const encrypted = encrypt(plainText);
            const decrypted = decrypt(encrypted);

            expect(decrypted).toBe(plainText);
        });

        it('should handle unicode characters', () => {
            const plainText = 'token-with-émojis-🔐🔑';

            const encrypted = encrypt(plainText);
            const decrypted = decrypt(encrypted);

            expect(decrypted).toBe(plainText);
        });

        it('should throw for invalid format (missing parts)', () => {
            expect(() => decrypt('invalid-format')).toThrow(
                'Invalid encrypted text format'
            );
        });

        it('should throw for tampered ciphertext', () => {
            const encrypted = encrypt('test');
            const parts = encrypted.split(':');
            // Tamper with the auth tag
            parts[1] = 'AAAAAAAAAAAAAAAAAAAAAA==';
            const tampered = parts.join(':');

            expect(() => decrypt(tampered)).toThrow();
        });

        it('should throw if ENCRYPTION_KEY is not set', () => {
            const encrypted = encrypt('test'); // Encrypt with valid key first

            vi.unstubAllEnvs();
            vi.stubEnv('ENCRYPTION_KEY', '');

            expect(() => decrypt(encrypted)).toThrow(
                'ENCRYPTION_KEY environment variable is not set'
            );
        });
    });

    describe('encrypt/decrypt with different key formats', () => {
        it('should work with a passphrase (non-hex key)', () => {
            vi.unstubAllEnvs();
            vi.stubEnv('ENCRYPTION_KEY', 'my-secure-passphrase-for-encryption');

            const plainText = 'test-with-passphrase';
            const encrypted = encrypt(plainText);
            const decrypted = decrypt(encrypted);

            expect(decrypted).toBe(plainText);
        });
    });
});
