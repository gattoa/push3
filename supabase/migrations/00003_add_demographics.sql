-- Phase 6: Onboarding Overhaul — add demographic columns for age/gender-aware coaching
-- See: docs/design/onboarding.md (Step 1: About You)

alter table public.user_settings
  add column date_of_birth date,
  add column gender text check (gender in ('male', 'female', 'prefer_not_to_say'));
