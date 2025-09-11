// Database types for the NurseRevalidator schema
// This file maps the database schema to TypeScript types

// User profile type
export interface UserProfile {
  id: string;
  full_name: string;
  nmc_pin: string;
  nmc_pin_hash?: string;
  specialization?: string;
  registration_date: string; // ISO date string
  renewal_date: string; // ISO date string
  is_verified: boolean;
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string
}

// CPD entry types
export type CPDType = 'training' | 'reflection' | 'reading' | 'discussion' | 'course' | 'other';
export type SyncStatus = 'local' | 'pending' | 'synced' | 'conflict';

export interface CPDEntry {
  id: string;
  user_id: string;
  client_id?: string;
  title: string;
  description?: string;
  type: CPDType;
  hours: number;
  date: string; // ISO date string
  has_transcription: boolean;
  has_evidence: boolean;
  learning_outcomes?: string[];
  reflection?: string;
  standards?: string[];
  is_starred: boolean;
  sync_status: SyncStatus;
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string
}

// Transcription type
export interface CPDTranscription {
  id: string;
  cpd_id: string;
  user_id: string;
  audio_path: string;
  transcription: string;
  language: string;
  confidence?: number;
  medical_terms?: string[];
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string
}

// Evidence file type
export interface CPDEvidence {
  id: string;
  cpd_id: string;
  user_id: string;
  file_path: string;
  file_type: string;
  file_name: string;
  file_size: number;
  description?: string;
  created_at: string; // ISO datetime string
}

// NMC Standard type
export interface NMCStandard {
  id: string;
  code: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
}

// CPD Export type
export interface CPDExport {
  id: string;
  user_id: string;
  file_path: string;
  entry_ids: string[];
  format: 'pdf' | 'html';
  signature_hash: string;
  created_at: string; // ISO datetime string
}

// Supabase Database type helpers
export type InsertCPDEntry = Omit<CPDEntry, 'id' | 'created_at' | 'updated_at'>;
export type UpdateCPDEntry = Partial<Omit<CPDEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

export type InsertCPDTranscription = Omit<CPDTranscription, 'id' | 'created_at' | 'updated_at'>;
export type UpdateCPDTranscription = Partial<Omit<CPDTranscription, 'id' | 'cpd_id' | 'user_id' | 'created_at' | 'updated_at'>>;

export type InsertCPDEvidence = Omit<CPDEvidence, 'id' | 'created_at'>;

export type InsertUserProfile = Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>;
export type UpdateUserProfile = Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>;

// Stats and aggregations
export interface CPDStats {
  totalHours: number;
  entriesCount: number;
  byType: Record<CPDType, number>;
  recentEntries: CPDEntry[];
  completionPercentage: number;
  hoursTarget: number;
}

// Search and filters
export interface CPDFilters {
  type?: CPDType[];
  startDate?: string;
  endDate?: string;
  hasTranscription?: boolean;
  hasEvidence?: boolean;
  isStarred?: boolean;
}

export interface CPDSearchOptions {
  filters?: CPDFilters;
  sortBy?: 'date' | 'hours' | 'title';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}
