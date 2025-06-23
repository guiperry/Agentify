import { authService } from '../auth-service';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('getAuthState', () => {
    it('should return initial unauthenticated state', () => {
      const state = authService.getAuthState();
      expect(state).toEqual({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
      });
    });
  });

  describe('handleGoogleLoginSuccess', () => {
    it('should handle successful Google login', async () => {
      const mockCredentialResponse = {
        credential: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjdkYzBiMjQwYjNjZjQ5ZjEwNjY4YjI4YzE4ZGI4NzA4ZjE4ZjE5YjEiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJhY2NvdW50cy5nb29nbGUuY29tIiwiYXpwIjoiMTIzNDU2Nzg5MC5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsImF1ZCI6IjEyMzQ1Njc4OTAuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsIm5hbWUiOiJUZXN0IFVzZXIiLCJwaWN0dXJlIjoiaHR0cHM6Ly9leGFtcGxlLmNvbS9waWN0dXJlLmpwZyIsImdpdmVuX25hbWUiOiJUZXN0IiwiZmFtaWx5X25hbWUiOiJVc2VyIiwiaWF0IjoxNjM0NTY3ODkwLCJleHAiOjE2MzQ1NzE0OTB9.signature'
      };

      // Mock the JWT decode
      const originalAtob = global.atob;
      global.atob = jest.fn().mockReturnValue(JSON.stringify({
        sub: '1234567890',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/picture.jpg'
      }));

      const user = await authService.handleGoogleLoginSuccess(mockCredentialResponse);

      expect(user).toEqual({
        id: '1234567890',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/picture.jpg',
        accessToken: mockCredentialResponse.credential,
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'agentify_user',
        JSON.stringify(user)
      );

      // Restore original atob
      global.atob = originalAtob;
    });

    it('should handle invalid JWT token', async () => {
      const mockCredentialResponse = {
        credential: 'invalid-jwt-token'
      };

      await expect(authService.handleGoogleLoginSuccess(mockCredentialResponse))
        .rejects.toThrow('Failed to decode Google JWT token');
    });
  });

  describe('logout', () => {
    it('should clear user data and localStorage', async () => {
      // First login a user
      const mockCredentialResponse = {
        credential: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjdkYzBiMjQwYjNjZjQ5ZjEwNjY4YjI4YzE4ZGI4NzA4ZjE4ZjE5YjEiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJhY2NvdW50cy5nb29nbGUuY29tIiwiYXpwIjoiMTIzNDU2Nzg5MC5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsImF1ZCI6IjEyMzQ1Njc4OTAuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsIm5hbWUiOiJUZXN0IFVzZXIiLCJwaWN0dXJlIjoiaHR0cHM6Ly9leGFtcGxlLmNvbS9waWN0dXJlLmpwZyIsImdpdmVuX25hbWUiOiJUZXN0IiwiZmFtaWx5X25hbWUiOiJVc2VyIiwiaWF0IjoxNjM0NTY3ODkwLCJleHAiOjE2MzQ1NzE0OTB9.signature'
      };

      // Mock the JWT decode
      const originalAtob = global.atob;
      global.atob = jest.fn().mockReturnValue(JSON.stringify({
        sub: '1234567890',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/picture.jpg'
      }));

      await authService.handleGoogleLoginSuccess(mockCredentialResponse);

      // Now logout
      await authService.logout();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('agentify_user');
      expect(authService.getCurrentUser()).toBeNull();
      expect(authService.isAuthenticated()).toBe(false);

      // Restore original atob
      global.atob = originalAtob;
    });
  });

  describe('validateToken', () => {
    it('should return false when no user is logged in', async () => {
      const isValid = await authService.validateToken();
      expect(isValid).toBe(false);
    });

    it('should return true when user has a token', async () => {
      // Mock a logged in user with a properly formatted JWT
      const mockCredentialResponse = {
        credential: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjdkYzBiMjQwYjNjZjQ5ZjEwNjY4YjI4YzE4ZGI4NzA4ZjE4ZjE5YjEiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJhY2NvdW50cy5nb29nbGUuY29tIiwiYXpwIjoiMTIzNDU2Nzg5MC5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsImF1ZCI6IjEyMzQ1Njc4OTAuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsIm5hbWUiOiJUZXN0IFVzZXIiLCJwaWN0dXJlIjoiaHR0cHM6Ly9leGFtcGxlLmNvbS9waWN0dXJlLmpwZyIsImdpdmVuX25hbWUiOiJUZXN0IiwiZmFtaWx5X25hbWUiOiJVc2VyIiwiaWF0IjoxNjM0NTY3ODkwLCJleHAiOjE2MzQ1NzE0OTB9.signature'
      };

      // Mock the JWT decode
      const originalAtob = global.atob;
      global.atob = jest.fn().mockReturnValue(JSON.stringify({
        sub: '1234567890',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/picture.jpg'
      }));

      await authService.handleGoogleLoginSuccess(mockCredentialResponse);
      const isValid = await authService.validateToken();
      expect(isValid).toBe(true);

      // Restore original atob
      global.atob = originalAtob;
    });
  });
});
