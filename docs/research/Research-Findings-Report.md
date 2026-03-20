# Research Findings Report: Push — Product & Technical Analysis

## Report Metadata

| Field | Value |
|-------|-------|
| **Study** | Push — Product & Technical Analysis |
| **Research Issue** | [#6](https://github.com/gears-playground/Research/issues/6) |
| **Product Issue** | [#19](https://github.com/gears-playground/Product/issues/19) |
| **Date Generated** | 2026-03-12 |
| **Experiments Completed** | 3 of 3 |
| **Research Category** | Product Research |
| **Atoms Generated** | 44 Facts, 12 Insights, 14 Recommendations |

---

## Executive Summary

This study assessed the product landscape, exercise science foundations, and technical feasibility of Push — a mobile-first PWA that delivers AI-generated personalized workout programming. Three experiments were conducted via desk research: a competitive analysis of 8 workout applications, a literature review of exercise science and fitness app engagement, and a technical feasibility analysis of LLM-based workout generation.

The research reveals that Push occupies a unique and uncontested market position. No existing workout app combines AI-adaptive programming with a structured weekly calendar view, and no major fitness app uses LLMs as their primary workout generation engine. Push would be first-to-market on both fronts. The competitive analysis identified five specific gaps Push can fill: contextual AI exercise swaps during active workouts, a dedicated "Review Day" experience, adaptive weekly plans with visual calendar, fitness-level-calibrated celebrations, and the PWA-native hybrid model.

The technical feasibility evidence is strong. Peer-reviewed research (LLM-SPTRec, PMC 2024) demonstrates that LLMs grounded in a structured knowledge base achieve 4.8/5.0 safety ratings from certified trainers, compared to 3.1/5.0 without grounding. ExerciseDB (11,000+ exercises with GIFs and structured metadata) provides the ideal knowledge base for Push, enabling both AI-grounded exercise selection and the contextual swap feature. Only 4 onboarding inputs (goals, fitness level, equipment, schedule) are needed to generate an 80% personalized first-week plan.

The exercise science literature provides clear, implementable rules: all periodization models are equally effective when volume is equated (consistency matters more than model choice), autoregulated deloads outperform fixed schedules (100% expert consensus), and injury-specific exercise exclusion lists are well-documented and must be hard-coded as safety constraints. Retention research establishes that 77% of users drop within 3 days without strong onboarding — making Week 1 the most critical design priority.

The top recommendations are: implement 4-screen progressive onboarding (<2 min to first workout), build LLM generation with ExerciseDB grounding and JSON validation, design the contextual "tap → 3 alternatives → pick" exercise swap as a core differentiator, create Review Day as a weekly engagement and AI feedback loop mechanism, and adopt gym-specific accessibility standards (44x44px tap targets, 16pt+ fonts, 4.5:1 contrast).

---

## Research Coverage

### Completed Experiments

| # | Experiment | Method | Date |
|---|-----------|--------|------|
| 1 | Competitive Analysis — Workout App UX Patterns | Non-participatory (Perplexity API, 6 sub-queries) | 2026-03-12 |
| 2 | Literature Review — Exercise Science & Fitness App Design | Non-participatory (Perplexity API, 5 sub-queries) | 2026-03-12 |
| 3 | Technical Feasibility — AI Workout Programming | Non-participatory (Perplexity API, 6 sub-queries) | 2026-03-12 |

### Not Yet Completed

No experiments are pending. All 3 planned experiments have been executed.

---

## Hypothesis Validation

| Experiment | Hypothesis | Verdict | Key Evidence |
|-----------|-----------|---------|-------------|
| 1 — Competitive Analysis | Existing apps reveal adoptable patterns and unaddressed gaps Push can fill | **Supported** | 6 adoptable patterns identified (progressive onboarding, 2-3 tap logging, calendar view, offline sync); 5 unaddressed gaps identified (AI swap, Review Day, adaptive calendar, calibrated celebrations, PWA model) |
| 2 — Literature Review | Exercise science principles are documented enough to codify into AI rules, and retention drivers are identifiable | **Supported** | All periodization models equally effective (meta-analysis, 29 studies); 100% expert consensus on autoregulated deloads; Week 1 engagement predicts 6-month retention (80% lift) |
| 3 — Technical Feasibility | Claude can generate safe, progressive workout programming with planned inputs | **Supported** | LLM-SPTRec achieves 4.8/5.0 safety with knowledge grounding; 4 inputs yield 80% personalized plan; ExerciseDB provides 11,000+ exercise knowledge base; estimated 1RM enables simple auto-progression |

---

## Key Findings

### RQ1: What is the minimum viable onboarding flow for quality AI-generated Week 1 programming?

**Four inputs in 3–4 screens achieve 80% personalization in under 2 minutes**

Competitive analysis and technical research converge: the best-performing apps (Strong, Hevy, Alpha Progression) collect goals, fitness level, equipment, and schedule in 3–4 screens, achieving first workout in <2 minutes. AI research independently confirms these same 4 inputs yield an 80% personalized first-week plan. Progressive profiling over 4 weeks improves personalization by 20–50% over static onboarding. JEFIT's 6–8 screen upfront collection is a documented anti-pattern with high abandonment. [[ISSUE-6-I001]], [[ISSUE-6-F001]], [[ISSUE-6-F002]], [[ISSUE-6-F034]]

### RQ2: How should Push handle quick-complete logging versus detailed performance tracking?

**2–3 tap quick-complete with auto-previous values is the validated pattern, but no app has solved dual-path logging**

Strong and Hevy set the benchmark: 2–3 taps per set with auto-filled previous values, large thumb-friendly targets, rest timers, and current-exercise-focused screens. However, no app fully balances quick-complete with seamless detailed logging (per-set RPE, notes) without mode-switching. This remains an open design challenge. Watch integration (Strong, Hevy, Fitbod) reduces phone dependency and should be considered for future enhancement. [[ISSUE-6-F004]], [[ISSUE-6-F005]], [[ISSUE-6-F014]]

### RQ3: What UI patterns work best for exercise swaps when equipment isn't available?

**No app has solved contextual AI swaps — this is Push's clearest differentiation opportunity**

Current apps offer either fully automated substitution (Fitbod — no user control) or fully manual library browsing (Strong, Hevy, JEFIT — high friction). The middle ground — "tap exercise → see 3 AI-suggested contextual alternatives → pick one" — doesn't exist in any competitor. ExerciseDB's query-by-muscle-group and query-by-equipment endpoints provide the technical foundation to build this feature. This is Push's clearest product differentiation opportunity: it's competitively unique, technically feasible today, and addresses a real user need. [[ISSUE-6-I003]], [[ISSUE-6-F006]], [[ISSUE-6-F042]]

### RQ4: How should the weekly review day summary be structured?

**Review Day has no competitive precedent and addresses multiple validated retention drivers simultaneously**

No existing app offers a dedicated end-of-week Review Day experience. Push can design Review Day to serve dual purposes: (1) user engagement — streak completion, fitness-level-calibrated celebrations, weekly stats, and next-week preview, and (2) AI architecture — the moment when the system processes the week's performance data and generates next week's plan. Streak mechanics alone drove +28% DAU for Strava. Fitness-level-calibrated celebrations (consistency for beginners, PRs for advanced) would be novel — no competitor differentiates progress feedback by user level. [[ISSUE-6-I009]], [[ISSUE-6-F009]], [[ISSUE-6-F010]], [[ISSUE-6-F025]]

### RQ5: Can Claude generate quality, safe workout programming across fitness levels and special populations?

**Yes — with knowledge grounding and validation, LLM generation achieves 4.8/5.0 safety**

The LLM-SPTRec study (PMC, 2024) provides the strongest evidence: LLMs grounded in a Sports Science Knowledge Graph achieve 4.8/5.0 safety ratings from certified trainers, vs. 3.1/5.0 without grounding — a 55% improvement. No major fitness app currently uses LLMs as their primary engine, making Push a first-mover. The architecture must treat the LLM as a reasoning engine (not a data source), ground exercise selection in ExerciseDB, and validate outputs against safety rules.

For special populations: ACSM guidelines provide clear programming rules for seniors (150 min/week moderate aerobic, 2 days/week resistance), and injury-specific exercise exclusion lists are well-documented (shoulder → no overhead, back → no loaded flexion, knee → limited ROM). These must be hard-coded as LLM constraints, not soft suggestions, because LLM hallucination risks include prescribing dangerous exercises for injured users. [[ISSUE-6-I005]], [[ISSUE-6-I011]], [[ISSUE-6-F033]], [[ISSUE-6-F043]]

---

## Cross-Cutting Themes

### Theme 1: The Convergence Principle — Independent Evidence Streams Reach the Same Conclusions

Multiple findings demonstrate that independent lines of research reach identical conclusions. Progressive onboarding is validated by both competitive benchmarks AND AI research. Autoregulated deloads are supported by both exercise science consensus AND technical implementation analysis (estimated 1RM tracking). ExerciseDB is justified by both competitive gaps (exercise swap) AND technical requirements (PWA offline, structured API). This convergence increases confidence in the recommendations.

### Theme 2: Push Occupies an Uncontested Market Position

Five features that no competitor offers: (1) AI-adaptive weekly plans with visual calendar, (2) contextual AI exercise swaps mid-workout, (3) dedicated Review Day experience, (4) fitness-level-calibrated celebrations, (5) PWA-based workout app. Each of these is independently supported by evidence as valuable — together, they define Push's unique value proposition.

### Theme 3: Safety Is the Make-or-Break Technical Challenge

LLM hallucination is the primary technical risk. Ungrounded LLMs score 3.1/5.0 on safety — unacceptable for exercise prescription where wrong outputs can cause injury. The mitigation path is clear (knowledge grounding + validation), but it must be treated as a core architecture requirement, not a nice-to-have. Injury exclusion lists, rep range validation, and recovery requirement checks are not features — they're safety guardrails that determine whether Push is viable as a product.

### Theme 4: Retention Is Won or Lost in 72 Hours

The retention data is stark: 77% of users who don't engage within 3 days are gone. Users who engage daily in Week 1 are 80% more likely to be retained at 6 months. This means every design decision about onboarding, first workout, and Week 1 engagement has outsized impact on the product's success. The first workout is simultaneously the most important engagement moment, the most important data collection moment, and the most important retention driver.

---

## Recommendations

1. **Implement 4-screen progressive onboarding** — Collect goals, fitness level, equipment, and schedule. Deliver first workout in <2 minutes. Defer injuries and body stats to Week 1 progressive profiling.
   - *Evidence:* [[ISSUE-6-I001]], [[ISSUE-6-I002]]
   - *Priority:* High

2. **Use ExerciseDB as canonical catalog; build contextual swap** — 11,000+ exercises with GIFs. Build "tap → 3 alternatives → pick" interaction querying by muscle group and equipment. Investigate self-hosting from GitHub.
   - *Evidence:* [[ISSUE-6-I003]], [[ISSUE-6-I006]]
   - *Priority:* High

3. **Build LLM generation with ExerciseDB grounding + JSON validation** — LLM reasons about programming; selects exercises from ExerciseDB; outputs JSON; validation layer checks safety rules (rep ranges, injury exclusions, recovery).
   - *Evidence:* [[ISSUE-6-I005]], [[ISSUE-6-I006]]
   - *Priority:* High

4. **Implement autoregulated deload detection** — Track estimated 1RM (Epley formula) per exercise. Trigger deload when 1RM stalls 2+ weeks. Include subjective wellness check-ins. Never use fixed-schedule deloads.
   - *Evidence:* [[ISSUE-6-I004]], [[ISSUE-6-I010]]
   - *Priority:* High

5. **Design Week 1 for retention** — First workout in <2 min, intentionally achievable, doubles as data collection. Daily touchpoints Days 2–7 to establish engagement habit. Progressive profiling prompts appear naturally.
   - *Evidence:* [[ISSUE-6-I002]], [[ISSUE-6-I001]]
   - *Priority:* High

6. **Create Review Day** — Weekly experience combining progress celebration (calibrated to fitness level), stats summary, and next-week plan preview. Serves as both engagement ritual and AI feedback loop trigger.
   - *Evidence:* [[ISSUE-6-I009]], [[ISSUE-6-I012]]
   - *Priority:* High

7. **Build injury/condition exercise exclusion** — Hard constraints in LLM prompt + post-generation validation. Keyed to reported injuries: shoulder→no overhead, back→no loaded flexion, knee→limited ROM. Seniors default to moderate intensity caps.
   - *Evidence:* [[ISSUE-6-I011]], [[ISSUE-6-I005]]
   - *Priority:* High

8. **Implement calendar-based weekly plan** — Visual calendar with AI-generated content, explicit rest days, manual rescheduling. Combines Alpha Progression's structure with Fitbod's AI intelligence.
   - *Evidence:* [[ISSUE-6-I012]], [[ISSUE-6-I010]]
   - *Priority:* High

9. **Design PWA offline-first architecture** — Service worker cached ExerciseDB data/GIFs, IndexedDB workout logs, background sync on reconnection. Pre-cache current week's plan for zero-connectivity gym use.
   - *Evidence:* [[ISSUE-6-I007]], [[ISSUE-6-I006]]
   - *Priority:* High

10. **Prioritize social features + streaks post-MVP** — Streak mechanics (+28% DAU), flexible weekly goals (+20% 90-day retention), social sharing of Review Day summaries (+30% retention). Low engineering cost, high retention impact.
    - *Evidence:* [[ISSUE-6-I008]], [[ISSUE-6-I009]]
    - *Priority:* Medium

11. **Investigate Capacitor/TWA for HealthKit** — Plan native wrapper for Apple HealthKit access as future enhancement. Google Fit REST API covers Android from web. Not an MVP blocker.
    - *Evidence:* [[ISSUE-6-I007]]
    - *Priority:* Medium

12. **Calibrate celebrations by fitness level** — Beginners: consistency milestones. Intermediates: volume trends. Advanced: PR data and trend analysis. Integrated into Review Day.
    - *Evidence:* [[ISSUE-6-I009]], [[ISSUE-6-I002]]
    - *Priority:* Medium

13. **Default to linear periodization for beginners, undulating for intermediate+** — All models are equally effective when volume is equated. Track cumulative volume as the unifying metric. Don't over-engineer periodization selection.
    - *Evidence:* [[ISSUE-6-I010]], [[ISSUE-6-I004]]
    - *Priority:* Medium

14. **Adopt gym-specific accessibility standards** — 44x44px tap targets, 16pt+ fonts (20pt+ for seniors), WCAG 4.5:1 contrast, bottom-screen navigation, voice commands. Test under gym lighting.
    - *Evidence:* [[ISSUE-6-I007]]
    - *Priority:* High

---

## Gaps & Next Steps

All 3 planned non-participatory experiments have been completed. No experiments remain unexecuted. However, the Research Plan's synthesis deliverables note that findings should be cross-referenced and reviewed with the Product Manager.

### Recommended Follow-Up Research

- **Usability testing** — The Research Brief suggests recruiting 8–12 participants across fitness levels for mobile usability sessions testing logging flows in simulated gym environments. This participatory research would validate the desk research findings with real users.
- **LLM prompt prototyping** — The technical feasibility analysis recommends prompt engineering with representative user profiles. Building and testing actual prompt templates with Claude Opus 4.6 would validate the LLM-SPTRec-inspired architecture.
- **ExerciseDB self-hosting feasibility** — Licensing terms for the GitHub self-hosted ExerciseDB API need verification before committing to this cost management strategy.
- **PWA gym testing** — Testing offline PWA performance in actual gym environments (basement gyms with zero connectivity) would validate the offline-first architecture recommendations.

---

## Research Atoms Index

### Facts

- [[ISSUE-6-F001]] — 6 of 8 apps use progressive profiling
- [[ISSUE-6-F002]] — Best onboarding achieves first workout <2 min with 3–4 screens
- [[ISSUE-6-F003]] — JEFIT 6–8 screen upfront flow is anti-pattern
- [[ISSUE-6-F004]] — Strong/Hevy excel with 2–3 tap quick-complete
- [[ISSUE-6-F005]] — No app balances quick-complete with seamless detailed logging
- [[ISSUE-6-F006]] — No app offers contextual AI exercise swap mid-workout
- [[ISSUE-6-F007]] — Alpha Progression is only app with calendar + auto-progression
- [[ISSUE-6-F008]] — No app combines AI-adaptive plans with visual calendar
- [[ISSUE-6-F009]] — No app offers dedicated Review Day experience
- [[ISSUE-6-F010]] — No app calibrates celebrations to fitness level
- [[ISSUE-6-F011]] — No popular workout app is built as a PWA
- [[ISSUE-6-F012]] — Strong/Hevy/JEFIT offer full offline logging with sync
- [[ISSUE-6-F013]] — Fitbod session-only generation criticized for lacking structure
- [[ISSUE-6-F014]] — Watch integration reduces phone dependency in gym
- [[ISSUE-6-F015]] — All periodization models equally effective (29-study meta-analysis)
- [[ISSUE-6-F016]] — Consistency matters more than periodization model
- [[ISSUE-6-F017]] — 100% expert consensus on individualized deloads
- [[ISSUE-6-F018]] — 40–60% volume reduction preferred deload strategy
- [[ISSUE-6-F019]] — Full training cessation NOT recommended
- [[ISSUE-6-F020]] — 77% of users drop within 3 days without engagement
- [[ISSUE-6-F021]] — Daily Week 1 engagement → 80% higher 6-month retention
- [[ISSUE-6-F022]] — Social features provide +30% retention lift
- [[ISSUE-6-F023]] — AI personalization provides +50% retention lift
- [[ISSUE-6-F024]] — Flexible goals increase 90-day retention by 20%
- [[ISSUE-6-F025]] — Streak mechanics drove +28% DAU for Strava
- [[ISSUE-6-F026]] — Average Day 30 retention 8–12%; top apps 25–47.5%
- [[ISSUE-6-F027]] — ACSM: 150 min/week + 2 days/week resistance for seniors
- [[ISSUE-6-F028]] — Multicomponent programs reduce fall injuries 32–40%
- [[ISSUE-6-F029]] — Injury-specific exercise exclusions required
- [[ISSUE-6-F030]] — WCAG minimum 24x24px; iOS HIG recommends 44x44px
- [[ISSUE-6-F031]] — 16pt+ fonts, 4.5:1 contrast for gym readability
- [[ISSUE-6-F032]] — No major app uses LLMs for workout generation
- [[ISSUE-6-F033]] — LLM-SPTRec: 4.8/5.0 safety with grounding vs 3.1/5.0 without
- [[ISSUE-6-F034]] — 4 onboarding inputs yield 80% personalized plan
- [[ISSUE-6-F035]] — Progressive profiling improves personalization 20–50%
- [[ISSUE-6-F036]] — Estimated 1RM (Epley) is validated, no-ML progression metric
- [[ISSUE-6-F037]] — ExerciseDB: 11,000+ exercises with GIFs and metadata
- [[ISSUE-6-F038]] — wger: only ~100 exercises, insufficient standalone
- [[ISSUE-6-F039]] — ExerciseDB GIFs cacheable for PWA; YouTube requires connectivity
- [[ISSUE-6-F040]] — YouTube API limits to ~100 searches/day
- [[ISSUE-6-F041]] — PWA cannot access Apple HealthKit
- [[ISSUE-6-F042]] — ExerciseDB endpoints support programmatic exercise swap
- [[ISSUE-6-F043]] — LLM hallucination risks in fitness
- [[ISSUE-6-F044]] — Consumer sentiment prefers human-led; AI as co-pilot

### Insights

- [[ISSUE-6-I001]] — Progressive onboarding validated by competitive analysis AND AI research
- [[ISSUE-6-I002]] — Week 1 is make-or-break retention window
- [[ISSUE-6-I003]] — Contextual AI swap is Push's clearest differentiation
- [[ISSUE-6-I004]] — Autoregulated recovery is superior and implementable
- [[ISSUE-6-I005]] — LLM generation feasible with database grounding
- [[ISSUE-6-I006]] — ExerciseDB is optimal over YouTube for Push
- [[ISSUE-6-I007]] — PWA viable but has HealthKit limitation
- [[ISSUE-6-I008]] — Social features provide higher practical ROI than solo AI
- [[ISSUE-6-I009]] — Review Day has no precedent and addresses retention drivers
- [[ISSUE-6-I010]] — Periodization model matters less than volume + consistency
- [[ISSUE-6-I011]] — Special population safety requires hard-coded exclusion
- [[ISSUE-6-I012]] — Calendar + AI adaptation is uncontested market position

### Recommendations

- [[ISSUE-6-R001]] — 4-screen progressive onboarding (High)
- [[ISSUE-6-R002]] — ExerciseDB catalog + contextual swap (High)
- [[ISSUE-6-R003]] — LLM generation with grounding + validation (High)
- [[ISSUE-6-R004]] — Autoregulated deload detection (High)
- [[ISSUE-6-R005]] — Week 1 retention design (High)
- [[ISSUE-6-R006]] — Review Day experience (High)
- [[ISSUE-6-R007]] — Injury exercise exclusion system (High)
- [[ISSUE-6-R008]] — Calendar-based weekly plan (High)
- [[ISSUE-6-R009]] — PWA offline-first architecture (High)
- [[ISSUE-6-R010]] — Social features + streaks post-MVP (Medium)
- [[ISSUE-6-R011]] — Capacitor/TWA for HealthKit (Medium)
- [[ISSUE-6-R012]] — Fitness-level-calibrated celebrations (Medium)
- [[ISSUE-6-R013]] — Linear/undulating periodization defaults (Medium)
- [[ISSUE-6-R014]] — Gym-specific accessibility standards (High)

---

## Cost Summary

| Experiment | API Calls | Estimated Cost |
|-----------|-----------|---------------|
| 1 — Competitive Analysis | 9 (6 + 3 retries) | $0.45 |
| 2 — Literature Review | 5 | $0.25 |
| 3 — Technical Feasibility | 6 | $0.30 |
| **Total** | **20** | **$1.00** |

---

## Sources

### Experiment 1: Competitive Analysis — Workout App UX Patterns
1. https://www.nudgenow.com/blogs/app-onboarding-design-inspiration
2. https://www.trainerize.com/blog/the-ultimate-guide-to-onboarding-new-fitness-clients/
3. https://clevertap.com/blog/app-onboarding/
4. https://dev.to/paywallpro/fitness-app-onboarding-guide-data-motivation-completion-an0
5. https://sendbird.com/blog/mobile-app-onboarding
6. https://apphud.com/blog/best-performing-mobile-app-onboarding-examples
7. https://thisisglance.com/learning-centre/whats-the-difference-between-progressive-onboarding-and-traditional-onboarding
8. https://setgraph.app/ai-blog/best-app-to-log-workouts
9. https://www.hevyapp.com/best-workout-tracker-app/
10. https://www.jefit.com/wp/general-fitness/10-best-workout-tracker-apps-in-2026-complete-comparison-guide/
11. https://setgraph.app/ai-blog/best-free-app-for-tracking-workouts
12. https://strongermobileapp.com/blog/best-workout-tracker-apps
13. https://strive-workout.com/2026/03/03/top-workout-apps/
14. https://fitnessdrum.com/best-weightlifting-apps/
15. https://www.compareworkoutapps.com/blog/fitbod-vs-alpha-progression/
16. https://alphaprogression.com/en/blog/best-muscle-building-app
17. https://www.jefit.com/wp/guide/best-workout-apps-for-2026-top-options-tested-and-reviewed-by-pro/
18. https://strive-workout.com/2026/03/05/best-apps-for-tracking-exercise-goals-2/
19. https://www.garagegymreviews.com/best-workout-apps
20. https://www.simpleworkoutlog.com
21. https://www.strong.app
22. https://www.hevyapp.com
23. https://www.garagegymreviews.com/best-free-workout-apps

### Experiment 2: Literature Review — Exercise Science & Fitness App Design
1. https://sportscienceinsider.com/linear-vs-block-vs-undulating-periodization/
2. https://www.scienceforsport.com/block-vs-undulating-periodisation-how-does-this-impact-on-performance/
3. https://blog.nasm.org/periodization-training-simplified
4. https://www.frontiersin.org/journals/public-health/articles/10.3389/fpubh.2026.1707627/full
5. https://www.setforset.com/blogs/news/periodization-training-models
6. https://pmc.ncbi.nlm.nih.gov/articles/PMC10511399/
7. https://pmc.ncbi.nlm.nih.gov/articles/PMC10809978/
8. https://health.clevelandclinic.org/deload-week
9. https://www.jefit.com/wp/exercise-tips/when-to-deload-in-strength-training-science-backed-guide/
10. https://pmc.ncbi.nlm.nih.gov/articles/PMC9811819/
11. https://ru.scribd.com/document/447075381/AHA-ACSM-Physical-Activity-Guidelines-for-Older-Adults-Chron
12. https://www.bewegenismedicijn.nl/files/downloads/acsm_position_stand_exercise_and_physical_activity_for_older_adults.pdf
13. https://acsm.org/physical-activity-function-older-age/
14. https://www.aafp.org/pubs/afp/issues/2017/0401/p425.html
15. https://www.exerciseismedicine.org/assets/page_documents/EIM%20Rx%20series_Exercising%20with%20Frailty_2.pdf
16. https://www.lucid.now/blog/retention-metrics-for-fitness-apps-industry-insights/
17. https://skywork.ai/skypage/en/Cracking%20the%20Code
18. https://create.fit/blogs/fitness-trends-statistics/
19. https://www.codebridge.tech/articles/fitness-mobile-app-development-strategies
20. https://www.emarketer.com/content/health-fitness-app-usage-2026
21. https://userway.org/blog/adaptive-fitness/
22. https://funxtion.com/press-blog/how-to-make-gyms-inclusive-and-accessible/
23. https://fyclabs.com/landing-pages/accessibility-fitness-apps/
24. https://blog.usablenet.com/web-accessibility-for-the-fitness-industry-guest-post

### Experiment 3: Technical Feasibility — AI Workout Programming
1. https://www.finegym.io/resources/blogs/evolution-gym-software-2026
2. https://www.goldsgym.com/blog/2026-fitness-trends/
3. https://www.protocloudtechnologies.com/how-to-develop-ai-fitness-app-like-fitbod-2026-complete-guide/
4. https://theninehertz.com/blog/ai-fitness-app-development
5. https://insider.fitt.co/press-release/fitness-fans-shunning-ai-2026-global-fitness-report/
6. https://arxiv.org/abs/2509.05375
7. https://pmc.ncbi.nlm.nih.gov/articles/PMC12916763/
8. https://www.latentview.com/blog/a-guide-to-prompt-engineering-in-large-language-models/
9. https://developer.nvidia.com/blog/an-introduction-to-large-language-models-prompt-engineering-and-p-tuning/
10. https://loadmuscle.com/blog/ai-workout-planner-guide
11. https://rewisoft.com/blog/ai-workout-generator/
12. https://www.gymscore.ai/blog/free-ai-workout-plan-generator
13. https://www.strongrfastr.com/ai_workout_builder_generator
14. https://www.fitnessai.com/blog/overthinking-your-workout
15. https://www.hevyapp.com/progressive-overload/
16. https://forum.intervals.icu/t/ai-training-systems/28855
17. https://setgraph.app/ai-blog/progressive-overload-workout-guide
18. https://developer.android.com/health-and-fitness/health-connect/comparison-guide
19. https://zylalabs.com/blog/3-apis-fitness-apps-can-use
20. https://getstream.io/blog/fitness-api/
21. https://www.mirrorfly.com/blog/fitness-api/
22. https://spikeapi.com/spike-api-outshines-healthkit-and-health-connect
23. https://ymove.app/workout-api
24. https://ymove.app/exercise-api
25. https://edb-docs.up.railway.app
26. https://elest.io/open-source/wger
27. https://wger.readthedocs.io/_/downloads/en/latest/pdf/
28. https://wger.de
29. https://github.com/ExerciseDB/exercisedb-api

---

## Cross-References

- **Research Brief:** [Research-Brief.md](Research-Brief.md)
- **Research Plan:** [Research-Plan.md](Research-Plan.md)
- **Product Issue:** [#19](https://github.com/gears-playground/Product/issues/19)
- **Research Issue:** [#6](https://github.com/gears-playground/Research/issues/6)
- **Experiment Reports:**
  - [Experiment 1](experiment-1/report.md)
  - [Experiment 2](experiment-2/report.md)
  - [Experiment 3](experiment-3/report.md)
