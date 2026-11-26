process.env.ENCRYPTION_KEY = 'test-encryption-key';

const { encrypt, decrypt } = require('../utils/encryption');

describe('encryption utils', () => {
  test('decrypt returns the original text after encrypt', () => {
    const original = 'Apollo Hospital, Hyderabad';
    expect(decrypt(encrypt(original))).toBe(original);
  });

  test('ciphertext is different from the plain text', () => {
    const original = '9876543210';
    expect(encrypt(original)).not.toBe(original);
  });

  test('numbers are converted to strings before encryption', () => {
    expect(decrypt(encrypt(12345))).toBe('12345');
  });

  test('encrypt leaves empty values unchanged', () => {
    expect(encrypt('')).toBe('');
    expect(encrypt(null)).toBeNull();
    expect(encrypt(undefined)).toBeUndefined();
  });

  test('decrypt leaves empty values unchanged', () => {
    expect(decrypt('')).toBe('');
    expect(decrypt(null)).toBeNull();
    expect(decrypt(undefined)).toBeUndefined();
  });

  test('decrypt returns the input when it is not valid ciphertext', () => {
    expect(decrypt('not encrypted text')).toBe('not encrypted text');
  });
});
