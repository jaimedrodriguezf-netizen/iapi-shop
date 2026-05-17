# Tasks: Merchant Onboarding

## Phase 1: Logic & Validation (TDD)
- [ ] 1.1 Create `src/lib/tenants/actions.ts` with a failing test for `createTenant`.
- [ ] 1.2 Implement `createTenant` action with slug validation and multi-table insertion.
- [ ] 1.3 Add unit tests for slug format and availability.

## Phase 2: UI Implementation
- [ ] 2.1 Create `/onboarding` page with shadcn/ui form.
- [ ] 2.2 Add real-time slug availability check.
- [ ] 2.3 Connect form to `createTenant` action with loading states.

## Phase 3: Verification
- [ ] 3.1 E2E test with Playwright: Login -> Onboarding -> Dashboard.
- [ ] 3.2 Verify RLS: User A cannot see User B's new tenant.
