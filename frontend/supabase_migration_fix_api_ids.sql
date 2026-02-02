-- Migration to change account_id from UUID to TEXT to match Clerk User IDs
-- Apply this in Supabase execution

BEGIN;

-- 1. api_keys
ALTER TABLE api_keys 
ALTER COLUMN account_id TYPE text USING account_id::text;

-- 2. api_jobs
ALTER TABLE api_jobs 
ALTER COLUMN account_id TYPE text USING account_id::text;

-- 3. api_usage_monthly (Careful as it is part of PK)
ALTER TABLE api_usage_monthly 
ALTER COLUMN account_id TYPE text USING account_id::text;

COMMIT;
