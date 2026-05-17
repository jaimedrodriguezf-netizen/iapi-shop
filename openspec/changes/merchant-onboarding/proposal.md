# Proposal: Merchant Onboarding

## Intent
Allow authenticated users to create and configure their first "Shop" (Tenant). This establishes the owner relationship and initial subscription.

## Scope
### In Scope
- Shop creation form (Name, Slug, WhatsApp).
- Slug availability validation.
- Automatic `owner` role assignment to the creator.
- Initial "Free" plan subscription assignment.
- Success redirection to the new Shop Dashboard.

### Out of Scope
- Custom domain configuration.
- Advanced theme customization (Logo/Colors).
- Payment processing for paid plans.

## Approach
1. Create a Server Action `createTenant` to handle logic transactionally.
2. Implement a multi-step or single-form onboarding UI in `/onboarding`.
3. Use RLS to ensure only authenticated users can insert into `tenants`.
4. Add client-side and server-side validation for shop slugs.

## Risks
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Slug collision | Low | Database unique constraint + real-time validation. |
| Role assignment failure | Low | Wrap tenant creation and member insertion in a DB function or transaction. |

## Success Criteria
- [ ] User can submit the shop creation form.
- [ ] New record exists in `tenants` and `tenant_members` (as owner).
- [ ] New record exists in `tenant_subscriptions` (free plan).
- [ ] User is redirected to `/dashboard/[slug]`.
