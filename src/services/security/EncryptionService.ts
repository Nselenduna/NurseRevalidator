// #scope:auth
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import ENV from '../../config/environment';

export class EncryptionService {
  private static readonly SALT_KEY = 'pin_salt_v1';
  private static readonly SALT_LENGTH = 32;

  /**
   * Hash NMC PIN with salt for secure storage
   * Uses SHA256 with randomly generated salt
   */
  async hashNMCPin(pin: string): Promise<string> {
    if (!ENV.security.encryptionEnabled) {
      throw new Error('Encryption is disabled in environment configuration');
    }

    const salt = await this.getOrCreateSalt();
    
    const hashed = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${pin}:${salt}:nurse_revalidator`
    );
    
    return hashed;
  }

  /**
   * Verify NMC PIN against stored hash
   */
  async verifyNMCPin(pin: string, storedHash: string): Promise<boolean> {
    try {
      const computedHash = await this.hashNMCPin(pin);
      return computedHash === storedHash;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate a secure hash for data integrity
   */
  async generateDataHash(data: string): Promise<string> {
    return await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      data
    );
  }

  /**
   * Generate random bytes for encryption purposes
   */
  async generateRandomBytes(length: number): Promise<string> {
    const bytes = await Crypto.getRandomBytesAsync(length);
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private async getOrCreateSalt(): Promise<string> {
    try {
      let salt = await SecureStore.getItemAsync(EncryptionService.SALT_KEY);
      
      if (!salt) {
        salt = await this.generateSalt();
        await SecureStore.setItemAsync(EncryptionService.SALT_KEY, salt);
      }
      
      return salt;
    } catch (error) {
      throw new Error('Failed to manage encryption salt');
    }
  }

  private async generateSalt(): Promise<string> {
    const saltBytes = await Crypto.getRandomBytesAsync(EncryptionService.SALT_LENGTH);
    return Array.from(saltBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Clear all encryption keys (for logout/reset)
   */
  async clearEncryptionData(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(EncryptionService.SALT_KEY);
    } catch (error) {
      // Silent fail - key might not exist
    }
  }
}

// Singleton instance
export const encryptionService = new EncryptionService();