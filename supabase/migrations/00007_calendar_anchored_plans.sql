-- ============================================================================
-- Phase A: Calendar-Anchored Plans
-- Adds week_start_date to weekly_plans so plans are tied to real calendar weeks.
-- Updates get_full_plan RPC to look up plans by date.
-- Updates get_generation_context RPC to include next_week_start_date.
-- ============================================================================

-- 1. Add week_start_date column (nullable for backfill)
ALTER TABLE public.weekly_plans ADD COLUMN week_start_date date;

-- 2. Backfill: Monday of the week containing created_at
--    extract(isodow ...) returns 1=Monday through 7=Sunday (ISO)
UPDATE public.weekly_plans
SET week_start_date = (created_at::date - (extract(isodow from created_at)::int - 1));

-- 3. Enforce NOT NULL
ALTER TABLE public.weekly_plans ALTER COLUMN week_start_date SET NOT NULL;

-- 4. One plan per user per calendar week
ALTER TABLE public.weekly_plans
  ADD CONSTRAINT uq_weekly_plans_user_week_start UNIQUE (user_id, week_start_date);

-- ============================================================================
-- Update get_full_plan RPC
-- New parameter: p_week_start_date. When provided, look up by date.
-- When all params null, look up by current week's Monday.
-- Includes week_start_date in the returned plan JSON.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_full_plan(
  p_user_id uuid,
  p_week_number int default null,
  p_week_start_date date default null
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_plan_id uuid;
  v_result jsonb;
BEGIN
  -- Find the requested plan
  IF p_week_start_date IS NOT NULL THEN
    -- Look up by calendar week
    SELECT id INTO v_plan_id
    FROM public.weekly_plans
    WHERE user_id = p_user_id AND week_start_date = p_week_start_date
    LIMIT 1;
  ELSIF p_week_number IS NOT NULL AND p_week_number = -1 THEN
    -- Special: -1 means "latest plan regardless of week"
    SELECT id INTO v_plan_id
    FROM public.weekly_plans
    WHERE user_id = p_user_id
    ORDER BY week_start_date DESC
    LIMIT 1;
  ELSIF p_week_number IS NOT NULL THEN
    -- Look up by sequential week number
    SELECT id INTO v_plan_id
    FROM public.weekly_plans
    WHERE user_id = p_user_id AND week_number = p_week_number
    LIMIT 1;
  ELSE
    -- Default: current week's Monday
    SELECT id INTO v_plan_id
    FROM public.weekly_plans
    WHERE user_id = p_user_id
      AND week_start_date = (current_date - (extract(isodow FROM current_date)::int - 1))
    LIMIT 1;
  END IF;

  IF v_plan_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Assemble the full plan as a single JSON object
  SELECT jsonb_build_object(
    'plan', (
      SELECT jsonb_build_object(
        'id', wp.id,
        'user_id', wp.user_id,
        'week_number', wp.week_number,
        'week_start_date', wp.week_start_date,
        'status', wp.status,
        'created_at', wp.created_at
      )
      FROM public.weekly_plans wp
      WHERE wp.id = v_plan_id
    ),
    'days', (
      SELECT coalesce(jsonb_agg(
        jsonb_build_object(
          'id', pd.id,
          'day_index', pd.day_index,
          'split_label', pd.split_label,
          'exercises', (
            SELECT coalesce(jsonb_agg(
              jsonb_build_object(
                'id', pe.id,
                'exercise_id', pe.exercise_id,
                'exercise_name', pe.exercise_name,
                'order_index', pe.order_index,
                'notes', pe.notes,
                'alternatives', pe.alternatives,
                'rationale', pe.rationale,
                'sets', (
                  SELECT coalesce(jsonb_agg(
                    jsonb_build_object(
                      'id', ps.id,
                      'set_number', ps.set_number,
                      'target_reps', ps.target_reps,
                      'target_weight', ps.target_weight,
                      'log', (
                        SELECT jsonb_build_object(
                          'id', sl.id,
                          'actual_reps', sl.actual_reps,
                          'actual_weight', sl.actual_weight,
                          'status', sl.status,
                          'logged_at', sl.logged_at
                        )
                        FROM public.set_logs sl
                        WHERE sl.planned_set_id = ps.id
                        LIMIT 1
                      )
                    ) ORDER BY ps.set_number
                  ), '[]'::jsonb)
                  FROM public.planned_sets ps
                  WHERE ps.planned_exercise_id = pe.id
                )
              ) ORDER BY pe.order_index
            ), '[]'::jsonb)
            FROM public.planned_exercises pe
            WHERE pe.day_id = pd.id
          )
        ) ORDER BY pd.day_index
      ), '[]'::jsonb)
      FROM public.planned_days pd
      WHERE pd.plan_id = v_plan_id
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- ============================================================================
-- Update get_generation_context RPC
-- Adds next_week_start_date (Monday of current calendar week) to result.
-- ============================================================================
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
          'plan', public.get_full_plan(p_user_id, wp.week_number)
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
