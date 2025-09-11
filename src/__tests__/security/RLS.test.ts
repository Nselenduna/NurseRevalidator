// #scope:auth
import { supabase } from '../../config/supabase';

// Helper function to create a test user
async function createTestUser(email: string, password: string = 'Password123!') {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  
  if (error) throw error;
  
  return data.user;
}

// Helper function to clean up test users
async function deleteTestUser(userId: string) {
  const { error } = await supabase.functions.invoke('delete-user', {
    body: { userId },
  });
  
  if (error) console.error('Error deleting test user:', error);
}

describe('Row Level Security', () => {
  let user1: any;
  let user2: any;
  
  beforeAll(async () => {
    // Create test users
    user1 = await createTestUser('user1-rls-test@example.com');
    user2 = await createTestUser('user2-rls-test@example.com');
    
    // Wait for RLS policies to apply
    await new Promise(resolve => setTimeout(resolve, 1000));
  });
  
  afterAll(async () => {
    // Clean up test users
    if (user1?.id) await deleteTestUser(user1.id);
    if (user2?.id) await deleteTestUser(user2.id);
  });
  
  it('should prevent accessing other users CPD entries', async () => {
    // Sign in as user1
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: 'user1-rls-test@example.com',
      password: 'Password123!',
    });
    
    expect(signInError).toBeNull();
    
    // User1 creates entry
    const { data: entry, error: insertError } = await supabase
      .from('cpd_entries')
      .insert({
        title: 'User1 RLS Test CPD',
        description: 'Testing RLS policies',
        type: 'training',
        hours: 1,
        date: new Date().toISOString(),
      })
      .select()
      .single();
      
    expect(insertError).toBeNull();
    expect(entry).toBeDefined();
    
    // Sign in as user2
    await supabase.auth.signOut();
    await supabase.auth.signInWithPassword({
      email: 'user2-rls-test@example.com',
      password: 'Password123!',
    });
    
    // User2 tries to access user1's entry
    const { data, error } = await supabase
      .from('cpd_entries')
      .select()
      .eq('id', entry.id);
      
    // Should not return data due to RLS
    expect(data).toHaveLength(0);
    expect(error).toBeNull(); // No error, just empty result
  });
  
  it('should prevent accessing other users files in storage', async () => {
    // Sign in as user1
    await supabase.auth.signOut();
    await supabase.auth.signInWithPassword({
      email: 'user1-rls-test@example.com',
      password: 'Password123!',
    });
    
    // Create test file content
    const testContent = 'Test file content for RLS';
    const encoder = new TextEncoder();
    const fileData = encoder.encode(testContent);
    
    // User1 uploads file
    const filePath = `${user1.id}/test-file.txt`;
    const { error: uploadError } = await supabase
      .storage
      .from('documents')
      .upload(filePath, fileData);
      
    expect(uploadError).toBeNull();
    
    // Sign in as user2
    await supabase.auth.signOut();
    await supabase.auth.signInWithPassword({
      email: 'user2-rls-test@example.com',
      password: 'Password123!',
    });
    
    // User2 tries to access user1's file
    const { data, error: downloadError } = await supabase
      .storage
      .from('documents')
      .download(filePath);
      
    // Should not allow download due to RLS
    expect(downloadError).not.toBeNull();
    expect(data).toBeNull();
  });
});
