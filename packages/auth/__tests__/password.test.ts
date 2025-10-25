import { hashPassword, verifyPassword } from '../src/password';

describe('Password Utils', () => {
  const testPassword = 'SecurePassword123!';

  it('should hash a password', async () => {
    const hash = await hashPassword(testPassword);
    expect(hash).toBeDefined();
    expect(hash).not.toBe(testPassword);
    expect(hash.length).toBeGreaterThan(0);
  });

  it('should verify correct password', async () => {
    const hash = await hashPassword(testPassword);
    const isValid = await verifyPassword(testPassword, hash);
    expect(isValid).toBe(true);
  });

  it('should reject incorrect password', async () => {
    const hash = await hashPassword(testPassword);
    const isValid = await verifyPassword('WrongPassword', hash);
    expect(isValid).toBe(false);
  });

  it('should create unique hashes for same password', async () => {
    const hash1 = await hashPassword(testPassword);
    const hash2 = await hashPassword(testPassword);
    expect(hash1).not.toBe(hash2);
  });
});

