import AsyncStorage from '@react-native-async-storage/async-storage';
import { RegistrationData, VerificationStatus } from '../../types/registration.types';

const REGISTRATION_DATA_KEY = 'registration_data';

class RegistrationService {
  
  static formatNMCPin(pin: string): string {
    return pin.replace(/(.{2})/g, '$1 ').trim();
  }

  static getDaysUntilExpiry(expiryDate: Date): number {
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  static async getRegistrationData(): Promise<RegistrationData> {
    try {
      const data = await AsyncStorage.getItem(REGISTRATION_DATA_KEY);
      if (!data) {
        return this.createMockRegistrationData();
      }
      
      const parsed = JSON.parse(data);
      return {
        ...parsed,
        registrationDate: new Date(parsed.registrationDate),
        expiryDate: new Date(parsed.expiryDate),
        lastVerified: parsed.lastVerified ? new Date(parsed.lastVerified) : undefined,
        renewalHistory: parsed.renewalHistory?.map((renewal: any) => ({
          ...renewal,
          renewalDate: new Date(renewal.renewalDate),
          expiryDate: new Date(renewal.expiryDate),
        })) || [],
      };
    } catch (error) {
      console.error('Error getting registration data:', error);
      return this.createMockRegistrationData();
    }
  }

  static async updateRegistrationData(data: Partial<RegistrationData>): Promise<void> {
    try {
      const existing = await this.getRegistrationData();
      const updated = { ...existing, ...data };
      await AsyncStorage.setItem(REGISTRATION_DATA_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error updating registration data:', error);
      throw error;
    }
  }

  static async verifyRegistration(nmcPin: string): Promise<VerificationStatus> {
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return 'verified';
    } catch (error) {
      console.error('Error verifying registration:', error);
      return 'failed';
    }
  }

  static async scheduleNotifications(reminderDays: number[], expiryDate: Date): Promise<void> {
    try {
      console.log('Scheduling notifications for days:', reminderDays, 'expiry:', expiryDate);
    } catch (error) {
      console.error('Error scheduling notifications:', error);
      throw error;
    }
  }

  private static createMockRegistrationData(): RegistrationData {
    const now = new Date();
    const registrationDate = new Date();
    registrationDate.setFullYear(registrationDate.getFullYear() - 2); // 2 years ago
    
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 year from now
    
    const lastRenewalDate = new Date();
    lastRenewalDate.setFullYear(lastRenewalDate.getFullYear() - 1); // 1 year ago
    
    return {
      id: `reg_${Date.now()}`,
      nmcPin: this.generateMockNMCPin(),
      status: 'active',
      registrationDate,
      expiryDate,
      verificationStatus: 'pending',
      lastVerified: undefined,
      renewalHistory: [
        {
          id: `renewal_${Date.now()}`,
          renewalDate: lastRenewalDate,
          expiryDate,
          cost: 120,
          method: 'online',
          transactionId: `TXN${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        }
      ],
    };
  }

  private static generateMockNMCPin(): string {
    const digits1 = Math.floor(Math.random() * 90) + 10; // 10-99
    const letter1 = String.fromCharCode(65 + Math.floor(Math.random() * 26)); // A-Z
    const digits2 = Math.floor(Math.random() * 9000) + 1000; // 1000-9999
    const letter2 = String.fromCharCode(65 + Math.floor(Math.random() * 26)); // A-Z
    
    return `${digits1}${letter1}${digits2}${letter2}`;
  }
}

export default RegistrationService;
export { RegistrationService };