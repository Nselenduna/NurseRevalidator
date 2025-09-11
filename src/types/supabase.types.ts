export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      cpd_entries: {
        Row: {
          client_id: string | null
          created_at: string
          date: string
          description: string | null
          has_evidence: boolean
          has_transcription: boolean
          hours: number
          id: string
          is_starred: boolean
          learning_outcomes: string[] | null
          reflection: string | null
          standards: string[] | null
          sync_status: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          date: string
          description?: string | null
          has_evidence?: boolean
          has_transcription?: boolean
          hours: number
          id?: string
          is_starred?: boolean
          learning_outcomes?: string[] | null
          reflection?: string | null
          standards?: string[] | null
          sync_status?: string
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          date?: string
          description?: string | null
          has_evidence?: boolean
          has_transcription?: boolean
          hours?: number
          id?: string
          is_starred?: boolean
          learning_outcomes?: string[] | null
          reflection?: string | null
          standards?: string[] | null
          sync_status?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cpd_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      cpd_evidence: {
        Row: {
          cpd_id: string
          created_at: string
          description: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          user_id: string
        }
        Insert: {
          cpd_id: string
          created_at?: string
          description?: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          user_id: string
        }
        Update: {
          cpd_id?: string
          created_at?: string
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cpd_evidence_cpd_id_fkey"
            columns: ["cpd_id"]
            isOneToOne: false
            referencedRelation: "cpd_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cpd_evidence_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      cpd_exports: {
        Row: {
          created_at: string
          entry_ids: string[]
          file_path: string
          format: string
          id: string
          signature_hash: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entry_ids: string[]
          file_path: string
          format?: string
          id?: string
          signature_hash: string
          user_id: string
        }
        Update: {
          created_at?: string
          entry_ids?: string[]
          file_path?: string
          format?: string
          id?: string
          signature_hash?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cpd_exports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      cpd_transcriptions: {
        Row: {
          audio_path: string
          confidence: number | null
          cpd_id: string
          created_at: string
          id: string
          language: string
          medical_terms: string[] | null
          transcription: string
          updated_at: string
          user_id: string
        }
        Insert: {
          audio_path: string
          confidence?: number | null
          cpd_id: string
          created_at?: string
          id?: string
          language?: string
          medical_terms?: string[] | null
          transcription: string
          updated_at?: string
          user_id: string
        }
        Update: {
          audio_path?: string
          confidence?: number | null
          cpd_id?: string
          created_at?: string
          id?: string
          language?: string
          medical_terms?: string[] | null
          transcription?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cpd_transcriptions_cpd_id_fkey"
            columns: ["cpd_id"]
            isOneToOne: false
            referencedRelation: "cpd_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cpd_transcriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      nmc_standards: {
        Row: {
          category: string
          code: string
          description: string
          id: string
          subcategory: string | null
          title: string
        }
        Insert: {
          category: string
          code: string
          description: string
          id?: string
          subcategory?: string | null
          title: string
        }
        Update: {
          category?: string
          code?: string
          description?: string
          id?: string
          subcategory?: string | null
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          is_verified: boolean
          nmc_pin: string
          nmc_pin_hash: string | null
          registration_date: string
          renewal_date: string
          specialization: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
          is_verified?: boolean
          nmc_pin: string
          nmc_pin_hash?: string | null
          registration_date: string
          renewal_date: string
          specialization?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          is_verified?: boolean
          nmc_pin?: string
          nmc_pin_hash?: string | null
          registration_date?: string
          renewal_date?: string
          specialization?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
