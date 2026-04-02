import type { SupabaseClient, Session, User } from '@supabase/supabase-js';

declare global {
	namespace App {
		interface Locals {
			supabase: SupabaseClient;
			safeGetSession: () => Promise<{ session: Session | null; user: User | null }>;
			timezone: string;
		}
		interface PageData {
			supabase?: SupabaseClient;
			session: Session | null;
			user: User | null;
			cookies?: { name: string; value: string }[];
		}
	}
}

export {};
