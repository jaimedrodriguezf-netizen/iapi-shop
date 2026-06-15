# Proposal: Free Plan Widgets in Dashboard

## Intent
Improve the onboarding experience and conversion rate of merchants on the Free plan by displaying usage limits, an onboarding setup checklist, and premium benefits directly on their dashboard. This encourages users to complete setup steps and provides clear CTAs to upgrade to a paid plan.

## Scope
### In Scope
- Create `src/components/dashboard/free-plan-widgets.tsx` implementing three widgets: `UsageLimitsWidget`, `OnboardingChecklistWidget`, and `PremiumBenefitsWidget`.
- Integrate the widgets into `src/app/dashboard/page.tsx` by fetching tenant limit details and plan status to conditionally render the widgets for Free plan users.
- Update tests in `src/app/dashboard/performance.test.tsx` to assert that these widgets render correctly under the Free plan, while hiding the monthly chart and branch summary table (which remain visible for Premium plans).

### Out of Scope
- Backend modifications to subscription structure or plan features.
- Creating checkout/payment flows (links point to existing pricing/upgrade locations).

## Capabilities
### New Capabilities
- **Onboarding Checklist Widget**: Displays setup progress (store name customized, URL customized, WhatsApp phone configured, at least one product added) with a completion percentage and progress bar.
- **Usage Limits Widget**: Displays limits for active products and branch counts with progress bars and warning notifications with an upsell CTA when product limits are reached.
- **Premium Benefits Widget**: Showcases the benefits of upgrading to Plan Plus/Premium with an upgrade CTA button.

### Modified Capabilities
- **Merchant Dashboard Page**: Conditionally displays either the new Free Plan widgets (checklist, limits, benefits) or the Premium components (monthly sales chart, branches table) based on the user's active plan.

## Approach
- Created `src/components/dashboard/free-plan-widgets.tsx` to encapsulate UI/UX for checklist progress, product/shop limit tracking, and plus benefits.
- Modified `src/app/dashboard/page.tsx` to run queries via Server Actions (`getMyTenants()`, `checkProductLimit()`, `getTenantSubscription()`) to determine plan status and setup progress, and dynamically switch the view layout.
- Modified `src/app/dashboard/performance.test.tsx` to mock Free and Premium plan configurations and verify conditional rendering rules.

## Affected Areas
| Area | Impact | Description |
|------|--------|-------------|
| Dashboard Page | High | Modified `page.tsx` to conditionally render widgets or charts based on plan. |
| Dashboard Widgets | High | Added new component `free-plan-widgets.tsx` containing the three widgets. |
| Dashboard Tests | Medium | Updated `performance.test.tsx` to verify Free and Premium conditional layouts. |

## Risks
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Render performance degradation on Free plan | Low | Keep component logic simple and utilize existing server action caching where possible. Tested with performance benchmarks. |
| API boundary failures | Low | Server Action mocks are updated, and test suites are executed via vitest. |

## Rollback Plan
- Revert changes to `src/app/dashboard/page.tsx` and `src/app/dashboard/performance.test.tsx`, and delete `src/components/dashboard/free-plan-widgets.tsx`.

## Dependencies
- Existing subscription queries (`getTenantSubscription`) and product limit validation (`checkProductLimit`) Server Actions.

## Success Criteria
- [ ] Free Plan users view the onboarding checklist, usage limits, and premium benefits on the dashboard page.
- [ ] Premium Plan users view the sales charts and branch summaries instead of the Free Plan widgets.
- [ ] All unit and performance tests in `performance.test.tsx` pass successfully.
