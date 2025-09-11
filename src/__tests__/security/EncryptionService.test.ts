// #scope:auth
import { EncryptionService } from '../../services/security/EncryptionService';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import ENV from '../../config/environment';

// Mock dependencies
jest.mock('expo-crypto');
jest.mock('expo-secure-store');
jest.mock('../../config/environment');

const mockCrypto = Crypto as jest.Mocked<typeof Crypto>;
const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;
const mockENV = ENV as jest.Mocked<typeof ENV>;

describe('EncryptionService', () => {
  let encryptionService: EncryptionService;

  beforeEach(() => {
    encryptionService = new EncryptionService();
    jest.clearAllMocks();
    
    // Default ENV setup
    mockENV.security = { encryptionEnabled: true };
  });

  describe('hashNMCPin', () => {
    it('should hash NMC PIN with salt', async () => {
      const testPin = '12AB34C';
      const mockSalt = 'mock_salt_value';
      const mockHash = 'mock_hashed_value';

      // Mock existing salt
      mockSecureStore.getItemAsync.mockResolvedValue(mockSalt);
      
      // Mock hash generation
      mockCrypto.digestStringAsync.mockResolvedValue(mockHash);

      const result = await encryptionService.hashNMCPin(testPin);

      expect(mockSecureStore.getItemAsync).toHaveBeenCalledWith('pin_salt_v1');
      expect(mockCrypto.digestStringAsync).toHaveBeenCalledWith(
        Crypto.CryptoDigestAlgorithm.SHA256,
        `${testPin}:${mockSalt}:nurse_revalidator`
      );
      expect(result).toBe(mockHash);
    });

    it('should generate new salt if none exists', async () => {
      const testPin = '12AB34C';
      const mockSalt = 'new_mock_salt';
      const mockHash = 'mock_hashed_value';
      const mockRandomBytes = new Uint8Array([1, 2, 3, 4]);

      // Mock no existing salt
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      
      // Mock salt generation
      mockCrypto.getRandomBytesAsync.mockResolvedValue(mockRandomBytes);
      mockSecureStore.setItemAsync.mockResolvedValue();
      
      // Mock hash generation
      mockCrypto.digestStringAsync.mockResolvedValue(mockHash);

      const result = await encryptionService.hashNMCPin(testPin);

      expect(mockCrypto.getRandomBytesAsync).toHaveBeenCalledWith(32);
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        'pin_salt_v1',
        '01020304'
      );
      expect(result).toBe(mockHash);
    });

    it('should throw error when encryption is disabled', async () => {
      mockENV.security.encryptionEnabled = false;

      await expect(encryptionService.hashNMCPin('12AB34C'))
        .rejects.toThrow('Encryption is disabled in environment configuration');
    });

    it('should handle salt storage errors', async () => {
      const testPin = '12AB34C';
      
      mockSecureStore.getItemAsync.mockRejectedValue(new Error('SecureStore error'));

      await expect(encryptionService.hashNMCPin(testPin))
        .rejects.toThrow('Failed to manage encryption salt');
    });
  });

  describe('verifyNMCPin', () => {
    it('should verify correct PIN', async () => {
      const testPin = '12AB34C';
      const storedHash = 'stored_hash_value';
      const mockSalt = 'mock_salt';

      mockSecureStore.getItemAsync.mockResolvedValue(mockSalt);
      mockCrypto.digestStringAsync.mockResolvedValue(storedHash);

      const result = await encryptionService.verifyNMCPin(testPin, storedHash);

      expect(result).toBe(true);
    });

    it('should reject incorrect PIN', async () => {
      const testPin = '12AB34C';
      const storedHash = 'stored_hash_value';
      const wrongHash = 'wrong_hash_value';
      const mockSalt = 'mock_salt';

      mockSecureStore.getItemAsync.mockResolvedValue(mockSalt);
      mockCrypto.digestStringAsync.mockResolvedValue(wrongHash);

      const result = await encryptionService.verifyNMCPin(testPin, storedHash);

      expect(result).toBe(false);
    });

    it('should handle verification errors gracefully', async () => {
      const testPin = '12AB34C';
      const storedHash = 'stored_hash_value';

      mockSecureStore.getItemAsync.mockRejectedValue(new Error('Storage error'));

      const result = await encryptionService.verifyNMCPin(testPin, storedHash);

      expect(result).toBe(false);
    });
  });

  describe('generateDataHash', () => {
    it('should generate hash for data integrity', async () => {
      const testData = 'test_data_string';
      const expectedHash = 'data_hash_value';

      mockCrypto.digestStringAsync.mockResolvedValue(expectedHash);

      const result = await encryptionService.generateDataHash(testData);

      expect(mockCrypto.digestStringAsync).toHaveBeenCalledWith(
        Crypto.CryptoDigestAlgorithm.SHA256,
        testData
      );
      expect(result).toBe(expectedHash);
    });
  });

  describe('generateRandomBytes', () => {
    it('should generate random bytes as hex string', async () => {
      const testLength = 16;
      const mockBytes = new Uint8Array([255, 0, 128, 64]);

      mockCrypto.getRandomBytesAsync.mockResolvedValue(mockBytes);

      const result = await encryptionService.generateRandomBytes(testLength);

      expect(mockCrypto.getRandomBytesAsync).toHaveBeenCalledWith(testLength);
      expect(result).toBe('ff008040');
    });
  });

  describe('clearEncryptionData', () => {
    it('should clear encryption keys on logout', async () => {
      mockSecureStore.deleteItemAsync.mockResolvedValue();

      await encryptionService.clearEncryptionData();

      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith('pin_salt_v1');
    });

    it('should handle deletion errors silently', async () => {
      mockSecureStore.deleteItemAsync.mockRejectedValue(new Error('Delete error'));

      // Should not throw
      await expect(encryptionService.clearEncryptionData()).resolves.not.toThrow();
    });
  });
});