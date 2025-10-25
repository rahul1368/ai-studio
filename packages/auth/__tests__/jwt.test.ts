import { signToken, verifyToken, decodeToken } from '../src/jwt';

describe('JWT Utils', () => {
  const testPayload = {
    userId: 'test-user-123',
    email: 'test@example.com',
  };

  it('should sign a JWT token', () => {
    const token = signToken(testPayload);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  it('should verify and decode a valid token', () => {
    const token = signToken(testPayload);
    const decoded = verifyToken(token);
    
    expect(decoded).toBeDefined();
    expect(decoded?.userId).toBe(testPayload.userId);
    expect(decoded?.email).toBe(testPayload.email);
  });

  it('should return null for invalid token', () => {
    const invalidToken = 'invalid.token.here';
    const decoded = verifyToken(invalidToken);
    expect(decoded).toBeNull();
  });

  it('should decode token without verification', () => {
    const token = signToken(testPayload);
    const decoded = decodeToken(token);
    
    expect(decoded).toBeDefined();
    expect(decoded?.userId).toBe(testPayload.userId);
    expect(decoded?.email).toBe(testPayload.email);
  });
});

