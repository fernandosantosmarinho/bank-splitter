-- Add locale column to user_metrics table for language preference
-- Run this migration in your Supabase SQL Editor

ALTER TABLE user_metrics
ADD COLUMN IF NOT EXISTS locale TEXT DEFAULT 'en';

-- Add a comment to document the column
COMMENT ON COLUMN user_metrics.locale IS 'User preferred language locale (en, pt, es, fr, de)';

-- Optional: Add a check constraint to ensure valid locales
ALTER TABLE user_metrics
ADD CONSTRAINT valid_locale CHECK (locale IN ('en', 'pt', 'es', 'fr', 'de'));
