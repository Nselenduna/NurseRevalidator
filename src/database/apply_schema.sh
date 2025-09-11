#!/bin/bash
# Script to apply the database schema to a Supabase project
# Requirements:
# - Supabase CLI installed (https://supabase.com/docs/guides/cli)
# - Being logged in with 'supabase login'

# Instructions:
# 1. Make sure you're logged in to Supabase CLI using 'supabase login'
# 2. Set the SUPABASE_PROJECT_ID environment variable to your Supabase project ID
# 3. Run this script

if [ -z "$SUPABASE_PROJECT_ID" ]; then
  echo "Error: SUPABASE_PROJECT_ID environment variable is not set"
  echo "Usage: SUPABASE_PROJECT_ID=your-project-id ./apply_schema.sh"
  exit 1
fi

echo "Applying database schema to Supabase project: $SUPABASE_PROJECT_ID"

# Apply the schema to your Supabase project
cat schema.sql | supabase db execute --project-ref $SUPABASE_PROJECT_ID

if [ $? -eq 0 ]; then
  echo "Schema applied successfully!"
else
  echo "Error applying schema. See above for details."
  exit 1
fi

echo "Creating storage buckets..."
supabase storage create audio --project-ref $SUPABASE_PROJECT_ID
supabase storage create documents --project-ref $SUPABASE_PROJECT_ID

echo "Applying storage policies..."
cat storage_policies.sql | supabase db execute --project-ref $SUPABASE_PROJECT_ID

echo "All done! Your Supabase project is ready to use with NurseRevalidator."
