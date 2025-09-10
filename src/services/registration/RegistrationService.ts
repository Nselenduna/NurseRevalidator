import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { 
  RegistrationData, 
  RegistrationServiceInterface, 
  Document, 
  VerificationStatus,
  RegistrationStatus
} from '../../types/registration.types';

const REGISTRATION_KEY = '@registration_data';

class RegistrationService implements RegistrationServiceInterface {
  
  async getRegistrationData(): Promise<RegistrationData> {
    try {
      const storedData = await AsyncStorage.getItem(REGISTRATION_KEY);
      if (storedData) {
        const data = JSON.parse(storedData);
        // Convert date strings back to Date objects
        data.registrationDate = new Date(data.registrationDate);
        data.expiryDate = new Date(data.expiryDate);
        data.lastVerified = data.lastVerified ? new Date(data.lastVerified) : undefined;
        data.renewalHistory = data.renewalHistory.map((record: any) => ({
          ...record,
          renewalDate: new Date(record.renewalDate),
          expiryDate: new Date(record.expiryDate),
        }));
        return data;
      }
      
      // Return default/mock data if none exists
      return this.getMockRegistrationData();
    } catch (error) {
      console.error('Failed to load registration data:', error);
      return this.getMockRegistrationData();
    }
  }

  async updateRegistrationData(updates: Partial<RegistrationData>): Promise<void> {
    try {
      const currentData = await this.getRegistrationData();
      const updatedData = { ...currentData, ...updates };
      await AsyncStorage.setItem(REGISTRATION_KEY, JSON.stringify(updatedData));
    } catch (error) {
      console.error('Failed to update registration data:', error);
      throw new Error('Failed to save registration data');
    }
  }

  async uploadDocument(file: any): Promise<Document> {
    // Mock implementation - in real app would upload to server
    const document: Document = {
      id: `doc_${Date.now()}`,
      name: file.name || `Document_${Date.now()}`,
      type: file.type || 'pdf',
      uri: file.uri,
      size: file.size || 0,
      uploadedAt: new Date(),
      thumbnailUri: file.thumbnailUri,
    };

    // Add to registration data
    const currentData = await this.getRegistrationData();
    currentData.documents.push(document);
    await this.updateRegistrationData(currentData);

    return document;
  }

  async scheduleNotifications(reminderDays: number[], expiryDate: Date): Promise<void> {
    try {
      // Cancel existing notifications
      await Notifications.cancelAllScheduledNotificationsAsync();

      // Schedule new notifications
      for (const days of reminderDays) {
        const reminderDate = new Date(expiryDate);
        reminderDate.setDate(reminderDate.getDate() - days);

        if (reminderDate > new Date()) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'NMC Registration Reminder',
              body: `Your registration expires in ${days} days. Don't forget to renew!`,
              data: { type: 'registration_reminder', days },
            },
            trigger: {
              date: reminderDate,
            },
          });
        }
      }

      // Update notification settings
      await this.updateRegistrationData({
        notifications: {
          enabled: true,
          reminderDays,
        },
      });
    } catch (error) {
      console.error('Failed to schedule notifications:', error);
      throw new Error('Failed to schedule notifications');
    }
  }

  async verifyRegistration(nmcPin: string): Promise<VerificationStatus> {
    // Mock implementation - in real app would call NMC API
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock verification logic
      const isValid = nmcPin.length >= 7 && /^[A-Z0-9]+$/i.test(nmcPin);
      const status: VerificationStatus = isValid ? 'verified' : 'failed';
      
      // Update verification status
      await this.updateRegistrationData({
        verificationStatus: status,
        lastVerified: new Date(),
      });

      return status;
    } catch (error) {
      console.error('Failed to verify registration:', error);
      return 'failed';
    }
  }

  private getMockRegistrationData(): RegistrationData {
    const currentDate = new Date();
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 8); // 8 months from now

    return {
      nmcPin: '20C1262O',
      registrationDate: new Date('2020-01-15'),
      expiryDate,
      status: this.calculateStatus(expiryDate),
      renewalHistory: [
        {
          id: 'renewal_1',
          renewalDate: new Date('2023-01-15'),
          expiryDate: expiryDate,
          status: 'completed',
          documents: [],
          paymentReference: 'PAY_123456789',
        }
      ],
      documents: [],
      notifications: {
        enabled: true,
        reminderDays: [90, 30, 14, 7],
      },
      verificationStatus: 'verified',
      lastVerified: new Date(),
    };
  }

  private calculateStatus(expiryDate: Date): RegistrationStatus {
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return 'expired';
    } else if (daysUntilExpiry <= 90) {
      return 'expiring_soon';
    } else {
      return 'active';
    }
  }

  // Utility method to calculate days until expiry
  static getDaysUntilExpiry(expiryDate: Date): number {
    const now = new Date();
    return Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Format NMC PIN for display
  static formatNMCPin(pin: string): string {
    return pin.replace(/(.{2})(.{3})(.{3})(.*)/, '$1 $2 $3 $4').trim();
  }
}

export default new RegistrationService();