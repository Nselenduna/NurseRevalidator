# Supabase Integration Guide

This document provides instructions for setting up and configuring Supabase for the NurseRevalidator application.

## Project Configuration

The NurseRevalidator app is integrated with the following Supabase project:

- **Project URL**: `https://amvacayfsnrmruqbqupq.supabase.co`
- **Project Reference ID**: `amvacayfsnrmruqbqupq`

## Environment Setup

1. Make sure your `.env` file is properly configured with the following variables:

```env
EXPO_PUBLIC_SUPABASE_URL=https://amvacayfsnrmruqbqupq.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtdmFjYXlmc25ybXJ1cWJxdXBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1NTU1MDIsImV4cCI6MjA3MzEzMTUwMn0.EAwaSEQ6l36z72HnaKqbiC8kAwitSa33Cnm44hxoa2A
EXPO_PUBLIC_FEATURE_PDF_EXPORT=true
EXPO_PUBLIC_FEATURE_VOICE_TRANSCRIPTION=true
EXPO_PUBLIC_FEATURE_OFFLINE_MODE=true
EXPO_PUBLIC_ENCRYPTION_ENABLED=true
```

## Applying Database Schema

### Using PowerShell (Windows)

1. Make sure you have the Supabase CLI installed:

   ```powershell
   npm install -g supabase
   ```

2. Login to Supabase CLI:

   ```powershell
   supabase login
   ```

3. Run the provided script:

   ```powershell
   cd src/database
   ./apply_schema.ps1
   ```

### Using Bash (macOS/Linux)

1. Make sure you have the Supabase CLI installed:

   ```bash
   npm install -g supabase
   ```

2. Login to Supabase CLI:

   ```bash
   supabase login
   ```

3. Run the provided script:

   ```bash
   cd src/database
   export SUPABASE_PROJECT_ID=amvacayfsnrmruqbqupq
   ./apply_schema.sh
   ```

## Database Structure

The application uses the following main tables:

1. `profiles` - User profiles
2. `cpd_entries` - Continuing Professional Development entries
3. `cpd_evidence` - Evidence files linked to CPD entries
4. `transcriptions` - Transcription data for audio recordings

All tables implement Row Level Security (RLS) policies to ensure data isolation between users.

## Storage Buckets

Two storage buckets are configured:

1. `audio` - For storing audio recordings
2. `documents` - For storing document evidence

Both buckets have RLS policies applied to ensure users can only access their own files.

## TypeScript Types

The database schema is reflected in TypeScript types located in:

- `src/types/supabase.types.ts` - Generated Supabase types
- `src/types/database.types.ts` - Custom database type definitions

These types provide type safety when interacting with the Supabase client.

## Edge Functions

The voice transcription feature uses a Supabase Edge Function:

- `transcribe` - Integrates with WhisperAI for transcription

To deploy the Edge Function, refer to the documentation in `supabase/functions/transcribe/README.md`.
