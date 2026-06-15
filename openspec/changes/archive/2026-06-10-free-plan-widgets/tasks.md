# Tasks: Free Plan Dashboard Widgets

## Phase 1: Create Widgets Component
- [x] Create `src/components/dashboard/free-plan-widgets.tsx` with `UsageLimitsWidget`, `OnboardingChecklistWidget`, and `PremiumBenefitsWidget`.

## Phase 2: Page Integration
- [x] Modify `src/app/dashboard/page.tsx` to fetch the tenant count and product limit details, and conditionally render the new widgets for Free plan users.

## Phase 3: Update Tests
- [x] Modify `src/app/dashboard/performance.test.tsx` to assert the rendering of these new widgets on the Free plan.

## Phase 4: Quality & Validation
- [x] Run typescript compiler check: `npx tsc --noEmit`.
- [x] Run linter: `npm run lint`.
- [x] Run tests: `npm test`.
- [x] Run build check: `npm run build`.
