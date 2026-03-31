-- ============================================================================
-- Fix: Drop the old 2-param get_full_plan overload
-- Migration 00007 created a new 3-param overload instead of replacing the
-- original 2-param version, causing PostgREST ambiguity errors.
-- Also updates get_generation_context to use the 3-param version.
-- ============================================================================

-- 1. Drop the old 2-param function
DROP FUNCTION IF EXISTS public.get_full_plan(uuid, int);

-- 2. Recreate get_generation_context to call the 3-param get_full_plan
--    (passing NULL for week_start_date explicitly)
CREATE OR REPLACE FUNCTION public.get_generation_context(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_result jsonb;
  v_current_week int;
  v_next_week_start date;
BEGIN
  -- Sequential week number (still useful for display)
  SELECT coalesce(max(week_number), 0) INTO v_current_week
  FROM public.weekly_plans
  WHERE user_id = p_user_id;

  -- Monday of the current calendar week
  v_next_week_start := current_date - (extract(isodow FROM current_date)::int - 1);

  SELECT jsonb_build_object(
    'next_week_number', v_current_week + 1,
    'next_week_start_date', v_next_week_start,
    'user_settings', (
      SELECT row_to_json(us.*)::jsonb
      FROM public.user_settings us
      WHERE us.user_id = p_user_id
    ),
    'check_in_history', (
      SELECT coalesce(jsonb_agg(row_to_json(ci.*)::jsonb ORDER BY ci.week_number), '[]'::jsonb)
      FROM public.check_ins ci
      WHERE ci.user_id = p_user_id
    ),
    'previous_plans', (
      SELECT coalesce(jsonb_agg(
        jsonb_build_object(
          'week_number', wp.week_number,
          'status', wp.status,
          'plan', public.get_full_plan(p_user_id, wp.week_number, NULL::date)
        ) ORDER BY wp.week_number DESC
      ), '[]'::jsonb)
      FROM public.weekly_plans wp
      WHERE wp.user_id = p_user_id
    ),
    'historical_set_logs', (
      SELECT coalesce(jsonb_agg(
        jsonb_build_object(
          'exercise_id', pe.exercise_id,
          'exercise_name', pe.exercise_name,
          'week_number', wp.week_number,
          'set_number', ps.set_number,
          'target_reps', ps.target_reps,
          'target_weight', ps.target_weight,
          'actual_reps', sl.actual_reps,
          'actual_weight', sl.actual_weight,
          'status', sl.status,
          'logged_at', sl.logged_at
        ) ORDER BY wp.week_number, pe.exercise_name, ps.set_number
      ), '[]'::jsonb)
      FROM public.set_logs sl
      JOIN public.planned_sets ps ON ps.id = sl.planned_set_id
      JOIN public.planned_exercises pe ON pe.id = ps.planned_exercise_id
      JOIN public.planned_days pd ON pd.id = pe.day_id
      JOIN public.weekly_plans wp ON wp.id = pd.plan_id
      WHERE wp.user_id = p_user_id
        AND sl.status != 'pending'
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;
