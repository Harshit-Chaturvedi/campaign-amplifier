import { apiClient } from '../src/api/client';
import { useAuthStore, isFakeToken } from '../src/store/useAuthStore';
import * as navigationRefModule from '../src/navigation/navigationRef';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('Phase 1 Auth and Create Fix Suite', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
    jest.restoreAllMocks();
  });

  describe('Requirement 1 & 5: Never store fake tokens and discard them on startup', () => {
    it('isFakeToken accurately identifies fake tokens', () => {
      expect(isFakeToken('demo-jwt-token-creator-elena')).toBe(true);
      expect(isFakeToken('demo-jwt-token-123456')).toBe(true);
      expect(isFakeToken('demo-token-user')).toBe(true);
      expect(isFakeToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.validtoken')).toBe(false);
      expect(isFakeToken(null)).toBe(false);
      expect(isFakeToken(undefined)).toBe(false);
    });

    it('useAuthStore rejects fake token and does NOT log in locally', () => {
      useAuthStore.getState().setAuth(
        {
          uid: 'demo-user',
          email: 'creator@demo.org',
          name: 'Elena Rostova',
          username: 'elena-rostova',
          role: 'creator',
          createdAt: new Date().toISOString(),
        },
        'demo-jwt-token-creator-elena'
      );

      // Must NOT be authenticated and must not store fake token
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().token).toBeNull();
      expect(useAuthStore.getState().user).toBeNull();
    });

    it('useAuthStore accepts and stores valid real tokens', () => {
      const realToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.realjwttoken';
      useAuthStore.getState().setAuth(
        {
          uid: 'user-123',
          email: 'creator@demo.org',
          name: 'Elena Rostova',
          username: 'elena-rostova',
          role: 'creator',
          createdAt: new Date().toISOString(),
        },
        realToken
      );

      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().token).toBe(realToken);
      expect(useAuthStore.getState().user?.email).toBe('creator@demo.org');
    });

    it('apiClient.login calls real backend and throws on failure instead of returning fake tokens', async () => {
      globalThis.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Invalid email or password' }),
      } as any);

      await expect(apiClient.login('bad@example.com', 'wrongpass')).rejects.toThrow(
        'Invalid email or password'
      );

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().token).toBeNull();
    });
  });

  describe('Requirement 3: Global 401 handling clears auth and redirects to Login', () => {
    it('clears auth and triggers navigateToLogin when backend returns 401', async () => {
      const navigateSpy = jest.spyOn(navigationRefModule, 'navigateToLogin').mockImplementation(() => {});

      // Set user as logged in with a real token
      useAuthStore.setState({
        user: {
          uid: 'user-1',
          email: 'elena@demo.org',
          name: 'Elena',
          username: 'elena',
          role: 'creator',
          createdAt: new Date().toISOString(),
        },
        token: 'valid.token.here',
        isAuthenticated: true,
      });

      // Mock an API call returning 401
      globalThis.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Could not validate credentials' }),
      } as any);

      await expect(
        apiClient.createDraft({ title: 'New Campaign' })
      ).rejects.toThrow();

      // Assert auth store cleared
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().token).toBeNull();
      expect(useAuthStore.getState().user).toBeNull();

      // Assert navigateToLogin was called with 'Please sign in again'
      expect(navigateSpy).toHaveBeenCalledWith('Please sign in again');
    });
  });

  describe('Requirement 4: Distinct errors in createDraft (401, timeout/network, HTTP detail)', () => {
    it('throws distinct 401 error with isAuthError flag', async () => {
      globalThis.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Please sign in again' }),
      } as any);

      try {
        await apiClient.createDraft({ title: 'Test' });
        throw new Error('Should have thrown');
      } catch (err: any) {
        expect(err.status).toBe(401);
        expect(err.isAuthError).toBe(true);
      }
    });

    it('throws distinct timeout/network error with "Can\'t reach the server. Retry."', async () => {
      globalThis.fetch = jest.fn().mockImplementationOnce(() => {
        const error: any = new Error('Network request failed');
        error.name = 'TypeError';
        return Promise.reject(error);
      });

      try {
        await apiClient.createDraft({ title: 'Test' });
        throw new Error('Should have thrown');
      } catch (err: any) {
        expect(err.message).toBe("Can't reach the server. Retry.");
        expect(err.isTimeout || err.isNetworkError).toBe(true);
        expect(err.isAuthError).toBeFalsy();
      }
    });

    it('throws distinct HTTP error containing server detail (e.g. 422)', async () => {
      globalThis.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => ({ detail: 'Funding goal exceeds allowable maximum' }),
      } as any);

      try {
        await apiClient.createDraft({ title: 'Test' });
        throw new Error('Should have thrown');
      } catch (err: any) {
        expect(err.status).toBe(422);
        expect(err.detail).toBe('Funding goal exceeds allowable maximum');
        expect(err.isAuthError).toBeFalsy();
      }
    });
  });
});
