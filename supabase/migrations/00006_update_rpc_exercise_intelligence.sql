-- Phase 8: Exercise Intelligence — RPC + policy updates
-- 1. Update get_full_plan to return alternatives + rationale per exercise
-- 2. Add DELETE policies on planned_sets and set_logs for swap functionality

-- ============================================================================
-- Update get_full_plan RPC to include new planned_exercises columns
-- ============================================================================
create or replace function public.get_full_plan(p_user_id uuid, p_week_number int default null)
returns jsonb
language plpgsql
security definer set search_path = ''
as $$
declare
  v_plan_id uuid;
  v_result jsonb;
begin
  -- Find the requested plan (or the latest active plan)
  if p_week_number is not null then
    select id into v_plan_id
    from public.weekly_plans
    where user_id = p_user_id and week_number = p_week_number
    limit 1;
  else
    select id into v_plan_id
    from public.weekly_plans
    where user_id = p_user_id
    order by week_number desc
    limit 1;
  end if;

  if v_plan_id is null then
    return null;
  end if;

  -- Assemble the full plan as a single JSON object
  select jsonb_build_object(
    'plan', (
      select jsonb_build_object(
        'id', wp.id,
        'user_id', wp.user_id,
        'week_number', wp.week_number,
        'status', wp.status,
        'created_at', wp.created_at
      )
      from public.weekly_plans wp
      where wp.id = v_plan_id
    ),
    'days', (
      select coalesce(jsonb_agg(
        jsonb_build_object(
          'id', pd.id,
          'day_index', pd.day_index,
          'split_label', pd.split_label,
          'exercises', (
            select coalesce(jsonb_agg(
              jsonb_build_object(
                'id', pe.id,
                'exercise_id', pe.exercise_id,
                'exercise_name', pe.exercise_name,
                'order_index', pe.order_index,
                'notes', pe.notes,
                'alternatives', pe.alternatives,
                'rationale', pe.rationale,
                'sets', (
                  select coalesce(jsonb_agg(
                    jsonb_build_object(
                      'id', ps.id,
                      'set_number', ps.set_number,
                      'target_reps', ps.target_reps,
                      'target_weight', ps.target_weight,
                      'log', (
                        select jsonb_build_object(
                          'id', sl.id,
                          'actual_reps', sl.actual_reps,
                          'actual_weight', sl.actual_weight,
                          'status', sl.status,
                          'logged_at', sl.logged_at
                        )
                        from public.set_logs sl
                        where sl.planned_set_id = ps.id
                        limit 1
                      )
                    ) order by ps.set_number
                  ), '[]'::jsonb)
                  from public.planned_sets ps
                  where ps.planned_exercise_id = pe.id
                )
              ) order by pe.order_index
            ), '[]'::jsonb)
            from public.planned_exercises pe
            where pe.day_id = pd.id
          )
        ) order by pd.day_index
      ), '[]'::jsonb)
      from public.planned_days pd
      where pd.plan_id = v_plan_id
    )
  ) into v_result;

  return v_result;
end;
$$;

-- ============================================================================
-- DELETE policies for swap functionality
-- When swapping an exercise, we need to delete its planned_sets and set_logs.
-- ============================================================================

-- Allow users to delete their own planned_sets (via plan ownership chain)
create policy "Users can delete own planned sets"
  on public.planned_sets for delete
  using (
    exists (
      select 1 from public.planned_exercises
      join public.planned_days on planned_days.id = planned_exercises.day_id
      join public.weekly_plans on weekly_plans.id = planned_days.plan_id
      where planned_exercises.id = planned_sets.planned_exercise_id
        and weekly_plans.user_id = auth.uid()
    )
  );

-- Allow users to delete their own set_logs (via plan ownership chain)
create policy "Users can delete own set logs"
  on public.set_logs for delete
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
