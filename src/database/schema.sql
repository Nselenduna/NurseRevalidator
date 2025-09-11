-- NurseRevalidator Database Schema for Supabase
-- This schema includes all necessary tables for CPD entries, transcriptions, and user profiles
-- with proper Row Level Security (RLS) policies for data isolation

-- Enable RLS on all tables (default on in Supabase)
ALTER DATABASE postgres SET "enable_row_level_security" TO on;

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- USER PROFILES TABLE
-- Stores additional user information beyond the auth.users table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  nmc_pin TEXT NOT NULL,
  nmc_pin_hash TEXT,
  specialization TEXT,
  registration_date DATE NOT NULL,
  renewal_date DATE NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'Nurse profiles with NMC registration details';

-- CPD ENTRIES TABLE
-- Main table for Continuing Professional Development entries
CREATE TABLE public.cpd_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id TEXT, -- For offline sync identification
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('training', 'reflection', 'reading', 'discussion', 'course', 'other')),
  hours NUMERIC(5,2) NOT NULL,
  date DATE NOT NULL,
  has_transcription BOOLEAN NOT NULL DEFAULT FALSE,
  has_evidence BOOLEAN NOT NULL DEFAULT FALSE,
  learning_outcomes TEXT[],
  reflection TEXT,
  standards TEXT[],
  is_starred BOOLEAN NOT NULL DEFAULT FALSE,
  sync_status TEXT NOT NULL DEFAULT 'synced' CHECK (sync_status IN ('local', 'pending', 'synced', 'conflict')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.cpd_entries IS 'CPD entries for nurse revalidation';

-- CPD TRANSCRIPTIONS TABLE
-- Stores audio transcriptions linked to CPD entries
CREATE TABLE public.cpd_transcriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cpd_id UUID NOT NULL REFERENCES public.cpd_entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  audio_path TEXT NOT NULL,
  transcription TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  confidence NUMERIC(5,2),
  medical_terms TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.cpd_transcriptions IS 'Audio transcriptions for CPD entries';

-- CPD EVIDENCE TABLE
-- Stores evidence documents linked to CPD entries
CREATE TABLE public.cpd_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cpd_id UUID NOT NULL REFERENCES public.cpd_entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.cpd_evidence IS 'Evidence files for CPD entries';

-- NMC STANDARDS TABLE
-- Reference table for NMC standards that can be linked to CPD entries
CREATE TABLE public.nmc_standards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT
);

COMMENT ON TABLE public.nmc_standards IS 'NMC standards reference data';

-- CPD EXPORTS TABLE
-- Tracks PDF exports of CPD entries
CREATE TABLE public.cpd_exports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  entry_ids UUID[] NOT NULL,
  format TEXT NOT NULL DEFAULT 'pdf',
  signature_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.cpd_exports IS 'Record of CPD entry exports';

-- INDEXES
CREATE INDEX idx_cpd_entries_user_id ON public.cpd_entries(user_id);
CREATE INDEX idx_cpd_entries_date ON public.cpd_entries(date);
CREATE INDEX idx_cpd_entries_type ON public.cpd_entries(type);
CREATE INDEX idx_cpd_transcriptions_cpd_id ON public.cpd_transcriptions(cpd_id);
CREATE INDEX idx_cpd_evidence_cpd_id ON public.cpd_evidence(cpd_id);

-- ROW LEVEL SECURITY POLICIES

-- Profiles table RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

-- CPD entries table RLS
ALTER TABLE public.cpd_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own CPD entries"
  ON public.cpd_entries FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own CPD entries"
  ON public.cpd_entries FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own CPD entries"
  ON public.cpd_entries FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own CPD entries"
  ON public.cpd_entries FOR DELETE
  USING (user_id = auth.uid());

-- CPD transcriptions table RLS
ALTER TABLE public.cpd_transcriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transcriptions"
  ON public.cpd_transcriptions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own transcriptions"
  ON public.cpd_transcriptions FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- CPD evidence table RLS
ALTER TABLE public.cpd_evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own evidence"
  ON public.cpd_evidence FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own evidence"
  ON public.cpd_evidence FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own evidence"
  ON public.cpd_evidence FOR DELETE
  USING (user_id = auth.uid());

-- CPD exports table RLS
ALTER TABLE public.cpd_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own exports"
  ON public.cpd_exports FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own exports"
  ON public.cpd_exports FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- NMC standards are readable by everyone
ALTER TABLE public.nmc_standards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Standards are viewable by all authenticated users"
  ON public.nmc_standards FOR SELECT
  USING (auth.role() = 'authenticated');

-- FUNCTIONS

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TRIGGERS

-- Auto-update the updated_at column for profiles
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Auto-update the updated_at column for CPD entries
CREATE TRIGGER update_cpd_entries_updated_at
BEFORE UPDATE ON public.cpd_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Auto-update the updated_at column for CPD transcriptions
CREATE TRIGGER update_cpd_transcriptions_updated_at
BEFORE UPDATE ON public.cpd_transcriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- INITIAL DATA

-- Insert some common NMC standards
INSERT INTO public.nmc_standards (code, title, description, category, subcategory)
VALUES 
('STD1', 'Prioritise people', 'You put the interests of people using or needing nursing or midwifery services first.', 'Core Standards', NULL),
('STD2', 'Practice effectively', 'You assess needs and deliver or advise on treatment, or give help (including preventative or rehabilitative care) without too much delay, to the best of your abilities.', 'Core Standards', NULL),
('STD3', 'Preserve safety', 'You make sure that patient and public safety is not affected. This includes working within the limits of your competence, being open and honest about mistakes and taking action to minimize risks.', 'Core Standards', NULL),
('STD4', 'Promote professionalism and trust', 'You promote professionalism and trust in the nursing and midwifery professions by being a model of integrity and leadership.', 'Core Standards', NULL);

-- GRANTS
-- Give necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.nmc_standards TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.cpd_entries TO authenticated;
GRANT ALL ON public.cpd_transcriptions TO authenticated;
GRANT ALL ON public.cpd_evidence TO authenticated;
GRANT ALL ON public.cpd_exports TO authenticated;
