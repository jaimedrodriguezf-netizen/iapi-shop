# Proposal: Foundation Secure Multitenant

## Intent

Create the safe project foundation for a multitenant ecommerce platform where anonymous users only see a public landing and all product/store data is protected by authentication, roles, tenant membership, and Supabase RLS.

## Scope

### In Scope
- Next.js 16 project scaffold with TypeScript, Tailwind, Vitest, Playwright, Supabase, OpenAI, Upstash, and QR dependencies.
- Public landing page without product database access.
- Tenant role permission model for owner/admin/sales/inventory/viewer.
- SDD/TDD project configuration.

### Out of Scope
- Real Supabase schema migrations.
- PayPal payment flow.
- Hostinger upload integration.
- AI image generation workflow.

## Approach

Use App Router conventions, pure tested authorization helpers first, and later wire Supabase Auth/RLS around the same permission model.

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Product DB exposed publicly | Medium | No anon SELECT policies; protected routes for product pages. |
| Role logic drifts between app and RLS | Medium | Keep permission matrix small and mirror in RLS tests. |
| AI usage cost abuse | Medium | Enforce role, quota, and rate limits before provider calls. |

## Rollback Plan

Revert scaffold and dependency commits; no production data migrations are introduced in this change.

## Success Criteria

- [ ] `npm test` passes.
- [ ] Public landing contains no product marketplace UI.
- [ ] Permission matrix tests cover each tenant role.
- [ ] Next.js dependency versions meet the known May 2026 security baseline.
