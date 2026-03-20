/**
 * Health check endpoint — verifies Supabase schema and ExerciseDB connectivity.
 * GET /api/health
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getEquipmentList, getExercisesByEquipment } from '$lib/server/exercisedb';

export const GET: RequestHandler = async ({ locals }) => {
	const results: Record<string, unknown> = {
		timestamp: new Date().toISOString(),
		supabase: { status: 'unknown' },
		exercisedb: { status: 'unknown' }
	};

	// ── Supabase: verify tables exist and are queryable ──
	try {
		const tables = [
			'user_settings',
			'weekly_plans',
			'planned_days',
			'planned_exercises',
			'planned_sets',
			'set_logs',
			'check_ins'
		];

		const tableResults: Record<string, string> = {};

		for (const table of tables) {
			const { error } = await locals.supabase.from(table).select('id').limit(1);
			tableResults[table] = error ? `ERROR: ${error.message}` : 'OK';
		}

		// Test RPC functions exist
		const { error: rpcError } = await locals.supabase.rpc('get_full_plan', {
			p_user_id: '00000000-0000-0000-0000-000000000000',
			p_week_number: null
		});
		// We expect null result (no data), but no function-not-found error
		const rpcOk = !rpcError || !rpcError.message.includes('function');
		tableResults['rpc:get_full_plan'] = rpcOk ? 'OK' : `ERROR: ${rpcError?.message}`;

		const { error: rpcError2 } = await locals.supabase.rpc('get_generation_context', {
			p_user_id: '00000000-0000-0000-0000-000000000000'
		});
		const rpc2Ok = !rpcError2 || !rpcError2.message.includes('function');
		tableResults['rpc:get_generation_context'] = rpc2Ok ? 'OK' : `ERROR: ${rpcError2?.message}`;

		const allOk = Object.values(tableResults).every((v) => v === 'OK');
		results.supabase = { status: allOk ? 'healthy' : 'degraded', details: tableResults };
	} catch (err) {
		results.supabase = { status: 'error', message: String(err) };
	}

	// ── ExerciseDB: verify API is reachable and returns data ──
	try {
		const equipmentList = await getEquipmentList();
		const hasEquipment = Array.isArray(equipmentList) && equipmentList.length > 0;

		let sampleExercise = null;
		if (hasEquipment) {
			const exercises = await getExercisesByEquipment('barbell', 1);
			if (exercises.length > 0) {
				sampleExercise = {
					id: exercises[0].id,
					name: exercises[0].name,
					bodyPart: exercises[0].bodyPart,
					equipment: exercises[0].equipment,
					hasGif: !!exercises[0].gifUrl,
					hasInstructions: exercises[0].instructions?.length > 0
				};
			}
		}

		results.exercisedb = {
			status: hasEquipment ? 'healthy' : 'degraded',
			equipment_count: equipmentList.length,
			equipment_sample: equipmentList.slice(0, 5),
			sample_exercise: sampleExercise
		};
	} catch (err) {
		results.exercisedb = { status: 'error', message: String(err) };
	}

	// ── Overall status ──
	const supabaseOk = (results.supabase as Record<string, unknown>).status === 'healthy';
	const exercisedbOk = (results.exercisedb as Record<string, unknown>).status === 'healthy';

	return json({
		status: supabaseOk && exercisedbOk ? 'healthy' : 'degraded',
		...results
	});
};
