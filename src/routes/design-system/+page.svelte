<script lang="ts">
	import BarbellIcon from '$lib/components/icons/BarbellIcon.svelte';
	import {
		Check,
		X,
		ChevronLeft,
		ChevronRight,
		CalendarDays,
		Timer,
		Trophy,
		Flame,
		ClipboardCheck,
		Dumbbell,
		Moon,
		TrendingUp,
		CirclePlus,
		Pencil,
		LogOut,
		Target,
		Info,
		CircleUser,
		Menu,
		Play,
		Pause,
		RotateCcw,
		ChartNoAxesCombined,
		ArrowRight
	} from 'lucide-svelte';

	const icons = [
		{ component: Check, label: 'Complete' },
		{ component: X, label: 'Skip' },
		{ component: ChevronLeft, label: 'Back' },
		{ component: ChevronRight, label: 'Next' },
		{ component: CalendarDays, label: 'Agenda' },
		{ component: Timer, label: 'Timer' },
		{ component: Trophy, label: 'PR' },
		{ component: Flame, label: 'Streak' },
		{ component: ClipboardCheck, label: 'Check-in' },
		{ component: Dumbbell, label: 'Exercise' },
		{ component: Moon, label: 'Rest day' },
		{ component: TrendingUp, label: 'Trend' },
		{ component: CirclePlus, label: 'Add' },
		{ component: Pencil, label: 'Edit' },
		{ component: LogOut, label: 'Sign out' },
		{ component: Target, label: 'Goal' },
		{ component: Info, label: 'Info' },
		{ component: CircleUser, label: 'Account' },
		{ component: Play, label: 'Start' },
		{ component: Pause, label: 'Pause' },
		{ component: RotateCcw, label: 'Reset' },
		{ component: ChartNoAxesCombined, label: 'Progress' },
		{ component: ArrowRight, label: 'Forward' }
	];
</script>

<div class="page">
	<!-- ════════════════ HERO ════════════════ -->
	<section class="hero">
		<div class="hero-glow"></div>
		<div class="hero-mark push-up" style="--d:0">
			<BarbellIcon size={40} color="var(--color-text)" />
		</div>
		<h1 class="hero-word push-up" style="--d:1">push</h1>
		<p class="hero-sub push-up" style="--d:2">Design System v1</p>
	</section>

	<!-- ════════════════ PALETTE ════════════════ -->
	<section class="palette">
		<h2 class="section-title">Palette</h2>
		<p class="section-desc">
			Color shifts with context. Each moment in the app has its own energy.
		</p>

		<div class="color-panels">
			<div class="color-panel panel-activity push-up" style="--d:0">
				<div class="panel-label">Activity</div>
				<div class="panel-sample">
					<Dumbbell size={20} />
					<span>Bench Press</span>
				</div>
				<div class="panel-value">#2dd4a8</div>
			</div>
			<div class="color-panel panel-rest push-up" style="--d:1">
				<div class="panel-label">Rest</div>
				<div class="panel-sample">
					<Timer size={20} />
					<span>1:30</span>
				</div>
				<div class="panel-value">#64a1f4</div>
			</div>
			<div class="color-panel panel-celebrate push-up" style="--d:2">
				<div class="panel-label">Celebrate</div>
				<div class="panel-sample">
					<Trophy size={20} />
					<span>New PR</span>
				</div>
				<div class="panel-value">#e8b931</div>
			</div>
			<div class="color-panel panel-reflect push-up" style="--d:3">
				<div class="panel-label">Reflect</div>
				<div class="panel-sample">
					<ClipboardCheck size={20} />
					<span>Check-in</span>
				</div>
				<div class="panel-value">#a78bfa</div>
			</div>
			<div class="color-panel panel-danger push-up" style="--d:4">
				<div class="panel-label">Danger</div>
				<div class="panel-sample">
					<X size={20} />
					<span>Skip</span>
				</div>
				<div class="panel-value">#f27a7a</div>
			</div>
		</div>

		<div class="gradient-strip">
			<div class="gradient-bar"></div>
			<span class="gradient-caption">Brand gradient</span>
		</div>

		<div class="surface-strip">
			<div class="surface-swatch" style="background:#0b0a09"></div>
			<div class="surface-swatch" style="background:#12110f"></div>
			<div class="surface-swatch" style="background:#17150f"></div>
			<div class="surface-swatch" style="background:#1d1b16"></div>
			<div class="surface-swatch" style="background:#23211b"></div>
			<div class="surface-swatch" style="background:#28251e"></div>
			<div class="surface-swatch" style="background:#34312a"></div>
			<span class="surface-label">Surfaces &amp; borders (warm-tinted)</span>
		</div>
	</section>

	<!-- ════════════════ TYPE ════════════════ -->
	<section class="type">
		<h2 class="section-title">Typography</h2>
		<p class="section-desc">
			Manrope everywhere. One voice, many weights.
		</p>

		<div class="type-display">
			<span class="type-hero">225 lbs</span>
			<span class="type-sub">Squat PR &middot; Week 6</span>
		</div>

		<div class="type-scale">
			<div class="scale-row">
				<span class="scale-label">4xl</span>
				<span class="scale-sample s-4xl">Push</span>
			</div>
			<div class="scale-row">
				<span class="scale-label">3xl</span>
				<span class="scale-sample s-3xl">Bench Press</span>
			</div>
			<div class="scale-row">
				<span class="scale-label">2xl</span>
				<span class="scale-sample s-2xl">Weekly Check-in</span>
			</div>
			<div class="scale-row">
				<span class="scale-label">xl</span>
				<span class="scale-sample s-xl">3 of 4 sets complete</span>
			</div>
			<div class="scale-row">
				<span class="scale-label">lg</span>
				<span class="scale-sample s-lg">Today's workout is ready</span>
			</div>
			<div class="scale-row">
				<span class="scale-label">base</span>
				<span class="scale-sample s-base">Track your lifts. Build momentum.</span>
			</div>
			<div class="scale-row">
				<span class="scale-label">sm</span>
				<span class="scale-sample s-sm">Last performed 3 days ago</span>
			</div>
			<div class="scale-row">
				<span class="scale-label">xs</span>
				<span class="scale-sample s-xs">Set 3 &middot; Target: 10 reps &middot; 145 lbs</span>
			</div>
		</div>

		<div class="type-mono">
			<span class="mono-big">00:90</span>
			<span class="mono-label">JetBrains Mono &mdash; timers only</span>
		</div>

		<div class="type-weights">
			<span class="tw" style="font-weight:400">Regular 400</span>
			<span class="tw" style="font-weight:500">Medium 500</span>
			<span class="tw" style="font-weight:600">Semibold 600</span>
			<span class="tw" style="font-weight:700">Bold 700</span>
			<span class="tw" style="font-weight:800">Extrabold 800</span>
		</div>
	</section>

	<!-- ════════════════ IN CONTEXT ════════════════ -->
	<section class="contexts">
		<h2 class="section-title">In Context</h2>
		<p class="section-desc">
			The app shifts its energy based on what you're doing.
		</p>

		<div class="ctx-grid">
			<!-- Workout -->
			<div class="ctx ctx-activity push-up" style="--d:0">
				<div class="ctx-bar">
					<ChevronLeft size={16} />
					<span>Bench Press</span>
					<span class="ctx-pill">3/4</span>
				</div>
				<div class="ctx-content">
					<div class="ctx-set">
						<span class="set-n">3</span>
						<span class="set-target">10 reps</span>
						<input class="set-input" type="number" value="145" readonly />
						<input class="set-input" type="number" value="10" readonly />
						<button class="set-done"><Check size={14} /></button>
					</div>
					<div class="ctx-track">
						<div class="ctx-track-fill" style="width:75%"></div>
					</div>
				</div>
			</div>

			<!-- Rest -->
			<div class="ctx ctx-rest push-up" style="--d:1">
				<div class="ctx-bar">
					<Timer size={16} />
					<span>Rest</span>
				</div>
				<div class="ctx-content ctx-center">
					<span class="ctx-clock">1:30</span>
					<span class="ctx-clock-sub">remaining</span>
				</div>
			</div>

			<!-- Complete -->
			<div class="ctx ctx-celebrate push-up" style="--d:2">
				<div class="ctx-bar">
					<Trophy size={16} />
					<span>Complete</span>
				</div>
				<div class="ctx-content">
					<div class="ctx-stats">
						<div class="ctx-stat">
							<span class="stat-n">6</span>
							<span class="stat-l">exercises</span>
						</div>
						<div class="ctx-stat">
							<span class="stat-n">24</span>
							<span class="stat-l">sets</span>
						</div>
						<div class="ctx-stat">
							<span class="stat-n stat-pr"><Trophy size={13} /> 1</span>
							<span class="stat-l">new PR</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Check-in -->
			<div class="ctx ctx-reflect push-up" style="--d:3">
				<div class="ctx-bar">
					<ClipboardCheck size={16} />
					<span>Check-in</span>
				</div>
				<div class="ctx-content">
					<span class="ctx-q">How's your energy?</span>
					<div class="ctx-opts">
						<button class="ctx-opt">Low</button>
						<button class="ctx-opt ctx-opt-on">Good</button>
						<button class="ctx-opt">Great</button>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- ════════════════ SHAPE EXPLORATION ════════════════ -->
	<section class="shapes">
		<h2 class="section-title">Shape Exploration</h2>
		<p class="section-desc">Finding Push's signature. The arc — the path of a bar being pressed.</p>

		<div class="shape-grid">
			<!-- A: Arc progress vs straight -->
			<div class="shape-card">
				<h3 class="shape-label">Progress: Straight (current)</h3>
				<div class="shape-demo">
					<div class="straight-prog">
						<div class="straight-fill" style="width:72%"></div>
					</div>
					<span class="shape-val">72%</span>
				</div>
			</div>

			<div class="shape-card">
				<h3 class="shape-label">Progress: Arc gauge</h3>
				<div class="shape-demo">
					<svg class="arc-gauge" viewBox="0 0 120 80" fill="none">
						<path d="M 15 70 A 50 50 0 0 1 105 70" stroke="var(--color-border)" stroke-width="6" stroke-linecap="round" fill="none" />
						<path d="M 15 70 A 50 50 0 0 1 105 70" stroke="var(--color-activity)" stroke-width="6" stroke-linecap="round" fill="none" stroke-dasharray="141" stroke-dashoffset="39" />
					</svg>
					<span class="arc-val">72%</span>
				</div>
			</div>

			<div class="shape-card">
				<h3 class="shape-label">Progress: Semi-ring</h3>
				<div class="shape-demo">
					<svg class="arc-gauge" viewBox="0 0 120 80" fill="none">
						<path d="M 20 75 A 45 45 0 0 1 100 75" stroke="var(--color-border)" stroke-width="4" stroke-linecap="round" fill="none" />
						<path d="M 20 75 A 45 45 0 0 1 100 75" stroke="url(#grad1)" stroke-width="4" stroke-linecap="round" fill="none" stroke-dasharray="128" stroke-dashoffset="36" />
						<defs>
							<linearGradient id="grad1" x1="0" y1="0" x2="1" y2="0">
								<stop offset="0%" stop-color="var(--color-activity)" />
								<stop offset="100%" stop-color="var(--color-celebrate)" />
							</linearGradient>
						</defs>
					</svg>
					<span class="arc-val">72%</span>
				</div>
			</div>

			<!-- B: Container shapes -->
			<div class="shape-card">
				<h3 class="shape-label">Container: Uniform radius (current)</h3>
				<div class="shape-container uniform-r">
					<Dumbbell size={16} />
					<span>Bench Press</span>
					<span class="shape-stat">145 lbs</span>
				</div>
			</div>

			<div class="shape-card">
				<h3 class="shape-label">Container: Asymmetric (push up)</h3>
				<div class="shape-container asym-r">
					<Dumbbell size={16} />
					<span>Bench Press</span>
					<span class="shape-stat">145 lbs</span>
				</div>
			</div>

			<div class="shape-card">
				<h3 class="shape-label">Container: Pill / stadium</h3>
				<div class="shape-container pill-r">
					<Dumbbell size={16} />
					<span>Bench Press</span>
					<span class="shape-stat">145 lbs</span>
				</div>
			</div>

			<!-- C: Brand mark variations -->
			<div class="shape-card">
				<h3 class="shape-label">Mark: Barbell only (current)</h3>
				<div class="shape-demo mark-demo">
					<BarbellIcon size={48} color="var(--color-text)" />
				</div>
			</div>

			<div class="shape-card">
				<h3 class="shape-label">Mark: Barbell + arc</h3>
				<div class="shape-demo mark-demo">
					<svg width="64" height="56" viewBox="0 0 64 56" fill="none">
						<path d="M 12 48 A 28 28 0 0 1 52 48" stroke="url(#brandArc)" stroke-width="3" stroke-linecap="round" fill="none" />
						<defs>
							<linearGradient id="brandArc" x1="12" y1="48" x2="52" y2="48">
								<stop offset="0%" stop-color="var(--color-activity)" />
								<stop offset="50%" stop-color="var(--color-celebrate)" />
								<stop offset="100%" stop-color="var(--color-reflect)" />
							</linearGradient>
						</defs>
						<!-- barbell -->
						<rect x="10" y="14" width="44" height="10" rx="3" fill="var(--color-text)" opacity="0.12"/>
						<rect x="16" y="10" width="5" height="18" rx="1.5" fill="var(--color-text)"/>
						<rect x="43" y="10" width="5" height="18" rx="1.5" fill="var(--color-text)"/>
						<rect x="21" y="15" width="22" height="8" rx="1.5" fill="var(--color-text)"/>
						<rect x="12" y="13" width="9" height="3" rx="1" fill="var(--color-text)" opacity="0.5"/>
						<rect x="43" y="13" width="9" height="3" rx="1" fill="var(--color-text)" opacity="0.5"/>
						<rect x="12" y="22" width="9" height="3" rx="1" fill="var(--color-text)" opacity="0.5"/>
						<rect x="43" y="22" width="9" height="3" rx="1" fill="var(--color-text)" opacity="0.5"/>
					</svg>
				</div>
			</div>

			<div class="shape-card">
				<h3 class="shape-label">Mark: Arc only (abstract)</h3>
				<div class="shape-demo mark-demo">
					<svg width="64" height="48" viewBox="0 0 64 48" fill="none">
						<path d="M 8 40 A 30 30 0 0 1 56 40" stroke="url(#brandArc2)" stroke-width="4" stroke-linecap="round" fill="none" />
						<path d="M 18 40 A 20 20 0 0 1 46 40" stroke="var(--color-text)" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.3" />
						<defs>
							<linearGradient id="brandArc2" x1="8" y1="40" x2="56" y2="40">
								<stop offset="0%" stop-color="var(--color-activity)" />
								<stop offset="50%" stop-color="var(--color-celebrate)" />
								<stop offset="100%" stop-color="var(--color-reflect)" />
							</linearGradient>
						</defs>
					</svg>
				</div>
			</div>

			<!-- D: Accent elements -->
			<div class="shape-card">
				<h3 class="shape-label">Accent: Arc underline</h3>
				<div class="shape-demo">
					<span class="accent-stat">225 lbs</span>
					<svg class="accent-arc" viewBox="0 0 100 12" fill="none" preserveAspectRatio="none">
						<path d="M 0 10 Q 50 -2 100 10" stroke="var(--color-celebrate)" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.6" />
					</svg>
				</div>
			</div>

			<div class="shape-card">
				<h3 class="shape-label">Accent: Arc behind stat</h3>
				<div class="shape-demo">
					<div class="arc-stat-wrap">
						<svg class="arc-bg" viewBox="0 0 120 60" fill="none">
							<path d="M 10 55 A 55 55 0 0 1 110 55" stroke="var(--color-activity)" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.15" />
							<path d="M 20 55 A 45 45 0 0 1 100 55" stroke="var(--color-activity)" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.08" />
						</svg>
						<span class="arc-stat-num">6</span>
						<span class="arc-stat-label">exercises</span>
					</div>
				</div>
			</div>

			<div class="shape-card">
				<h3 class="shape-label">Badge: Pill vs rounded</h3>
				<div class="shape-demo" style="gap: 0.75rem">
					<span class="badge-pill">Set 3/4</span>
					<span class="badge-round">Set 3/4</span>
					<span class="badge-pill badge-celebrate"><Trophy size={12} /> PR</span>
				</div>
			</div>
		</div>
	</section>

	<!-- ════════════════ ELEMENTS ════════════════ -->
	<section class="elements">
		<h2 class="section-title">Elements</h2>

		<div class="el-group">
			<h3 class="el-label">Buttons</h3>
			<div class="el-row">
				<button class="btn btn-activity"><Play size={15} /> Start Workout</button>
				<button class="btn btn-rest"><Timer size={15} /> Rest</button>
				<button class="btn btn-celebrate"><Trophy size={15} /> PR</button>
				<button class="btn btn-reflect"><ClipboardCheck size={15} /> Check In</button>
			</div>
			<div class="el-row">
				<button class="btn btn-secondary">Secondary</button>
				<button class="btn btn-ghost"><ChevronLeft size={15} /> Back</button>
				<button class="btn btn-danger"><X size={15} /> Skip</button>
				<button class="btn btn-secondary" disabled>Disabled</button>
			</div>
		</div>

		<div class="el-group">
			<h3 class="el-label">Inputs</h3>
			<div class="el-inputs">
				<div class="input-col">
					<label class="input-lbl" for="ds-weight">Weight</label>
					<input id="ds-weight" class="input-field" type="number" value="145" />
				</div>
				<div class="input-col">
					<label class="input-lbl" for="ds-reps">Reps</label>
					<input id="ds-reps" class="input-field" type="number" value="10" />
				</div>
			</div>
			<div class="input-col input-wide">
				<label class="input-lbl" for="ds-notes">Notes</label>
				<textarea id="ds-notes" class="input-area" rows="2" placeholder="Felt strong today."></textarea>
			</div>
		</div>

		<div class="el-group">
			<h3 class="el-label">Progress</h3>
			<div class="progress-set">
				<div class="prog"><div class="prog-fill prog-a" style="width:75%"></div></div>
				<div class="prog"><div class="prog-fill prog-r" style="width:45%"></div></div>
				<div class="prog"><div class="prog-fill prog-c" style="width:100%"></div></div>
				<div class="prog"><div class="prog-fill prog-v" style="width:60%"></div></div>
				<div class="prog"><div class="prog-fill prog-g" style="width:85%"></div></div>
			</div>
		</div>

		<div class="el-group">
			<h3 class="el-label">Cards</h3>
			<div class="card-row">
				<div class="card card-a">
					<div class="card-top"><Dumbbell size={16} /> Bench Press</div>
					<span class="card-big">145 lbs</span>
					<span class="card-sm">3 of 4 sets</span>
					<div class="card-track"><div class="card-track-fill" style="width:75%"></div></div>
				</div>
				<div class="card card-c">
					<div class="card-top"><Trophy size={16} /> New PR</div>
					<span class="card-big">225 lbs</span>
					<span class="card-sm">Squat &middot; +10 lbs</span>
				</div>
			</div>
		</div>
	</section>

	<!-- ════════════════ ICONS ════════════════ -->
	<section class="icon-section">
		<h2 class="section-title">Icons</h2>
		<p class="section-desc">Lucide &middot; 24px &middot; stroke 2</p>
		<div class="icon-grid">
			{#each icons as icon}
				<div class="icon-cell">
					<icon.component size={22} strokeWidth={1.75} />
					<span>{icon.label}</span>
				</div>
			{/each}
			<div class="icon-cell">
				<BarbellIcon size={22} color="currentColor" />
				<span>Barbell</span>
			</div>
		</div>
	</section>

	<!-- ════════════════ TOKENS REFERENCE ════════════════ -->
	<section class="ref">
		<h2 class="section-title">Token Reference</h2>
		<div class="ref-grid">
			<div class="ref-col">
				<h4 class="ref-heading">Spacing</h4>
				<div class="ref-list">
					{#each [
						['0.5', '2px'], ['1', '4px'], ['1.5', '6px'], ['2', '8px'],
						['3', '12px'], ['4', '16px'], ['5', '20px'], ['6', '24px'],
						['8', '32px'], ['10', '40px'], ['12', '48px'], ['16', '64px']
					] as [name, px]}
						<div class="ref-row">
							<span class="ref-name">{name}</span>
							<div class="ref-bar" style="width:{px}"></div>
						</div>
					{/each}
				</div>
			</div>
			<div class="ref-col">
				<h4 class="ref-heading">Radius</h4>
				<div class="ref-radius">
					{#each [
						['xs', '4px'], ['sm', '6px'], ['md', '8px'],
						['', '12px'], ['lg', '16px'], ['xl', '20px'], ['full', '9999px']
					] as [name, val]}
						<div class="ref-radius-item">
							<div class="ref-radius-box" style="border-radius:{val}"></div>
							<span>{name || 'default'}</span>
						</div>
					{/each}
				</div>

				<h4 class="ref-heading" style="margin-top:2rem">Shadows</h4>
				<div class="ref-shadows">
					{#each ['sm', 'md', 'lg', 'glow'] as s}
						<div class="ref-shadow-box" style="box-shadow:var(--shadow-{s})">{s}</div>
					{/each}
				</div>
			</div>
		</div>
	</section>

	<footer class="foot">
		Push &middot; Design System v1
	</footer>
</div>

<style>
	/* ═══ Foundation — Spacing Rhythm ═══
	   Section gap:       var(--space-16) = 4rem
	   Title→content:     var(--space-6)  = 1.5rem
	   Group→group:       var(--space-10) = 2.5rem
	   Intra-group:       var(--space-3)  = 0.75rem
	   Container padding: var(--space-4)  = 1rem
	*/
	.page {
		max-width: 960px;
		margin: 0 auto;
		padding: 0 var(--space-8) var(--space-16);
		color: var(--color-text);
		font-family: var(--font-body);
	}

	/* ═══ Push-Up Animation ═══ */
	@keyframes pushUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.push-up {
		animation: pushUp 0.6s var(--ease-out) both;
		animation-delay: calc(var(--d, 0) * 80ms + 100ms);
	}

	/* ═══ Progress fill animation ═══ */
	@keyframes fillIn {
		from { width: 0; }
	}

	.prog-fill {
		animation: fillIn 0.8s var(--ease-out) both;
		animation-delay: 0.3s;
	}

	.ctx-track-fill,
	.card-track-fill {
		animation: fillIn 0.6s var(--ease-out) both;
		animation-delay: 0.2s;
	}

	.section-title {
		font-family: var(--font-display);
		font-size: var(--text-xl);
		font-weight: var(--weight-bold);
		letter-spacing: -0.02em;
		margin-bottom: var(--space-1);
	}

	.section-desc {
		font-size: var(--text-sm);
		color: var(--color-text-tertiary);
		margin-bottom: var(--space-8);
		max-width: 36ch;
	}

	section {
		padding: var(--space-16) 0 0;
	}

	section + section {
		border-top: 1px solid var(--color-border-subtle);
	}

	/* ═══ Hero ═══ */
	.hero {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 50vh;
		position: relative;
		border: none;
		padding-top: 6rem;
	}

	.hero + section {
		border-top: none;
	}

	.hero-glow {
		position: absolute;
		width: 360px;
		height: 360px;
		border-radius: 50%;
		background: var(--gradient-brand-muted);
		filter: blur(100px);
		opacity: 0.5;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -55%);
		pointer-events: none;
		animation: drift 20s ease-in-out infinite alternate;
	}

	@keyframes drift {
		0% { transform: translate(-50%, -55%) scale(1); }
		100% { transform: translate(-50%, -55%) scale(1.15); }
	}

	.hero-mark {
		position: relative;
		margin-bottom: 1.5rem;
		opacity: 0.7;
	}

	.hero-word {
		font-family: var(--font-display);
		font-size: clamp(4rem, 15vw, 8rem);
		font-weight: var(--weight-extrabold);
		letter-spacing: -0.04em;
		line-height: 0.9;
		position: relative;
	}

	.hero-sub {
		font-size: var(--text-xs);
		color: var(--color-text-tertiary);
		margin-top: 1rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		position: relative;
	}

	/* ═══ Palette — Glow-from-within ═══ */
	.color-panels {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: var(--space-3);
		margin-bottom: var(--space-10);
	}

	.color-panel {
		aspect-ratio: 3/4;
		border-radius: var(--radius);
		padding: var(--space-4);
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		position: relative;
		overflow: hidden;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		transition: transform var(--duration-slow) var(--ease-out),
			box-shadow var(--duration-slow) var(--ease-out),
			border-color var(--duration-slow) var(--ease-out);
	}

	.color-panel:hover {
		transform: translateY(-3px);
	}

	.panel-label {
		font-size: var(--text-xs);
		font-weight: var(--weight-semibold);
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	.panel-sample {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-weight: var(--weight-semibold);
		font-size: var(--text-sm);
	}

	.panel-value {
		font-family: var(--font-mono);
		font-size: 0.6rem;
		color: var(--color-text-tertiary);
	}

	/* Each panel: dark bg, colored text, subtle bottom glow */
	.panel-activity { color: var(--color-activity-strong); box-shadow: 0 6px 20px -4px rgba(45, 212, 168, 0.06); }
	.panel-activity:hover { box-shadow: 0 8px 30px -2px rgba(45, 212, 168, 0.12); }

	.panel-rest { color: var(--color-rest-strong); box-shadow: 0 6px 20px -4px rgba(100, 161, 244, 0.06); }
	.panel-rest:hover { box-shadow: 0 8px 30px -2px rgba(100, 161, 244, 0.12); }

	.panel-celebrate { color: var(--color-celebrate-strong); box-shadow: 0 6px 20px -4px rgba(232, 185, 49, 0.06); }
	.panel-celebrate:hover { box-shadow: 0 8px 30px -2px rgba(232, 185, 49, 0.12); }

	.panel-reflect { color: var(--color-reflect-strong); box-shadow: 0 6px 20px -4px rgba(167, 139, 250, 0.06); }
	.panel-reflect:hover { box-shadow: 0 8px 30px -2px rgba(167, 139, 250, 0.12); }

	.panel-danger { color: var(--color-danger-strong); box-shadow: 0 6px 20px -4px rgba(242, 122, 122, 0.06); }
	.panel-danger:hover { box-shadow: 0 8px 30px -2px rgba(242, 122, 122, 0.12); }

	.gradient-strip {
		margin-bottom: var(--space-6);
	}

	.gradient-bar {
		height: 3px;
		border-radius: var(--radius-full);
		background: var(--gradient-brand);
		margin-bottom: var(--space-2);
	}

	.gradient-caption {
		font-size: var(--text-xs);
		color: var(--color-text-tertiary);
	}

	.surface-strip {
		display: flex;
		align-items: center;
		gap: var(--space-1-5);
		flex-wrap: wrap;
	}

	.surface-swatch {
		width: 36px;
		height: 36px;
		border-radius: var(--radius-sm);
		border: 1px solid var(--color-border-subtle);
	}

	.surface-label {
		font-size: var(--text-xs);
		color: var(--color-text-tertiary);
		margin-left: var(--space-2);
	}

	/* ═══ Type ═══ */
	.type-display {
		margin-bottom: 3rem;
		padding: 2.5rem 0;
		border-bottom: 1px solid var(--color-border-subtle);
	}

	.type-hero {
		font-family: var(--font-display);
		font-size: clamp(3rem, 10vw, 6rem);
		font-weight: var(--weight-extrabold);
		letter-spacing: -0.03em;
		line-height: 1;
		display: block;
	}

	.type-sub {
		font-size: var(--text-sm);
		color: var(--color-text-tertiary);
		margin-top: 0.5rem;
		display: block;
	}

	.type-scale {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 3rem;
	}

	.scale-row {
		display: flex;
		align-items: baseline;
		gap: 1.5rem;
	}

	.scale-label {
		font-family: var(--font-mono);
		font-size: 0.6rem;
		color: var(--color-text-tertiary);
		width: 2.5rem;
		text-align: right;
		flex-shrink: 0;
	}

	.scale-sample { font-weight: var(--weight-bold); line-height: 1.2; }
	.s-4xl { font-size: var(--text-4xl); }
	.s-3xl { font-size: var(--text-3xl); }
	.s-2xl { font-size: var(--text-2xl); }
	.s-xl { font-size: var(--text-xl); }
	.s-lg { font-size: var(--text-lg); }
	.s-base { font-size: var(--text-base); font-weight: var(--weight-regular); }
	.s-sm { font-size: var(--text-sm); font-weight: var(--weight-regular); color: var(--color-text-secondary); }
	.s-xs { font-size: var(--text-xs); font-weight: var(--weight-regular); color: var(--color-text-tertiary); }

	.type-mono {
		display: flex;
		align-items: baseline;
		gap: 1.5rem;
		padding: 2rem 0;
		border-top: 1px solid var(--color-border-subtle);
		border-bottom: 1px solid var(--color-border-subtle);
		margin-bottom: 2rem;
	}

	.mono-big {
		font-family: var(--font-mono);
		font-size: var(--text-3xl);
		font-weight: var(--weight-bold);
		color: var(--color-rest-strong);
	}

	.mono-label {
		font-size: var(--text-xs);
		color: var(--color-text-tertiary);
	}

	.type-weights {
		display: flex;
		gap: 1.5rem;
		flex-wrap: wrap;
	}

	.tw {
		font-size: var(--text-sm);
		color: var(--color-text-secondary);
	}

	/* ═══ Contexts ═══ */
	/* ═══ Contexts — same container language as everything else ═══ */
	.ctx-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-3);
	}

	.ctx {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		overflow: hidden;
		position: relative;
		transition: transform var(--duration-slow) var(--ease-out),
			border-color var(--duration-slow) var(--ease-out),
			box-shadow var(--duration-slow) var(--ease-out);
	}

	.ctx:hover {
		transform: translateY(-2px);
	}

	.ctx-bar {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-4) var(--space-4) var(--space-2);
		font-weight: var(--weight-semibold);
		font-size: var(--text-sm);
	}

	.ctx-pill {
		margin-left: auto;
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		padding: var(--space-0-5, 0.125rem) var(--space-2);
		border-radius: var(--radius-full);
		background: var(--color-surface-active);
	}

	.ctx-content {
		padding: var(--space-3) var(--space-4) var(--space-4);
	}

	.ctx-center {
		text-align: center;
		padding: var(--space-6) var(--space-4) var(--space-8);
	}

	/* Activity */
	.ctx-activity { box-shadow: 0 6px 20px -4px rgba(45, 212, 168, 0.05); }
	.ctx-activity .ctx-bar { color: var(--color-activity-strong); }
	.ctx-activity .ctx-pill { color: var(--color-activity-strong); }
	.ctx-activity:hover { box-shadow: 0 8px 30px -2px rgba(45, 212, 168, 0.1); }

	.ctx-set {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.set-n {
		font-weight: var(--weight-bold);
		font-size: var(--text-sm);
		color: var(--color-text-secondary);
		width: 1.25rem;
	}

	.set-target {
		font-size: var(--text-xs);
		color: var(--color-text-tertiary);
		min-width: 3.5rem;
	}

	.set-input {
		background: var(--color-bg-raised);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		padding: var(--space-1-5) var(--space-2);
		font-size: var(--text-sm);
		font-family: var(--font-body);
		font-variant-numeric: tabular-nums;
		color: var(--color-text);
		width: 3.5rem;
		text-align: center;
		outline: none;
	}

	.set-done {
		background: linear-gradient(180deg, #38ddb4, #22c99c);
		border: none;
		border-radius: var(--radius-sm);
		padding: var(--space-1-5);
		color: var(--color-text-inverse);
		cursor: pointer;
		display: flex;
		box-shadow: 0 2px 6px rgba(45, 212, 168, 0.12);
	}

	.ctx-track {
		height: 3px;
		background: var(--color-surface-active);
		border-radius: var(--radius-full);
		margin-top: var(--space-3);
		overflow: visible;
	}

	.ctx-track-fill {
		height: 100%;
		background: var(--color-activity);
		border-radius: var(--radius-full);
		box-shadow: 0 0 8px rgba(45, 212, 168, 0.15);
	}

	/* Rest */
	.ctx-rest { box-shadow: 0 6px 20px -4px rgba(100, 161, 244, 0.05); }
	.ctx-rest .ctx-bar { color: var(--color-rest-strong); }
	.ctx-rest:hover { box-shadow: 0 8px 30px -2px rgba(100, 161, 244, 0.1); }

	.ctx-clock {
		font-family: var(--font-mono);
		font-size: var(--text-3xl);
		font-weight: var(--weight-bold);
		color: var(--color-rest-strong);
		display: block;
	}

	.ctx-clock-sub {
		font-size: var(--text-xs);
		color: var(--color-text-tertiary);
		margin-top: var(--space-1);
	}

	/* Celebrate */
	.ctx-celebrate { box-shadow: 0 6px 20px -4px rgba(232, 185, 49, 0.05); }
	.ctx-celebrate .ctx-bar { color: var(--color-celebrate-strong); }
	.ctx-celebrate:hover { box-shadow: 0 8px 30px -2px rgba(232, 185, 49, 0.1); }

	.ctx-stats {
		display: flex;
		justify-content: space-around;
		padding: var(--space-2) 0;
	}

	.ctx-stat {
		text-align: center;
	}

	.stat-n {
		font-family: var(--font-display);
		font-size: var(--text-xl);
		font-weight: var(--weight-bold);
		display: block;
	}

	.stat-l {
		font-size: var(--text-2xs);
		color: var(--color-text-tertiary);
		margin-top: var(--space-0-5, 0.125rem);
	}

	.stat-pr {
		color: var(--color-celebrate-strong);
		display: inline-flex;
		align-items: center;
		gap: 0.2rem;
	}

	/* Reflect */
	.ctx-reflect { box-shadow: 0 6px 20px -4px rgba(167, 139, 250, 0.05); }
	.ctx-reflect .ctx-bar { color: var(--color-reflect-strong); }
	.ctx-reflect:hover { box-shadow: 0 8px 30px -2px rgba(167, 139, 250, 0.1); }

	.ctx-q {
		font-size: var(--text-sm);
		color: var(--color-text-secondary);
		display: block;
		margin-bottom: 0.75rem;
	}

	.ctx-opts {
		display: flex;
		gap: 0.5rem;
	}

	.ctx-opt {
		flex: 1;
		padding: 0.5rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		color: var(--color-text-secondary);
		font-family: var(--font-body);
		font-size: var(--text-sm);
		cursor: pointer;
	}

	.ctx-opt-on {
		background: var(--color-reflect-muted);
		border-color: rgba(167, 139, 250, 0.3);
		color: var(--color-reflect-strong);
	}

	/* ═══ Shape Exploration ═══ */
	.shape-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-3);
	}

	.shape-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		padding: var(--space-4);
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.shape-label {
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		color: var(--color-text-tertiary);
	}

	.shape-demo {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-2);
		min-height: 80px;
		justify-content: center;
	}

	/* Straight progress */
	.straight-prog {
		width: 100%;
		height: 4px;
		background: var(--color-surface-active);
		border-radius: var(--radius-full);
		overflow: hidden;
	}

	.straight-fill {
		height: 100%;
		background: var(--color-activity);
		border-radius: var(--radius-full);
	}

	.shape-val {
		font-family: var(--font-display);
		font-size: var(--text-sm);
		font-weight: var(--weight-bold);
		color: var(--color-text-secondary);
	}

	/* Arc gauge */
	.arc-gauge {
		width: 100px;
		height: 66px;
	}

	.arc-val {
		font-family: var(--font-display);
		font-size: var(--text-lg);
		font-weight: var(--weight-bold);
		margin-top: -0.75rem;
	}

	/* Container shape variants */
	.shape-container {
		background: var(--color-bg-raised);
		border: 1px solid var(--color-border);
		padding: var(--space-3);
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		color: var(--color-text-secondary);
		font-size: var(--text-sm);
	}

	.shape-container :global(svg) {
		color: var(--color-activity-strong);
	}

	.shape-stat {
		font-family: var(--font-display);
		font-size: var(--text-xl);
		font-weight: var(--weight-bold);
		color: var(--color-text);
	}

	.uniform-r {
		border-radius: var(--radius);
	}

	.asym-r {
		border-radius: var(--radius-lg) var(--radius-lg) var(--radius-sm) var(--radius-sm);
	}

	.pill-r {
		border-radius: var(--radius-full);
		padding: var(--space-4) var(--space-5);
	}

	/* Mark demos */
	.mark-demo {
		min-height: 72px;
	}

	/* Accent arc underline */
	.accent-stat {
		font-family: var(--font-display);
		font-size: var(--text-2xl);
		font-weight: var(--weight-extrabold);
	}

	.accent-arc {
		width: 80px;
		height: 8px;
		margin-top: -0.25rem;
	}

	/* Arc behind stat */
	.arc-stat-wrap {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.arc-bg {
		width: 100px;
		height: 50px;
		position: absolute;
		top: -8px;
	}

	.arc-stat-num {
		font-family: var(--font-display);
		font-size: var(--text-2xl);
		font-weight: var(--weight-extrabold);
		position: relative;
	}

	.arc-stat-label {
		font-size: var(--text-2xs);
		color: var(--color-text-tertiary);
		position: relative;
	}

	/* Badges */
	.badge-pill {
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		padding: var(--space-1) var(--space-3);
		border-radius: var(--radius-full);
		background: var(--color-surface-active);
		color: var(--color-text-secondary);
	}

	.badge-round {
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		padding: var(--space-1) var(--space-3);
		border-radius: var(--radius-sm);
		background: var(--color-surface-active);
		color: var(--color-text-secondary);
	}

	.badge-celebrate {
		background: var(--color-celebrate-muted);
		color: var(--color-celebrate-strong);
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
	}

	/* ═══ Elements ═══ */
	.el-group {
		margin-bottom: var(--space-10);
	}

	.el-label {
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		color: var(--color-text-tertiary);
		margin-bottom: var(--space-3);
		letter-spacing: 0.04em;
	}

	.el-row {
		display: flex;
		gap: var(--space-3);
		flex-wrap: wrap;
		margin-bottom: var(--space-3);
	}

	.btn {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2-5, 0.625rem) var(--space-4);
		border-radius: var(--radius-md);
		font-family: var(--font-body);
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
		border: none;
		cursor: pointer;
		transition: all var(--duration-normal) var(--ease-out);
		color: var(--color-text-inverse);
		position: relative;
	}

	.btn:active:not(:disabled) {
		transform: translateY(1px);
		box-shadow: none;
		transition-duration: 50ms;
	}

	.btn:disabled {
		opacity: var(--opacity-disabled);
		cursor: not-allowed;
		box-shadow: none;
	}

	/* Primary buttons: subtle gradient + colored shadow + brighter glow on hover */
	.btn-activity {
		background: linear-gradient(180deg, #38ddb4, #22c99c);
		box-shadow: 0 2px 8px rgba(45, 212, 168, 0.12);
	}
	.btn-activity:hover:not(:disabled) {
		box-shadow: 0 4px 16px rgba(45, 212, 168, 0.18);
		transform: translateY(-1px);
	}

	.btn-rest {
		background: linear-gradient(180deg, #78b0f7, #5693ee);
		box-shadow: 0 2px 8px rgba(100, 161, 244, 0.12);
	}
	.btn-rest:hover:not(:disabled) {
		box-shadow: 0 4px 16px rgba(100, 161, 244, 0.18);
		transform: translateY(-1px);
	}

	.btn-celebrate {
		background: linear-gradient(180deg, #efc540, #daa91e);
		box-shadow: 0 2px 8px rgba(232, 185, 49, 0.12);
	}
	.btn-celebrate:hover:not(:disabled) {
		box-shadow: 0 4px 16px rgba(232, 185, 49, 0.18);
		transform: translateY(-1px);
	}

	.btn-reflect {
		background: linear-gradient(180deg, #b69dfc, #9a7bf5);
		box-shadow: 0 2px 8px rgba(167, 139, 250, 0.12);
	}
	.btn-reflect:hover:not(:disabled) {
		box-shadow: 0 4px 16px rgba(167, 139, 250, 0.18);
		transform: translateY(-1px);
	}

	.btn-danger {
		background: linear-gradient(180deg, #f58e8e, #ec6868);
		box-shadow: 0 2px 8px rgba(242, 122, 122, 0.1);
	}
	.btn-danger:hover:not(:disabled) {
		box-shadow: 0 4px 16px rgba(242, 122, 122, 0.15);
		transform: translateY(-1px);
	}

	.btn-secondary {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		color: var(--color-text);
		box-shadow: none;
	}
	.btn-secondary:hover:not(:disabled) {
		background: var(--color-surface-hover);
		border-color: var(--color-border-strong);
	}

	.btn-ghost {
		background: transparent;
		color: var(--color-text-secondary);
		box-shadow: none;
	}
	.btn-ghost:hover { background: var(--color-surface); color: var(--color-text); }

	/* Inputs */
	.el-inputs {
		display: flex;
		gap: var(--space-3);
		margin-bottom: var(--space-3);
	}

	.input-col {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.input-wide {
		max-width: 320px;
	}

	.input-lbl {
		font-size: var(--text-xs);
		color: var(--color-text-tertiary);
	}

	.input-field,
	.input-area {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: 0.5rem 0.75rem;
		font-family: var(--font-body);
		font-size: var(--text-base);
		font-variant-numeric: tabular-nums;
		color: var(--color-text);
		outline: none;
		transition: border-color var(--duration-normal) var(--ease-out);
		width: 100%;
	}

	.input-field:focus,
	.input-area:focus {
		border-color: var(--color-activity);
	}

	.input-area {
		resize: vertical;
	}

	/* Progress — with subtle colored glow */
	.progress-set {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.prog {
		height: 4px;
		background: var(--color-surface-active);
		border-radius: var(--radius-full);
		overflow: visible;
		position: relative;
	}

	.prog-fill {
		height: 100%;
		border-radius: var(--radius-full);
		position: relative;
	}

	.prog-a { background: var(--color-activity); box-shadow: 0 0 8px rgba(45, 212, 168, 0.15); }
	.prog-r { background: var(--color-rest); box-shadow: 0 0 8px rgba(100, 161, 244, 0.15); }
	.prog-c { background: var(--color-celebrate); box-shadow: 0 0 8px rgba(232, 185, 49, 0.15); }
	.prog-v { background: var(--color-reflect); box-shadow: 0 0 8px rgba(167, 139, 250, 0.15); }
	.prog-g { background: var(--gradient-brand); box-shadow: 0 0 12px rgba(45, 212, 168, 0.1); }

	/* Cards — glow-from-within */
	.card-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-3);
	}

	.card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		padding: var(--space-4);
		transition: border-color var(--duration-slow) var(--ease-out),
			box-shadow var(--duration-slow) var(--ease-out);
	}

	.card-a { box-shadow: 0 6px 20px -4px rgba(45, 212, 168, 0.05); }
	.card-a:hover { box-shadow: 0 8px 30px -2px rgba(45, 212, 168, 0.1); }
	.card-c { box-shadow: 0 6px 20px -4px rgba(232, 185, 49, 0.05); }
	.card-c:hover { box-shadow: 0 8px 30px -2px rgba(232, 185, 49, 0.1); }

	.card-top {
		display: flex;
		align-items: center;
		gap: var(--space-1-5);
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
		margin-bottom: var(--space-2);
	}

	.card-a .card-top { color: var(--color-activity-strong); }
	.card-c .card-top { color: var(--color-celebrate-strong); }

	.card-big {
		font-family: var(--font-display);
		font-size: var(--text-xl);
		font-weight: var(--weight-bold);
		display: block;
	}

	.card-sm {
		font-size: var(--text-xs);
		color: var(--color-text-tertiary);
		display: block;
		margin-top: 0.15rem;
	}

	.card-track {
		height: 3px;
		background: var(--color-surface-active);
		border-radius: var(--radius-full);
		margin-top: 0.75rem;
		overflow: hidden;
	}

	.card-track-fill {
		height: 100%;
		background: var(--color-activity);
		border-radius: var(--radius-full);
	}

	/* ═══ Icons ═══ */
	.icon-grid {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1);
	}

	.icon-cell {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-1);
		padding: var(--space-3) var(--space-2);
		border-radius: var(--radius-md);
		width: 5.5rem;
		color: var(--color-text-secondary);
		transition: color var(--duration-normal) var(--ease-out), background var(--duration-normal) var(--ease-out);
	}

	.icon-cell:hover {
		color: var(--color-text);
		background: var(--color-surface);
	}

	.icon-cell span {
		font-size: 0.6rem;
		color: var(--color-text-tertiary);
		text-align: center;
	}

	/* ═══ Token Reference ═══ */
	.ref-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-12);
	}

	.ref-heading {
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		color: var(--color-text-tertiary);
		margin-bottom: var(--space-3);
		letter-spacing: 0.04em;
	}

	.ref-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-1-5);
	}

	.ref-row {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.ref-name {
		font-family: var(--font-mono);
		font-size: 0.6rem;
		color: var(--color-text-tertiary);
		width: 1.5rem;
		text-align: right;
	}

	.ref-bar {
		height: 8px;
		background: var(--color-text-tertiary);
		border-radius: 2px;
		opacity: 0.3;
		min-width: 2px;
	}

	.ref-radius {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
	}

	.ref-radius-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-1);
	}

	.ref-radius-item span {
		font-size: 0.6rem;
		color: var(--color-text-tertiary);
	}

	.ref-radius-box {
		width: 40px;
		height: 40px;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
	}

	.ref-shadows {
		display: flex;
		gap: var(--space-3);
		flex-wrap: wrap;
	}

	.ref-shadow-box {
		width: 72px;
		height: 48px;
		background: var(--color-surface);
		border-radius: var(--radius-md);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: var(--text-xs);
		color: var(--color-text-tertiary);
	}

	/* ═══ Footer ═══ */
	.foot {
		text-align: center;
		padding: var(--space-12) 0 var(--space-4);
		font-size: var(--text-xs);
		color: var(--color-text-tertiary);
		border-top: 1px solid var(--color-border-subtle);
	}
</style>
