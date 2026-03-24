-- ============================================================================
-- RPC: get_exercise_history
-- Returns per-exercise historical context for the workout UI:
--   - last_weight / last_reps: most recent completed set
--   - best_e1rm: all-time best estimated 1RM (Epley formula)
-- Called with an array of exercise_ids from today's plan.
-- ============================================================================

create or replace function public.get_exercise_history(
  p_user_id uuid,
  p_exercise_ids text[]
)
returns jsonb
language plpgsql
security definer set search_path = ''
as $$
declare
  v_result jsonb;
begin
  select coalesce(jsonb_object_agg(sub.exercise_id, sub.exercise_data), '{}'::jsonb)
  into v_result
  from (
    select
      eid.exercise_id,
      jsonb_build_object(
        'last_weight', last_log.actual_weight,
        'last_reps', last_log.actual_reps,
        'best_e1rm', best.e1rm
      ) as exercise_data
    from unnest(p_exercise_ids) as eid(exercise_id)
    -- Most recent completed set for this exercise (by logged_at)
    left join lateral (
      select sl.actual_weight, sl.actual_reps
      from public.set_logs sl
      join public.planned_sets ps on ps.id = sl.planned_set_id
      join public.planned_exercises pe on pe.id = ps.planned_exercise_id
      join public.planned_days pd on pd.id = pe.day_id
      join public.weekly_plans wp on wp.id = pd.plan_id
      where wp.user_id = p_user_id
        and pe.exercise_id = eid.exercise_id
        and sl.status = 'completed'
        and sl.actual_weight is not null
        and sl.actual_reps is not null
      order by sl.logged_at desc nulls last
      limit 1
    ) last_log on true
    -- Best estimated 1RM across all completed sets (Epley: weight * (1 + reps / 30))
    left join lateral (
      select max(sl2.actual_weight * (1.0 + sl2.actual_reps / 30.0)) as e1rm
      from public.set_logs sl2
      join public.planned_sets ps2 on ps2.id = sl2.planned_set_id
      join public.planned_exercises pe2 on pe2.id = ps2.planned_exercise_id
      join public.planned_days pd2 on pd2.id = pe2.day_id
      join public.weekly_plans wp2 on wp2.id = pd2.plan_id
      where wp2.user_id = p_user_id
        and pe2.exercise_id = eid.exercise_id
        and sl2.status = 'completed'
        and sl2.actual_weight is not null
        and sl2.actual_reps is not null
        and sl2.actual_weight > 0
    ) best on true
  ) sub;

  return v_result;
end;
$$;

-- Index to speed up exercise_id lookups in the join chain
create index if not exists idx_planned_exercises_exercise_id
  on public.planned_exercises(exercise_id);
