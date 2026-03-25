-- Phase 8: Exercise Intelligence
-- Adds pre-generated swap alternatives and AI rationale per exercise.

-- alternatives: JSON array of up to 3 swap candidates, each with exercise_id, exercise_name, body_part, target, equipment
alter table public.planned_exercises
  add column alternatives jsonb default null;

-- rationale: brief AI-generated explanation of why this exercise was chosen
alter table public.planned_exercises
  add column rationale text default null;

-- Update RLS policies: planned_exercises already has SELECT/INSERT policies
-- that check plan ownership through planned_days → weekly_plans.
-- We need an UPDATE policy so swaps can modify the exercise in place.
create policy "Users can update own planned exercises"
  on public.planned_exercises for update
  using (
    exists (
      select 1 from public.planned_days
      join public.weekly_plans on weekly_plans.id = planned_days.plan_id
      where planned_days.id = planned_exercises.day_id
        and weekly_plans.user_id = auth.uid()
    )
  );
