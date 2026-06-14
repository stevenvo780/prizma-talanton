jest.mock('crypto', () => {
  const actual = jest.requireActual('crypto');
  return {
    __esModule: true,
    default: actual,
    ...actual,
  };
});

import { encrypt, decrypt } from './encrypt';

describe('encrypt/decrypt', () => {
  it('should encrypt and decrypt data correctly', () => {
    const secret = 'mysecret';
    const data = 'hello';
    const encrypted = encrypt(data, secret);
    const decrypted = decrypt(encrypted, secret);
    expect(decrypted).toBe(data);
  });

  it('should throw error when secret is missing', () => {
    expect(() => encrypt('data', undefined)).toThrow('No secret provided');
  });

  it('should throw error when encrypted data is missing', () => {
    expect(() => decrypt('', 'secret')).toThrow('No encrypted data provided');
  });
});
