-- Push POC Schema
-- Source of truth: docs/technical/architecture-plan-generation.md
-- All data is retained indefinitely (architecture Decision 3: History Is Never Destroyed)

-- ============================================================================
-- user_settings
-- Represents "who the athlete is now" — current preferences, equipment, goals.
-- Updated in place on each check-in; historical state lives in check_ins.
-- ============================================================================
create table public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goals text not null default 'general_fitness',
  experience_level text not null default 'beginner',
  equipment text[] not null default '{}',
  injuries text[] not null default '{}',
  training_days_per_week int not null default 3,
  session_duration_minutes int not null default 60,
  unit_pref text not null default 'lb' check (unit_pref in ('lb', 'kg')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

-- ============================================================================
-- weekly_plans
-- One plan per user per week. Never deleted.
-- ============================================================================
create table public.weekly_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_number int not null,
  status text not null default 'active' check (status in ('generating', 'active', 'completed')),
  created_at timestamptz not null default now(),
  unique(user_id, week_number)
);

-- ============================================================================
-- planned_days
-- 7 days per plan with split labels (Push, Pull, Legs, Upper, Lower, Rest, etc.)
-- ============================================================================
create table public.planned_days (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.weekly_plans(id) on delete cascade,
  day_index int not null check (day_index between 0 and 6),
  split_label text not null default 'Rest',
  created_at timestamptz not null default now(),
  unique(plan_id, day_index)
);

-- ============================================================================
-- planned_exercises
-- Exercises assigned to each day. exercise_id references ExerciseDB.
-- ============================================================================
create table public.planned_exercises (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references public.planned_days(id) on delete cascade,
  exercise_id text not null,
  exercise_name text not null,
  order_index int not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- planned_sets
-- Prescribed sets with target reps and optional target weight.
-- target_weight is NULL for cold start (Week 1) and new exercises without baseline.
-- ============================================================================
create table public.planned_sets (
  id uuid primary key default gen_random_uuid(),
  planned_exercise_id uuid not null references public.planned_exercises(id) on delete cascade,
  set_number int not null,
  target_reps int not null,
  target_weight numeric,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- set_logs
-- Actual performance logged by the athlete. Links to the prescribed set.
-- Never deleted — historical depth drives generator quality.
-- ============================================================================
create table public.set_logs (
  id uuid primary key default gen_random_uuid(),
  planned_set_id uuid not null references public.planned_sets(id) on delete cascade,
  actual_reps int,
  actual_weight numeric,
  status text not null default 'pending' check (status in ('pending', 'completed', 'skipped')),
  logged_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- check_ins
-- Historical record of each weekly check-in. Appended, never updated.
-- Represents "how the athlete has changed over time."
-- ============================================================================
create table public.check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_number int not null,
  body_weight numeric,
  injury_changes text,
  equipment_changes text,
  notes text,
  created_at timestamptz not null default now(),
  unique(user_id, week_number)
);

-- ============================================================================
-- Row Level Security
-- Every table is locked to the owning user.
-- ============================================================================

alter table public.user_settings enable row level security;
alter table public.weekly_plans enable row level security;
alter table public.planned_days enable row level security;
alter table public.planned_exercises enable row level security;
alter table public.planned_sets enable row level security;
alter table public.set_logs enable row level security;
alter table public.check_ins enable row level security;

-- user_settings: users can read/write their own row
create policy "Users can view own settings"
  on public.user_settings for select
  using (auth.uid() = user_id);

create policy "Users can update own settings"
  on public.user_settings for update
  using (auth.uid() = user_id);

create policy "Users can insert own settings"
  on public.user_settings for insert
  with check (auth.uid() = user_id);

-- weekly_plans: users can read their own plans; insert handled by server
create policy "Users can view own plans"
  on public.weekly_plans for select
  using (auth.uid() = user_id);

create policy "Users can insert own plans"
  on public.weekly_plans for insert
  with check (auth.uid() = user_id);

create policy "Users can update own plans"
  on public.weekly_plans for update
  using (auth.uid() = user_id);

-- planned_days: access through plan ownership
create policy "Users can view own planned days"
  on public.planned_days for select
  using (
    exists (
      select 1 from public.weekly_plans
      where weekly_plans.id = planned_days.plan_id
        and weekly_plans.user_id = auth.uid()
    )
  );

create policy "Users can insert own planned days"
  on public.planned_days for insert
  with check (
    exists (
      select 1 from public.weekly_plans
      where weekly_plans.id = planned_days.plan_id
        and weekly_plans.user_id = auth.uid()
    )
  );

-- planned_exercises: access through plan ownership
create policy "Users can view own planned exercises"
  on public.planned_exercises for select
  using (
    exists (
      select 1 from public.planned_days
      join public.weekly_plans on weekly_plans.id = planned_days.plan_id
      where planned_days.id = planned_exercises.day_id
        and weekly_plans.user_id = auth.uid()
    )
  );

create policy "Users can insert own planned exercises"
  on public.planned_exercises for insert
  with check (
    exists (
      select 1 from public.planned_days
      join public.weekly_plans on weekly_plans.id = planned_days.plan_id
      where planned_days.id = planned_exercises.day_id
        and weekly_plans.user_id = auth.uid()
    )
  );

-- planned_sets: access through plan ownership
create policy "Users can view own planned sets"
  on public.planned_sets for select
  using (
    exists (
      select 1 from public.planned_exercises
      join public.planned_days on planned_days.id = planned_exercises.day_id
      join public.weekly_plans on weekly_plans.id = planned_days.plan_id
      where planned_exercises.id = planned_sets.planned_exercise_id
        and weekly_plans.user_id = auth.uid()
    )
  );

create policy "Users can insert own planned sets"
  on public.planned_sets for insert
  with check (
    exists (
      select 1 from public.planned_exercises
      join public.planned_days on planned_days.id = planned_exercises.day_id
      join public.weekly_plans on weekly_plans.id = planned_days.plan_id
      where planned_exercises.id = planned_sets.planned_exercise_id
        and weekly_plans.user_id = auth.uid()
    )
  );

-- set_logs: access through plan ownership
create policy "Users can view own set logs"
  on public.set_logs for select
  using (
    exists (
      select 1 from public.planned_sets
      join public.planned_exercises on planned_exercises.id = planned_sets.planned_exercise_id
      join public.planned_days on planned_days.id = planned_exercises.day_id
      join public.weekly_plans on weekly_plans.id = planned_days.plan_id
      where planned_sets.id = set_logs.planned_set_id
        and weekly_plans.user_id = auth.uid()
    )
  );

create policy "Users can insert own set logs"
  on public.set_logs for insert
  with check (
    exists (
      select 1 from public.planned_sets
      join public.planned_exercises on planned_exercises.id = planned_sets.planned_exercise_id
      join public.planned_days on planned_days.id = planned_exercises.day_id
      join public.weekly_plans on weekly_plans.id = planned_days.plan_id
      where planned_sets.id = set_logs.planned_set_id
        and weekly_plans.user_id = auth.uid()
    )
  );

create policy "Users can update own set logs"
  on public.set_logs for update
  using (
    exists (
      select 1 from public.planned_sets
      join public.planned_exercises on planned_exercises.id = planned_sets.planned_exercise_id
      join public.planned_days on planned_days.id = planned_exercises.day_id
      join public.weekly_plans on weekly_plans.id = planned_days.plan_id
      where planned_sets.id = set_logs.planned_set_id
        and weekly_plans.user_id = auth.uid()
    )
  );

-- check_ins: users can read/write their own
create policy "Users can view own check-ins"
  on public.check_ins for select
  using (auth.uid() = user_id);

create policy "Users can insert own check-ins"
  on public.check_ins for insert
  with check (auth.uid() = user_id);

create policy "Users can update own check-ins"
  on public.check_ins for update
  using (auth.uid() = user_id);

-- ============================================================================
-- Indexes for common query patterns
-- ============================================================================
create index idx_weekly_plans_user_id on public.weekly_plans(user_id);
create index idx_weekly_plans_user_week on public.weekly_plans(user_id, week_number);
create index idx_planned_days_plan_id on public.planned_days(plan_id);
create index idx_planned_exercises_day_id on public.planned_exercises(day_id);
create index idx_planned_sets_exercise_id on public.planned_sets(planned_exercise_id);
create index idx_set_logs_set_id on public.set_logs(planned_set_id);
create index idx_check_ins_user_id on public.check_ins(user_id);
create index idx_check_ins_user_week on public.check_ins(user_id, week_number);
