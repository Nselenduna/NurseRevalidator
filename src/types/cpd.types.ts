import { NavigationProp } from '@react-navigation/native';

// CPD Entry types
export type CPDType = 'course' | 'conference' | 'reflection' | 'mentoring' | 'other';
export type SyncStatus = 'local' | 'synced' | 'pending';
export type RecordingStatus = 'idle' | 'recording' | 'paused' | 'processing';

// NMC Categories for CPD
export interface NMCCategory {
  id: string;
  name: string;
  description: string;
  requiredHours: number;
}

// Evidence attachment
export interface Evidence {
  id: string;
  name: string;
  type: 'pdf' | 'jpg' | 'png' | 'doc';
  uri: string;
  size: number;
  uploadedAt: Date;
  thumbnailUri?: string;
}

// Audio recording metadata
export interface AudioRecording {
  id: string;
  uri: string;
  duration: number; // in seconds
  transcript?: string;
  transcriptConfidence?: number; // 0-100%
  waveformData?: number[]; // For visualization
  createdAt: Date;
  fileSize: number;
}

// Transcript metadata
export interface TranscriptMetadata {
  confidence: number;
  language: string;
  medicalTermsDetected: string[];
  editHistory: {
    timestamp: Date;
    changes: string;
  }[];
}

// CPD Entry interface
export interface CPDEntry {
  id: string;
  title: string;
  date: Date;
  duration: number; // hours
  type: CPDType;
  description: string;
  learningOutcomes: string[];
  audioRecording?: AudioRecording;
  evidence: Evidence[];
  nmcCategories: NMCCategory[];
  createdAt: Date;
  updatedAt: Date;
  syncStatus: SyncStatus;
  isStarred: boolean;
}

// Component prop interfaces
export interface CPDTrackerScreenProps {
  navigation: NavigationProp<any>;
}

export interface CPDListProps {
  entries: CPDEntry[];
  onEntryPress: (entry: CPDEntry) => void;
  onEditEntry: (entry: CPDEntry) => void;
  onDeleteEntry: (entryId: string) => void;
  isLoading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export interface CPDEntryCardProps {
  entry: CPDEntry;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStar: () => void;
}

export interface CPDEntryFormProps {
  initialEntry?: CPDEntry;
  onSave: (entry: Omit<CPDEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

export interface AudioRecorderProps {
  onRecordingComplete: (recording: AudioRecording) => void;
  maxDuration?: number; // default: 3600 seconds (1 hour)
  onStatusChange?: (status: RecordingStatus) => void;
  disabled?: boolean;
}

export interface VoiceToTextEditorProps {
  audioRecording: AudioRecording;
  initialTranscript?: string;
  onSave: (editedText: string, metadata: TranscriptMetadata) => void;
  onCancel: () => void;
}

export interface TranscriptEditorProps {
  transcript: string;
  confidence: number;
  onTextChange: (text: string) => void;
  onSave: () => void;
  medicalTerms?: string[];
}

// Audio service interfaces
export interface AudioRecordingOptions {
  quality: 'low' | 'medium' | 'high';
  format: 'aac' | 'mp3' | 'wav';
  sampleRate: number;
  bitRate: number;
  channels: number;
}

export interface AudioServiceInterface {
  startRecording: (options?: Partial<AudioRecordingOptions>) => Promise<void>;
  stopRecording: () => Promise<AudioRecording>;
  pauseRecording: () => Promise<void>;
  resumeRecording: () => Promise<void>;
  getRecordingStatus: () => RecordingStatus;
  getRecordingDuration: () => number;
  deleteRecording: (uri: string) => Promise<void>;
  generateWaveform: (uri: string) => Promise<number[]>;
}

// Transcription service interface
export interface TranscriptionServiceInterface {
  transcribeAudio: (audioUri: string) => Promise<{
    transcript: string;
    confidence: number;
    metadata: Partial<TranscriptMetadata>;
  }>;
  detectMedicalTerms: (text: string) => string[];
  correctMedicalTerms: (text: string) => string;
}

// CPD service interface
export interface CPDServiceInterface {
  getAllEntries: () => Promise<CPDEntry[]>;
  getEntry: (id: string) => Promise<CPDEntry | null>;
  createEntry: (entry: Omit<CPDEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<CPDEntry>;
  updateEntry: (id: string, updates: Partial<CPDEntry>) => Promise<CPDEntry>;
  deleteEntry: (id: string) => Promise<void>;
  searchEntries: (query: string) => Promise<CPDEntry[]>;
  getEntriesByType: (type: CPDType) => Promise<CPDEntry[]>;
  getEntriesByDateRange: (startDate: Date, endDate: Date) => Promise<CPDEntry[]>;
  exportEntries: (format: 'pdf' | 'csv') => Promise<string>; // Returns file URI
  syncWithCloud: () => Promise<void>;
}

// Statistics and analytics
export interface CPDStats {
  totalHours: number;
  entriesCount: number;
  hoursThisYear: number;
  hoursLastYear: number;
  averageHoursPerMonth: number;
  typeDistribution: {
    [key in CPDType]: number;
  };
  compliancePercentage: number;
  nextRevalidationDate: Date;
  hoursNeeded: number;
}

// Filter and search options
export interface CPDFilters {
  type?: CPDType;
  dateFrom?: Date;
  dateTo?: Date;
  hasAudio?: boolean;
  hasEvidence?: boolean;
  starred?: boolean;
  syncStatus?: SyncStatus;
}

export interface CPDSearchOptions {
  query: string;
  filters: CPDFilters;
  sortBy: 'date' | 'title' | 'duration' | 'type';
  sortOrder: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Form validation
export interface CPDEntryValidation {
  title: string[];
  date: string[];
  duration: string[];
  description: string[];
  learningOutcomes: string[];
  type: string[];
}

// Voice recording states
export interface RecordingState {
  status: RecordingStatus;
  duration: number;
  audioLevels: number[];
  isPaused: boolean;
  error?: string;
}