// #scope:storage-policies
import { supabase } from '../../config/supabase';

describe('Storage Policies', () => {
  let testUserId: string;
  let secondUserId: string;
  
  beforeAll(async () => {
    // Get authenticated user ID for testing
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      testUserId = session.user.id;
    } else {
      // Skip tests if no authenticated session
      console.warn('No authenticated session for storage policy tests');
      return;
    }
  });

  describe('Audio bucket policies', () => {
    const testFileName = 'test-audio.mp3';
    let uploadedPath: string;

    beforeEach(() => {
      uploadedPath = `${testUserId}/${testFileName}`;
    });

    afterEach(async () => {
      // Clean up uploaded files
      try {
        await supabase.storage
          .from('audio')
          .remove([uploadedPath]);
      } catch (error) {
        // Ignore cleanup errors
      }
    });

    it('should allow users to upload files to their own folder', async () => {
      const testContent = new Uint8Array([1, 2, 3, 4]); // Mock audio data
      
      const { data, error } = await supabase.storage
        .from('audio')
        .upload(uploadedPath, testContent);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('should allow users to read their own files', async () => {
      // First upload a file
      const testContent = new Uint8Array([1, 2, 3, 4]);
      await supabase.storage
        .from('audio')
        .upload(uploadedPath, testContent);

      // Then try to read it
      const { data, error } = await supabase.storage
        .from('audio')
        .download(uploadedPath);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('should allow users to delete their own files', async () => {
      // First upload a file
      const testContent = new Uint8Array([1, 2, 3, 4]);
      await supabase.storage
        .from('audio')
        .upload(uploadedPath, testContent);

      // Then try to delete it
      const { data, error } = await supabase.storage
        .from('audio')
        .remove([uploadedPath]);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('should prevent users from accessing files outside their folder', async () => {
      const otherUserPath = 'other-user-id/test-file.mp3';
      
      const { data, error } = await supabase.storage
        .from('audio')
        .download(otherUserPath);

      // Should fail due to RLS policy
      expect(error).not.toBeNull();
      expect(data).toBeNull();
    });
  });

  describe('Documents bucket policies', () => {
    const testFileName = 'test-document.pdf';
    let uploadedPath: string;

    beforeEach(() => {
      uploadedPath = `${testUserId}/${testFileName}`;
    });

    afterEach(async () => {
      // Clean up uploaded files
      try {
        await supabase.storage
          .from('documents')
          .remove([uploadedPath]);
      } catch (error) {
        // Ignore cleanup errors
      }
    });

    it('should allow users to upload documents to their own folder', async () => {
      const testContent = new Uint8Array([80, 68, 70]); // Mock PDF header
      
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(uploadedPath, testContent);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('should allow users to read their own documents', async () => {
      // First upload a document
      const testContent = new Uint8Array([80, 68, 70]);
      await supabase.storage
        .from('documents')
        .upload(uploadedPath, testContent);

      // Then try to read it
      const { data, error } = await supabase.storage
        .from('documents')
        .download(uploadedPath);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('should prevent users from accessing other users documents', async () => {
      const otherUserPath = 'other-user-id/sensitive-document.pdf';
      
      const { data, error } = await supabase.storage
        .from('documents')
        .download(otherUserPath);

      // Should fail due to RLS policy
      expect(error).not.toBeNull();
      expect(data).toBeNull();
    });

    it('should allow listing files only in users own folder', async () => {
      // Upload a test file first
      const testContent = new Uint8Array([80, 68, 70]);
      await supabase.storage
        .from('documents')
        .upload(uploadedPath, testContent);

      // List files in user's folder
      const { data, error } = await supabase.storage
        .from('documents')
        .list(testUserId);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('File path validation', () => {
    it('should reject files uploaded outside user folder structure', async () => {
      const invalidPath = 'root-level-file.txt';
      const testContent = new Uint8Array([1, 2, 3]);
      
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(invalidPath, testContent);

      // Should fail due to path restrictions
      expect(error).not.toBeNull();
    });

    it('should reject files with other users ID in path', async () => {
      const otherUserId = 'fake-user-id-12345';
      const invalidPath = `${otherUserId}/malicious-file.txt`;
      const testContent = new Uint8Array([1, 2, 3]);
      
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(invalidPath, testContent);

      // Should fail due to user ID mismatch
      expect(error).not.toBeNull();
    });
  });

  describe('Storage bucket existence', () => {
    it('should have audio bucket configured', async () => {
      const { data, error } = await supabase.storage
        .getBucket('audio');

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.name).toBe('audio');
    });

    it('should have documents bucket configured', async () => {
      const { data, error } = await supabase.storage
        .getBucket('documents');

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.name).toBe('documents');
    });
  });
});