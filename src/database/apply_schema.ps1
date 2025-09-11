# PowerShell script to apply the database schema to a Supabase project
# Requirements:
# - Supabase CLI installed (https://supabase.com/docs/guides/cli)
# - Being logged in with 'supabase login'

# Instructions:
# 1. Make sure you're logged in to Supabase CLI using 'supabase login'
# 2. Set the $SUPABASE_PROJECT_ID variable below to your Supabase project ID
# 3. Run this script

# Set your Supabase project ID here
$SUPABASE_PROJECT_ID = ""

if ([string]::IsNullOrEmpty($SUPABASE_PROJECT_ID)) {
    Write-Error "Error: SUPABASE_PROJECT_ID variable is not set at the top of the script"
    Write-Host "Please edit this script and set your Supabase project ID"
    exit 1
}

Write-Host "Applying database schema to Supabase project: $SUPABASE_PROJECT_ID"

# Apply the schema to your Supabase project
$schemaContent = Get-Content -Path "schema.sql" -Raw
$schemaContent | supabase db execute --project-ref $SUPABASE_PROJECT_ID

if ($LASTEXITCODE -eq 0) {
    Write-Host "Schema applied successfully!" -ForegroundColor Green
}
else {
    Write-Error "Error applying schema. See above for details."
    exit 1
}

Write-Host "Creating storage buckets..."
supabase storage create audio --project-ref $SUPABASE_PROJECT_ID
supabase storage create documents --project-ref $SUPABASE_PROJECT_ID

Write-Host "Applying storage policies..."
$policiesContent = Get-Content -Path "storage_policies.sql" -Raw
$policiesContent | supabase db execute --project-ref $SUPABASE_PROJECT_ID

Write-Host "All done! Your Supabase project is ready to use with NurseRevalidator." -ForegroundColor Green
