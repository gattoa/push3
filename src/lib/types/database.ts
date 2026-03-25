/**
 * Push database types — mirrors the Supabase schema exactly.
 * Source of truth: supabase/migrations/00001_create_schema.sql
 */

// ============================================================================
// Row types (what Supabase returns)
// ============================================================================

export interface UserSettings {
	id: string;
	user_id: string;
	date_of_birth: string | null;
	gender: 'male' | 'female' | 'prefer_not_to_say' | null;
	goals: string;
	experience_level: string;
	equipment: string[];
	injuries: string[];
	training_days_per_week: number;
	session_duration_minutes: number;
	unit_pref: 'lb' | 'kg';
	created_at: string;
	updated_at: string;
}

export interface WeeklyPlan {
	id: string;
	user_id: string;
	week_number: number;
	status: 'generating' | 'active' | 'completed';
	created_at: string;
}

export interface PlannedDay {
	id: string;
	plan_id: string;
	day_index: number;
	split_label: string;
	created_at: string;
}

export interface ExerciseAlternative {
	exercise_id: string;
	exercise_name: string;
	body_part: string;
	target: string;
	equipment: string;
}

export interface PlannedExercise {
	id: string;
	day_id: string;
	exercise_id: string;
	exercise_name: string;
	order_index: number;
	notes: string | null;
	alternatives: ExerciseAlternative[] | null;
	rationale: string | null;
	created_at: string;
}

export interface PlannedSet {
	id: string;
	planned_exercise_id: string;
	set_number: number;
	target_reps: number;
	target_weight: number | null;
	created_at: string;
}

export interface SetLog {
	id: string;
	planned_set_id: string;
	actual_reps: number | null;
	actual_weight: number | null;
	status: 'pending' | 'completed' | 'skipped';
	logged_at: string | null;
	created_at: string;
}

export interface CheckIn {
	id: string;
	user_id: string;
	week_number: number;
	body_weight: number | null;
	injury_changes: string | null;
	equipment_changes: string | null;
	notes: string | null;
	created_at: string;
}

// ============================================================================
// Insert types (what we send to Supabase)
// ============================================================================

export interface UserSettingsInsert {
	user_id: string;
	date_of_birth?: string | null;
	gender?: 'male' | 'female' | 'prefer_not_to_say' | null;
	goals?: string;
	experience_level?: string;
	equipment?: string[];
	injuries?: string[];
	training_days_per_week?: number;
	session_duration_minutes?: number;
	unit_pref?: 'lb' | 'kg';
}

export interface UserSettingsUpdate {
	date_of_birth?: string | null;
	gender?: 'male' | 'female' | 'prefer_not_to_say' | null;
	goals?: string;
	experience_level?: string;
	equipment?: string[];
	injuries?: string[];
	training_days_per_week?: number;
	session_duration_minutes?: number;
	unit_pref?: 'lb' | 'kg';
	updated_at?: string;
}

export interface WeeklyPlanInsert {
	user_id: string;
	week_number: number;
	status?: 'generating' | 'active' | 'completed';
}

export interface PlannedDayInsert {
	plan_id: string;
	day_index: number;
	split_label: string;
}

export interface PlannedExerciseInsert {
	day_id: string;
	exercise_id: string;
	exercise_name: string;
	order_index: number;
	notes?: string | null;
	alternatives?: ExerciseAlternative[] | null;
	rationale?: string | null;
}

export interface PlannedSetInsert {
	planned_exercise_id: string;
	set_number: number;
	target_reps: number;
	target_weight?: number | null;
}

export interface SetLogInsert {
	planned_set_id: string;
	actual_reps?: number | null;
	actual_weight?: number | null;
	status?: 'pending' | 'completed' | 'skipped';
	logged_at?: string | null;
}

export interface SetLogUpdate {
	actual_reps?: number | null;
	actual_weight?: number | null;
	status?: 'pending' | 'completed' | 'skipped';
	logged_at?: string | null;
}

export interface CheckInInsert {
	user_id: string;
	week_number: number;
	body_weight?: number | null;
	injury_changes?: string | null;
	equipment_changes?: string | null;
	notes?: string | null;
}

// ============================================================================
// Composite types (returned by RPC functions)
// ============================================================================

/** Shape returned by get_full_plan RPC */
export interface FullPlan {
	plan: WeeklyPlan;
	days: FullPlanDay[];
}

export interface FullPlanDay {
	id: string;
	day_index: number;
	split_label: string;
	exercises: FullPlanExercise[];
}

export interface FullPlanExercise {
	id: string;
	exercise_id: string;
	exercise_name: string;
	order_index: number;
	notes: string | null;
	alternatives: ExerciseAlternative[] | null;
	rationale: string | null;
	sets: FullPlanSet[];
}

export interface FullPlanSet {
	id: string;
	set_number: number;
	target_reps: number;
	target_weight: number | null;
	log: SetLog | null;
}

/** Shape returned by get_generation_context RPC */
export interface GenerationContext {
	next_week_number: number;
	user_settings: UserSettings;
	check_in_history: CheckIn[];
	previous_plans: {
		week_number: number;
		status: string;
		plan: FullPlan | null;
	}[];
	historical_set_logs: HistoricalSetLog[];
}

export interface HistoricalSetLog {
	exercise_id: string;
	exercise_name: string;
	week_number: number;
	set_number: number;
	target_reps: number;
	target_weight: number | null;
	actual_reps: number | null;
	actual_weight: number | null;
	status: string;
	logged_at: string | null;
}

// ============================================================================
// Exercise history (per-exercise context for workout UI)
// ============================================================================

/** Per-exercise historical context returned by get_exercise_history RPC */
export interface ExerciseHistory {
	last_weight: number | null;
	last_reps: number | null;
	best_e1rm: number | null;
}

/** Map of exercise_id → ExerciseHistory */
export type ExerciseHistoryMap = Record<string, ExerciseHistory>;
