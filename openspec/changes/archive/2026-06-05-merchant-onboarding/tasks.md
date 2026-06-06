# Tasks: Merchant Onboarding

## Phase 1: Logic & Validation (TDD)
- [x] 1.1 Create `src/lib/tenants/actions.ts` with a failing test for `createTenant`.
- [x] 1.2 Implement `createTenant` action with slug validation and multi-table insertion.
- [x] 1.3 Add unit tests for slug format and availability.

## Phase 2: UI Implementation
- [x] 2.1 Create `/onboarding` page with shadcn/ui form.
- [x] 2.2 Add real-time slug availability check.
- [x] 2.3 Connect form to `createTenant` action with loading states.

## Phase 3: Verification
- [x] 3.1 E2E test with Playwright: Login -> Onboarding -> Dashboard.
- [x] 3.2 Verify RLS: User A cannot see User B's new tenant.