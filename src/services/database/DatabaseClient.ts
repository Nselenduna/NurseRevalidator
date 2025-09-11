// #scope:auth
import { supabase } from '../../config/supabase';
import { CPDEntry } from '../../types/cpd.types';

/**
 * Client for handling database operations with RLS
 */
export class DatabaseClient {
  /**
   * Get authenticated user
   */
  async getAuthenticatedUser() {
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      throw new Error(`Authentication error: ${error.message}`);
    }
    
    if (!data.user) {
      throw new Error('No authenticated user found');
    }
    
    return data.user;
  }
  
  /**
   * Get CPD entries for current user
   */
  async getCPDEntries() {
    const { data, error } = await supabase
      .from('cpd_entries')
      .select('*')
      .order('date', { ascending: false });
      
    if (error) {
      throw new Error(`Failed to fetch CPD entries: ${error.message}`);
    }
    
    return data;
  }
  
  /**
   * Get single CPD entry by ID
   */
  async getCPDEntry(id: string) {
    const { data, error } = await supabase
      .from('cpd_entries')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      throw new Error(`Failed to fetch CPD entry: ${error.message}`);
    }
    
    return data;
  }
  
  /**
   * Create new CPD entry
   */
  async createCPDEntry(entry: Omit<CPDEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    const user = await this.getAuthenticatedUser();
    
    const { data, error } = await supabase
      .from('cpd_entries')
      .insert({
        ...entry,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
      
    if (error) {
      throw new Error(`Failed to create CPD entry: ${error.message}`);
    }
    
    return data;
  }
  
  /**
   * Update CPD entry
   */
  async updateCPDEntry(id: string, updates: Partial<CPDEntry>) {
    const { data, error } = await supabase
      .from('cpd_entries')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      throw new Error(`Failed to update CPD entry: ${error.message}`);
    }
    
    return data;
  }
  
  /**
   * Delete CPD entry
   */
  async deleteCPDEntry(id: string) {
    const { error } = await supabase
      .from('cpd_entries')
      .delete()
      .eq('id', id);
      
    if (error) {
      throw new Error(`Failed to delete CPD entry: ${error.message}`);
    }
    
    return true;
  }
  
  /**
   * Create transcription entry
   */
  async createTranscription(cpdId: string, transcription: string, audioPath: string) {
    const user = await this.getAuthenticatedUser();
    
    const { data, error } = await supabase
      .from('cpd_transcriptions')
      .insert({
        cpd_id: cpdId,
        user_id: user.id,
        audio_path: audioPath,
        transcription: transcription,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
      
    if (error) {
      throw new Error(`Failed to create transcription: ${error.message}`);
    }
    
    return data;
  }
  
  /**
   * Get transcription for CPD entry
   */
  async getTranscription(cpdId: string) {
    const { data, error } = await supabase
      .from('cpd_transcriptions')
      .select('*')
      .eq('cpd_id', cpdId)
      .single();
      
    if (error) {
      // If no transcription is found, return null instead of throwing
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch transcription: ${error.message}`);
    }
    
    return data;
  }
}

// Export singleton instance
export const db = new DatabaseClient();
