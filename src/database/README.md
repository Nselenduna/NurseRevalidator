# Supabase Database Setup for NurseRevalidator

This directory contains the database schema and scripts needed to set up the Supabase backend for the NurseRevalidator application.

## Files

- `schema.sql`: Complete database schema including tables, indexes, RLS policies, and triggers
- `storage_policies.sql`: Policies for Supabase Storage buckets
- `apply_schema.ps1`: PowerShell script to apply the schema to your Supabase project
- `apply_schema.sh`: Bash script to apply the schema to your Supabase project
- `SCHEMA_DOCUMENTATION.md`: Detailed documentation of the database schema

## Setup Instructions

### Option 1: Using the Supabase Dashboard (SQL Editor)

1. Log in to the [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to the "SQL Editor" section
4. Create a new query
5. Paste the contents of `schema.sql`
6. Run the query
7. Create another query with the contents of `storage_policies.sql`
8. Run the second query

### Option 2: Using the Supabase CLI

#### Prerequisites

1. Install the Supabase CLI: [Installation Instructions](https://supabase.com/docs/guides/cli/getting-started)
2. Log in to the CLI:

```bash
supabase login
```

#### Windows (PowerShell)

1. Open PowerShell
2. Navigate to this directory:

```powershell
cd path\to\NurseRevalidator\src\database
```

3. Edit `apply_schema.ps1` and set your Supabase project ID
4. Run the script:

```powershell
.\apply_schema.ps1
```

#### macOS/Linux (Bash)

1. Open Terminal
2. Navigate to this directory:

```bash
cd path/to/NurseRevalidator/src/database
```

3. Make the script executable:

```bash
chmod +x apply_schema.sh
```

4. Run the script with your Supabase project ID:

```bash
SUPABASE_PROJECT_ID=your_project_id ./apply_schema.sh
```

## After Setup

Once you've applied the schema:

1. Verify the tables were created in the Supabase Dashboard
2. Check that the storage buckets (`audio` and `documents`) were created
3. Confirm that RLS policies are in place by checking the "Authentication" > "Policies" section

## Connecting to the Schema

The TypeScript types for this schema are defined in:

- `src/types/database.types.ts` - Application-specific types
- `src/types/supabase.types.ts` - Supabase-generated types

The Supabase client is configured to use these types in `src/config/supabase.ts`.

## Troubleshooting

If you encounter issues:

1. Check the Supabase logs for any SQL errors
2. Make sure you have the correct permissions in your Supabase project
3. Verify that the Supabase URL and API key in `.env.local` are correct
