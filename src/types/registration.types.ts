import { NavigationProp } from '@react-navigation/native';

// Registration status types
export type RegistrationStatus = 'active' | 'expiring_soon' | 'expired' | 'pending';
export type VerificationStatus = 'verified' | 'pending' | 'failed';

// Document types
export interface Document {
  id: string;
  name: string;
  type: 'pdf' | 'jpg' | 'png';
  uri: string;
  size: number;
  uploadedAt: Date;
  thumbnailUri?: string;
}

// Renewal record
export interface RenewalRecord {
  id: string;
  renewalDate: Date;
  expiryDate: Date;
  status: 'completed' | 'pending' | 'failed';
  documents: Document[];
  paymentReference?: string;
}

// Registration data interface
export interface RegistrationData {
  nmcPin: string;
  registrationDate: Date;
  expiryDate: Date;
  status: RegistrationStatus;
  renewalHistory: RenewalRecord[];
  documents: Document[];
  notifications: {
    enabled: boolean;
    reminderDays: number[];
  };
  verificationStatus: VerificationStatus;
  lastVerified?: Date;
}

// Component prop interfaces
export interface StatusCardProps {
  nmcPin: string;
  status: RegistrationStatus;
  expiryDate: Date;
  lastRenewal?: Date;
  verificationStatus: VerificationStatus;
}

export interface RenewalCountdownProps {
  targetDate: Date;
  onExpire?: () => void;
  status: RegistrationStatus;
}

export interface DocumentUploaderProps {
  onUpload: (document: Document) => void;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
  allowCamera?: boolean;
}

export interface RenewalTimelineProps {
  renewalHistory: RenewalRecord[];
  currentStatus: RegistrationStatus;
}

// Screen props
export interface RegistrationStatusScreenProps {
  navigation: NavigationProp<any>;
}

// Service interfaces
export interface RegistrationServiceInterface {
  getRegistrationData: () => Promise<RegistrationData>;
  updateRegistrationData: (data: Partial<RegistrationData>) => Promise<void>;
  uploadDocument: (file: any) => Promise<Document>;
  scheduleNotifications: (reminderDays: number[], expiryDate: Date) => Promise<void>;
  verifyRegistration: (nmcPin: string) => Promise<VerificationStatus>;
}

// Notification settings
export interface NotificationSettings {
  enabled: boolean;
  reminderDays: number[];
  timeOfDay: {
    hour: number;
    minute: number;
  };
}