-- ============================================================================
-- Add energy_level to check_ins for subjective recovery tracking.
-- Used by the AI coach for autoregulated deload detection.
-- ============================================================================

ALTER TABLE public.check_ins
  ADD COLUMN energy_level text;
