-- Add subscription-related columns to user_metrics table
-- Run this migration in your Supabase SQL Editor

ALTER TABLE user_metrics
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMP,
ADD COLUMN IF NOT EXISTS subscription_cancel_at_period_end BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Create index for faster lookups by stripe_customer_id
CREATE INDEX IF NOT EXISTS idx_user_metrics_stripe_customer_id 
ON user_metrics(stripe_customer_id);

-- Update existing users to have free tier
UPDATE user_metrics
SET subscription_tier = 'free',
    subscription_status = 'inactive'
WHERE subscription_tier IS NULL;

-- Optional: Add a comment to document the schema
COMMENT ON COLUMN user_metrics.subscription_tier IS 'User subscription tier: free, pro, or enterprise';
COMMENT ON COLUMN user_metrics.subscription_status IS 'Stripe subscription status: active, past_due, canceled, etc.';
COMMENT ON COLUMN user_metrics.stripe_customer_id IS 'Stripe customer ID for billing';
COMMENT ON COLUMN user_metrics.stripe_subscription_id IS 'Stripe subscription ID';
COMMENT ON COLUMN user_metrics.subscription_current_period_end IS 'End date of current billing period';
