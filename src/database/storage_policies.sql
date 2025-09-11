-- #scope:storage-policy
-- Correct storage bucket policies for NurseRevalidator app
-- These policies ensure users can only access their own files

-- Audio bucket policies
INSERT INTO storage.policies (name, bucket_id, expression, operation)
VALUES 
  ('Users can upload own audio files', 
   'audio',
   'bucket_id = ''audio'' AND (storage.foldername(name))[1] = auth.uid()',
   'INSERT'),
   
  ('Users can view own audio files',
   'audio', 
   'bucket_id = ''audio'' AND (storage.foldername(name))[1] = auth.uid()',
   'SELECT'),
   
  ('Users can delete own audio files',
   'audio',
   'bucket_id = ''audio'' AND (storage.foldername(name))[1] = auth.uid()',
   'DELETE');

-- Documents bucket policies
INSERT INTO storage.policies (name, bucket_id, expression, operation)
VALUES 
  ('Users can upload own documents', 
   'documents',
   'bucket_id = ''documents'' AND (storage.foldername(name))[1] = auth.uid()',
   'INSERT'),
   
  ('Users can view own documents',
   'documents', 
   'bucket_id = ''documents'' AND (storage.foldername(name))[1] = auth.uid()',
   'SELECT'),
   
  ('Users can delete own documents',
   'documents',
   'bucket_id = ''documents'' AND (storage.foldername(name))[1] = auth.uid()',
   'DELETE');

-- Alternative syntax if above doesn't work
-- Create policies using CREATE POLICY syntax
CREATE POLICY "User owns audio files"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'audio' AND 
    auth.uid()::text = (string_to_array(name, '/'))[1]
  );

CREATE POLICY "User owns documents"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'documents' AND 
    auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- CPD entries table RLS policy
CREATE POLICY "Users can only access their own CPD entries"
  ON public.cpd_entries
  USING (user_id = auth.uid());
