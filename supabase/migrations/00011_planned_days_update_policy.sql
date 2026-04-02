-- Allow users to update their own planned_days (e.g., swap split_label between days).
-- Access verified through plan ownership: planned_days → weekly_plans → user_id.
create policy "Users can update own planned days"
  on public.planned_days for update
  using (
    exists (
      select 1 from public.weekly_plans
      where weekly_plans.id = planned_days.plan_id
        and weekly_plans.user_id = auth.uid()
    )
  );
