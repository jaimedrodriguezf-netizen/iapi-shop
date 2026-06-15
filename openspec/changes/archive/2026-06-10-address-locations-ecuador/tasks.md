Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: High

# Tasks: Address Locations Ecuador

This document contains the step-by-step task breakdown for the `address-locations-ecuador` change, organized into five sequential execution phases.

---

## Phase 1: Database Migration & Seeding
- [x] 1.1 Create Tables & Constraints at `supabase/migrations/20260609220924_address_locations_ecuador.sql`
- [x] 1.2 Configure Row Level Security (RLS) Select Policies at `supabase/migrations/20260609220924_address_locations_ecuador.sql`
- [x] 1.3 Seed Geographic Data at `supabase/migrations/20260609220924_address_locations_ecuador.sql` using `/home/jaimepop/.gemini/antigravity-cli/brain/e2c32ee5-b511-43de-8664-31dcbb9e8c9e/.system_generated/steps/280/content.md`
- [x] 1.4 Write Schema Structure & Data Seed Test at `supabase/migrations/20260609220924_address_locations_ecuador.test.ts`

## Phase 2: Server Actions & Page Wiring
- [x] 2.1 Implement Geographic Server Actions in `src/lib/tenants/actions.ts`
- [x] 2.2 Dashboard settings Page Data Integration in `src/app/dashboard/settings/page.tsx`

## Phase 3: Dashboard settings-form UI & Live Preview
- [x] 3.1 Adapt Form Props and Initialization in `src/components/dashboard/settings-form.tsx`
- [x] 3.2 Dynamic Select Inputs Rendering in `src/components/dashboard/settings-form.tsx`
- [x] 3.3 State Cleanup & Cascading Reset in `src/components/dashboard/settings-form.tsx`
- [x] 3.4 Live Storefront Preview Synchronization in `src/components/dashboard/settings-form.tsx`

## Phase 4: Storefront Layout & Component Theme Styling
- [x] 4.1 Address Layout Formatting in Storefront Footer in `src/app/[slug]/page.tsx`

## Phase 5: Verification & Tests
- [x] 5.1 Update UI Component Spec Tests in `src/components/dashboard/settings-form.test.tsx`
- [x] 5.2 Execute test suites and verify builds
