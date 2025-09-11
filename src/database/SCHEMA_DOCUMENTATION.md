# NurseRevalidator Database Schema

## Overview

This document describes the database schema for the NurseRevalidator application. The schema is designed to support all the features required for nurses to track their Continuing Professional Development (CPD) activities and manage their revalidation process.

## Tables

### 1. `profiles`

Extends the built-in Supabase auth.users table with additional user information.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key, references auth.users(id) |
| full_name | TEXT | User's full name |
| nmc_pin | TEXT | Nursing and Midwifery Council PIN |
| nmc_pin_hash | TEXT | Securely hashed NMC PIN |
| specialization | TEXT | Nursing specialization |
| registration_date | DATE | Date of initial registration |
| renewal_date | DATE | Next revalidation due date |
| is_verified | BOOLEAN | Whether the profile is verified |
| created_at | TIMESTAMPTZ | Record creation timestamp |
| updated_at | TIMESTAMPTZ | Record update timestamp |

### 2. `cpd_entries`

Main table for storing CPD activities.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | References auth.users(id) |
| client_id | TEXT | For offline sync identification |
| title | TEXT | Title of the CPD activity |
| description | TEXT | Description of the activity |
| type | TEXT | Type of CPD (training, reflection, etc.) |
| hours | NUMERIC | Hours spent on the activity |
| date | DATE | Date the activity took place |
| has_transcription | BOOLEAN | Whether a transcription is linked |
| has_evidence | BOOLEAN | Whether evidence files are linked |
| learning_outcomes | TEXT[] | Array of learning outcomes |
| reflection | TEXT | Reflection on the activity |
| standards | TEXT[] | Array of linked NMC standards |
| is_starred | BOOLEAN | Whether the entry is marked as important |
| sync_status | TEXT | Sync status (local, pending, synced, conflict) |
| created_at | TIMESTAMPTZ | Record creation timestamp |
| updated_at | TIMESTAMPTZ | Record update timestamp |

### 3. `cpd_transcriptions`

Stores transcriptions of audio recordings linked to CPD entries.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| cpd_id | UUID | References cpd_entries(id) |
| user_id | UUID | References auth.users(id) |
| audio_path | TEXT | Path to the audio file in storage |
| transcription | TEXT | Text transcription of the audio |
| language | TEXT | Language of the transcription |
| confidence | NUMERIC | Transcription confidence score |
| medical_terms | TEXT[] | Array of detected medical terms |
| created_at | TIMESTAMPTZ | Record creation timestamp |
| updated_at | TIMESTAMPTZ | Record update timestamp |

### 4. `cpd_evidence`

Stores evidence files linked to CPD entries.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| cpd_id | UUID | References cpd_entries(id) |
| user_id | UUID | References auth.users(id) |
| file_path | TEXT | Path to the file in storage |
| file_type | TEXT | MIME type of the file |
| file_name | TEXT | Original file name |
| file_size | INTEGER | File size in bytes |
| description | TEXT | Description of the evidence |
| created_at | TIMESTAMPTZ | Record creation timestamp |

### 5. `nmc_standards`

Reference table for NMC standards that can be linked to CPD entries.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| code | TEXT | Standard code (e.g., STD1) |
| title | TEXT | Short title of the standard |
| description | TEXT | Full description of the standard |
| category | TEXT | Category of the standard |
| subcategory | TEXT | Subcategory if applicable |

### 6. `cpd_exports`

Tracks PDF exports of CPD entries.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | References auth.users(id) |
| file_path | TEXT | Path to the exported file in storage |
| entry_ids | UUID[] | Array of exported cpd_entries IDs |
| format | TEXT | Export format (e.g., pdf) |
| signature_hash | TEXT | Digital signature hash for verification |
| created_at | TIMESTAMPTZ | Record creation timestamp |

## Row Level Security (RLS) Policies

Each table has Row Level Security policies to ensure that users can only access their own data.

## Storage Buckets

The application uses two storage buckets:

1. `audio` - For storing audio recordings
2. `documents` - For storing evidence files and PDF exports

Both buckets have RLS policies to ensure that users can only access their own files.

## How to Apply the Schema

1. Make sure you have the Supabase CLI installed and are logged in
2. Set your Supabase project ID in the `apply_schema.ps1` script
3. Run the script to apply the schema to your Supabase project

```powershell
cd src/database
./apply_schema.ps1
```

For Unix-based systems, use the `apply_schema.sh` script:

```bash
cd src/database
chmod +x apply_schema.sh
SUPABASE_PROJECT_ID=your_project_id ./apply_schema.sh
```
