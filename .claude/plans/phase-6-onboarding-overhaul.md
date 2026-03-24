# Phase 6: Onboarding Overhaul — Implementation Plan

## Current State

The onboarding code is **already mostly aligned** with the design spec. A previous commit updated the component with DOB + gender, reordered steps, grouped equipment, and bodyweight exclusion. The DB migration (`00003_add_demographics.sql`) and type definitions already exist.

## Remaining Work

### 1. Equipment step: inline select-all (UI only)

**File:** `src/routes/onboarding/+page.svelte`

Replace the floating `.step-header-row` + `.select-all-btn` pattern with the inline `.step-desc-row` + `.select-all-link` pattern from the preview:

- Change Step 4 markup: `h2` on its own line, then a `div.step-desc-row` containing the description `p` and the select-all link on the same line
- Replace `.step-header-row` / `.select-all-btn` styles with `.step-desc-row` / `.select-all-link` styles (right-aligned, baseline-aligned, small accent text)

### 2. Clean up preview route

**Delete:** `src/routes/preview-onboarding/+page.svelte` and its directory
**Revert:** Remove `/preview-onboarding` from `PUBLIC_ROUTES` in `src/hooks.server.ts`

### 3. Verify form action handles bodyweight correctly

**File:** `src/routes/onboarding/+page.server.ts`

Confirm the action auto-adds `'body weight'` to the equipment array before saving. (Exploration confirmed this already exists — just verify the exact string matches ExerciseDB's key.)

### 4. Verify generation prompt uses demographics

**File:** `src/lib/server/generate.ts`

Exploration confirmed the prompt already includes age/gender-aware rules (60+ intensity caps, under-18 bodyweight priority). No changes needed — just verify.

## Files Changed

| File | Change | Risk |
|---|---|---|
| `src/routes/onboarding/+page.svelte` | Inline select-all styling | Low — CSS only |
| `src/routes/preview-onboarding/+page.svelte` | Delete | None |
| `src/hooks.server.ts` | Remove preview route from PUBLIC_ROUTES | None |

## What's NOT in scope

- DB migration (already done)
- Type changes (already done)
- Generation prompt changes (already done)
- Form action changes (already correct)

## Exit Criteria

- Equipment step shows inline "Select all" link aligned with description text
- Bodyweight is not shown as a chip but is auto-included server-side
- Preview route is removed
- All 6 steps work end-to-end through the real `/onboarding` route
