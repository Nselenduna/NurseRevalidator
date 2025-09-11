export interface DocumentCategory {
  id: string;
  label: string;
  icon: string;
  color: string;
  description?: string;
}

export interface DocumentMetadata {
  width?: number;
  height?: number;
  pageCount?: number;
  createdBy?: string;
  tags?: string[];
  encryptionLevel?: 'none' | 'basic' | 'advanced';
}

export interface UploadedDocument {
  id: string;
  uri: string;
  name: string;
  type: 'image' | 'pdf' | 'document';
  category: string;
  size: number;
  uploadDate: Date;
  lastModified?: Date;
  metadata?: DocumentMetadata;
  isEncrypted: boolean;
  checksum?: string;
}

export interface DocumentStorage {
  documents: UploadedDocument[];
  totalSize: number;
  lastBackup?: Date;
}

export interface DocumentService {
  storeDocument(uri: string, category: string, name?: string): Promise<UploadedDocument>;
  getDocument(id: string): Promise<UploadedDocument | null>;
  getAllDocuments(): Promise<UploadedDocument[]>;
  getDocumentsByCategory(category: string): Promise<UploadedDocument[]>;
  deleteDocument(id: string): Promise<boolean>;
  generatePDF(documents: UploadedDocument[], title: string): Promise<string>;
  encryptDocument(documentId: string): Promise<boolean>;
  decryptDocument(documentId: string): Promise<boolean>;
  getStorageInfo(): Promise<DocumentStorage>;
}

export interface DocumentUploaderProps {
  categories?: DocumentCategory[];
  onDocumentUploaded: (document: UploadedDocument) => void;
  onError?: (error: string) => void;
  maxFileSizeMB?: number;
  allowedTypes?: ('image' | 'pdf' | 'document')[];
  requiresCategory?: boolean;
  enableEncryption?: boolean;
  style?: any;
}

// Default categories
export const DEFAULT_DOCUMENT_CATEGORIES: DocumentCategory[] = [
  {
    id: 'cpd',
    label: 'CPD Evidence',
    icon: '📚',
    color: '#6B46C1',
    description: 'Continuing Professional Development certificates and evidence'
  },
  {
    id: 'registration',
    label: 'Registration Documents',
    icon: '📋',
    color: '#10B981',
    description: 'NMC registration certificates and renewal documents'
  },
  {
    id: 'standards',
    label: 'Professional Standards',
    icon: '⭐',
    color: '#F59E0B',
    description: 'Professional standards compliance documents'
  },
  {
    id: 'certificates',
    label: 'Certificates',
    icon: '🏆',
    color: '#EF4444',
    description: 'Training certificates and qualifications'
  },
  {
    id: 'policies',
    label: 'Policies & Guidelines',
    icon: '📄',
    color: '#8B5CF6',
    description: 'Workplace policies and professional guidelines'
  },
  {
    id: 'other',
    label: 'Other Documents',
    icon: '📁',
    color: '#6B7280',
    description: 'Miscellaneous professional documents'
  }
];

// Storage constants
export const STORAGE_KEYS = {
  DOCUMENTS: '@documents_storage',
  CATEGORIES: '@document_categories',
  SETTINGS: '@document_settings'
};

export const FILE_LIMITS = {
  MAX_SIZE_MB: 10,
  MAX_DOCUMENTS: 500,
  SUPPORTED_IMAGE_TYPES: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  SUPPORTED_DOCUMENT_TYPES: ['pdf', 'txt', 'doc', 'docx'],
  ENCRYPTION_KEY_LENGTH: 32
};