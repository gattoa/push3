-- ============================================================================
-- Auto-create user_settings on signup
-- When a new user is created in auth.users, insert a default user_settings row.
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.user_settings (user_id)
  values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================================
-- RPC: get_full_plan
-- Fetches a complete plan (plan → days → exercises → sets → set_logs) in one call.
-- Eliminates the 5-query waterfall identified in the architecture plan.
-- Returns JSON to avoid multiple round trips.
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
-- RPC: get_generation_context
-- Assembles all inputs needed for plan generation in one call.
-- Used by the server-side generation API route before calling Claude.
-- ============================================================================
create or replace function public.get_generation_context(p_user_id uuid)
returns jsonb
language plpgsql
security definer set search_path = ''
as $$
declare
  v_result jsonb;
  v_current_week int;
begin
  -- Determine current week number (latest completed or active plan + 1, or 1 if none)
  select coalesce(max(week_number), 0) into v_current_week
  from public.weekly_plans
  where user_id = p_user_id;

  select jsonb_build_object(
    'next_week_number', v_current_week + 1,
    'user_settings', (
      select row_to_json(us.*)::jsonb
      from public.user_settings us
      where us.user_id = p_user_id
    ),
    'check_in_history', (
      select coalesce(jsonb_agg(row_to_json(ci.*)::jsonb order by ci.week_number), '[]'::jsonb)
      from public.check_ins ci
      where ci.user_id = p_user_id
    ),
    'previous_plans', (
      select coalesce(jsonb_agg(
        jsonb_build_object(
          'week_number', wp.week_number,
          'status', wp.status,
          'plan', public.get_full_plan(p_user_id, wp.week_number)
        ) order by wp.week_number desc
      ), '[]'::jsonb)
      from public.weekly_plans wp
      where wp.user_id = p_user_id
    ),
    'historical_set_logs', (
      select coalesce(jsonb_agg(
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
        ) order by wp.week_number, pe.exercise_name, ps.set_number
      ), '[]'::jsonb)
      from public.set_logs sl
      join public.planned_sets ps on ps.id = sl.planned_set_id
      join public.planned_exercises pe on pe.id = ps.planned_exercise_id
      join public.planned_days pd on pd.id = pe.day_id
      join public.weekly_plans wp on wp.id = pd.plan_id
      where wp.user_id = p_user_id
        and sl.status != 'pending'
    )
  ) into v_result;

  return v_result;
end;
$$;
