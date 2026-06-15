# Proposal: Address Locations Ecuador

## Intent
Provide a structured, error-free address location selector (Country -> Province -> Canton) in the merchant dashboard settings specifically optimized for Ecuador, replacing the plain text inputs with dynamic dropdown selects, while maintaining text input fallbacks for other countries.

## Scope
### In Scope
- **Database Schema**: Supabase migration to create tables `public.countries`, `public.provinces`, and `public.cantons` with UUID identifiers and appropriate foreign key relationships and unique constraints.
- **Security**: Public read-only Row Level Security (RLS) policies for the new geographic lookup tables.
- **Seeding**: Populating `public.countries` with Ecuador (EC), Colombia (CO), and Peru (PE), and seeding Ecuador's provinces and cantons using the geographical reference data.
- **Server Actions**: Implement read-only server actions in `src/lib/tenants/actions.ts` to fetch countries, provinces by country ID, and cantons by province ID.
- **Dashboard UI**: Update the settings form `src/components/dashboard/settings-form.tsx` to:
  - Turn the Country field into a `<Select>` dropdown.
  - If Country is Ecuador, render Province and City (Canton) as dynamic Select components that cascade load from the database.
  - If Country is any other value, fallback to plain text inputs for state/province and city.
- **Storefront UI**: Update `src/app/[slug]/page.tsx` footer to format the address string as `[Street], [Canton], [Province], [Country]`.
- **Testing**: Write a migration unit test `supabase/migrations/20260609220924_address_locations_ecuador.test.ts` to verify the schema layout, RLS policies, and seed records.

### Out of Scope
- Administrative panel/UI to manage countries, provinces, or cantons data.
- Seeding provinces and cantons/cities for countries other than Ecuador (e.g., Colombia and Peru).
- Automatic geocoding or external address validation API integrations.

## Capabilities
### New Capabilities
- Hierarchical location query actions (`getCountries`, `getProvincesByCountryId`, `getCantonsByProvinceId`).
- Automated loading and filtering of state/province and city/canton dropdown options based on selected country in the dashboard.
- RLS guarded public read access to geographical tables.

### Modified Capabilities
- Physical address fields in tenant settings are validated and formatted cleanly when Ecuador is selected.
- Storefront footer prints the address using the standardized `[Street], [Canton], [Province], [Country]` pattern.

## Approach
1. **Migration & Seed Generation**: Write `supabase/migrations/20260609220924_address_locations_ecuador.sql` to define the tables, RLS policies, and insert Ecuador geographical seeds derived from the reference JSON source.
2. **Schema Test**: Create a Vitest test script `supabase/migrations/20260609220924_address_locations_ecuador.test.ts` to verify tables and constraints definition statically.
3. **Server-Side Queries**: Expose lookup functions using Supabase client server-side in `src/lib/tenants/actions.ts`.
4. **Interactive Dashboard UI**:
   - Integrate React state into `settings-form.tsx` to track selected country, province, and canton.
   - Fetch metadata options inside `useEffect` or React hooks.
   - Swap the input components conditionally when `country === "Ecuador"` or the country's UUID is selected.
5. **Formatted Storefront Display**: Modify the helper address formatting functions in the storefront route to reconstruct the layout address neatly.

## Affected Areas
| Area | Impact | Description |
|------|--------|-------------|
| Database | Medium | Addition of three lookup tables and public RLS policies. |
| Server Actions | Low | Exposing `getCountries`, `getProvinces`, and `getCantons` queries in actions.ts. |
| Dashboard Settings | Medium | Replacing text inputs with conditional selects in the branding and settings page form. |
| Storefront Layout | Low | Displaying address in the footer of `src/app/[slug]/page.tsx` with formatted fields. |

## Risks
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Data mapping mismatch for existing text-based fields | Medium | The UI fields must gracefully parse pre-existing text data (e.g., matching string "Ecuador" or code "EC" to select the option). Fall back safely if text doesn't map perfectly. |
| Database transaction or migration sizing | Low | Ecuador geographic dataset is lightweight (24 provinces, ~224 cantons) and fits easily in a standard SQL seed migration script. |

## Rollback Plan
1. Delete the files added in this phase (`supabase/migrations/20260609220924_address_locations_ecuador.sql` and corresponding test).
2. Restore modified files (`src/lib/tenants/actions.ts`, `src/components/dashboard/settings-form.tsx`, `src/app/[slug]/page.tsx`) to their previous commit state.
3. Run migrations down or drop tables `public.cantons`, `public.provinces`, and `public.countries`.

## Dependencies
- Ecuador geographical reference JSON: `/home/jaimepop/.gemini/antigravity-cli/brain/e2c32ee5-b511-43de-8664-31dcbb9e8c9e/.system_generated/steps/280/content.md`

## Success Criteria
- [ ] Database migration successfully deploys tables `countries`, `provinces`, and `cantons` with RLS.
- [ ] Ecuador, Colombia, Peru, and Ecuador sub-regions are seeded into the database.
- [ ] Schema structure test passes successfully.
- [ ] Server actions fetch list of countries, provinces for Ecuador, and cantons for a province without errors.
- [ ] Settings form dynamically displays dropdowns for Ecuador and textboxes for other countries.
- [ ] Form submits the selected street, canton, province, and country and renders them in the storefront footer correctly formatted.
