-- ============================================================================
-- Phase B: Day Preferences
-- Replace training_days_per_week (integer count) with training_days (integer array).
-- Athletes now select which specific days they train, not just how many.
-- ============================================================================

-- Add training_days array column
ALTER TABLE public.user_settings ADD COLUMN training_days int[] NOT NULL DEFAULT '{0,2,4}';

-- Drop training_days_per_week — count is derived from array_length(training_days, 1)
ALTER TABLE public.user_settings DROP COLUMN training_days_per_week;
