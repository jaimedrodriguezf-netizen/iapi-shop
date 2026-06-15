# Proposal: Canva Color Palette and Customization (Database-Driven)

## Intent
Provide merchants with a Canva-style predefined color palette selection interface as well as independent custom color pickers for both primary and secondary brand colors. Additionally, unlock these color customization options for Free plan merchants, removing prior locks and ensuring both colors render dynamically on their public storefront catalogs. 

To ensure clean separation of concerns and allow for future manageability, the Canva-style color palettes will be stored dynamically in the database (in a dedicated `public.color_palettes` table) rather than hardcoded on the client-side.

## Scope
### In Scope
- **Database Schema**: Create a `public.color_palettes` table via a timestamped migration, containing `id`, `name`, `brand_color` (primary), and `secondary_color`, with public read-only RLS policies.
- **Seeding**: Seed the database table with the default palettes (Pastel, Warm, Neon, Tech, Nordic).
- **Migration Tests**: Write a unit test `20260609000000_color_palettes.test.ts` asserting the migration file contents.
- **Server Action**: Implement a server action `getColorPalettes` in `src/lib/tenants/actions.ts` to query the palettes.
- **Settings Page Integration**: Fetch the palettes from the database in `/src/app/dashboard/settings/page.tsx` and pass them down to the `SettingsForm` component.
- **Settings Form UI**: Integrate the Canva palette selection UI into the brand settings card of the merchant dashboard (`settings-form.tsx`) using the dynamically fetched palettes.
- **Custom Color Pickers**: Provide independent custom color pickers for both `brand_color` (primary) and `secondary_color` when selecting the custom option.
- **Free Plan Customization**: Unlock color customization for Free plan tenants by removing plan-based disables/locks in the form fields and layout page.
- **Storefront Theme Engine**: Update the storefront page (`src/app/[slug]/page.tsx`) to render customized brand and secondary colors even for Free plan tenants.
- **CSS Variable Injection**: Inject `--brand-color` and `--secondary-color` into the CSS properties of the storefront layout container.
- **Storefront Component Integration**: Integrate `--secondary-color` usage in the public storefront components:
  - **Cart drawer**: Floating items count badge and text highlights.
  - **Category pills**: Hover text and border states for non-active pills.
  - **Badges**: Background color for product badges (e.g., the `⭐ Top` badge).
  - **Hover effects**: Border/text hover transitions on product card names and cards.
- **Unit Tests**: Update unit tests in `settings-form.test.tsx` and storefront page tests to support unlocked colors.

### Out of Scope
- An administrative panel to manage or edit these color palettes in-app (they will be managed via migrations/seeding, and accessed read-only by the application).
- Modifying non-color-related settings or other plan restrictions.

## Capabilities
### New Capabilities
- **Database-Backed Predefined Palettes**: Color presets are managed in the database, enabling dynamic fetching and easy future updates.
- **Predefined Palettes Selection**: Merchants can choose from a list of predefined Canva-style color combos fetched from the database with one click.
- **Custom Secondary Accent**: Merchants can select any custom hex color for their secondary accent independently.
- **Free Plan Customization**: Free plan merchants can fully customize both primary and secondary brand colors instead of being locked to the default IAPI violet (`#7c3aed`).

### Modified Capabilities
- **Storefront Theme Engine**: Storefronts dynamically apply both `--brand-color` and `--secondary-color` for all tenants regardless of plan name.
- **Dynamic Accent Rendering**: Storefront components render accent details (badge background, pill hover states, cart drawer details) based on the tenant's chosen secondary color.

## Approach
1. **Database Migration**:
   - Create migration file `supabase/migrations/20260609000000_color_palettes.sql`:
     ```sql
     CREATE TABLE IF NOT EXISTS public.color_palettes (
       id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
       name text NOT NULL UNIQUE,
       brand_color text NOT NULL,
       secondary_color text NOT NULL,
       created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
     );
     ALTER TABLE public.color_palettes ENABLE ROW LEVEL SECURITY;
     CREATE POLICY "Permitir lectura pública de paletas" ON public.color_palettes
       FOR SELECT TO public USING (true);
     ```
   - Seed the default palettes:
     - Pastel: Primary `#fbcfe8` (pink), Secondary `#bae6fd` (blue)
     - Warm: Primary `#f97316` (orange), Secondary `#facc15` (yellow)
     - Neon: Primary `#06b6d4` (cyan), Secondary `#f43f5e` (rose)
     - Tech: Primary `#0f172a` (slate), Secondary `#3b82f6` (blue)
     - Nordic: Primary `#1e293b` (charcoal), Secondary `#64748b` (slate gray)
   - Create migration test `supabase/migrations/20260609000000_color_palettes.test.ts`.

2. **Server Actions (`src/lib/tenants/actions.ts`)**:
   - Implement `getColorPalettes` to query all rows from the `color_palettes` table sorted by `name` or `created_at`.

3. **Dashboard Page Integration (`src/app/dashboard/settings/page.tsx`)**:
   - Call `getColorPalettes()` alongside existing settings fetches.
   - Pass the retrieved list of color palettes to the `SettingsForm` component.

4. **Dashboard Form UI Updates (`src/components/dashboard/settings-form.tsx`)**:
   - Render the fetched palettes as selectable options in the brand settings card.
   - When a palette is clicked, set the form values for both `brand_color` and `secondary_color`.
   - Render custom color pickers for both `brand_color` and `secondary_color` when selecting the custom option.
   - Remove the `useEffect` resetting colors for Free plan tenants.
   - Remove disabled states on the color inputs/buttons for Free plan tenants, and remove the lock banner.

5. **Storefront Layout Updates (`src/app/[slug]/page.tsx`)**:
   - Read `brandColor` and `secondaryColor` directly from `tenant.brand_color` and `tenant.secondary_color` (falling back to default violet if not specified) for all plans.
   - Bind `--brand-color` and `--secondary-color` variables to the main container wrapper style.

6. **Storefront Components Update**:
   - Update `src/components/storefront/cart-drawer.tsx` to reference `--secondary-color` on the items count badge and text highlights.
   - Update `src/components/storefront/storefront-catalog.tsx` to apply `--secondary-color` on category pills hover, the `⭐ Top` product badge background, and card name/border hover transitions.

7. **Testing updates**:
   - Update `src/components/dashboard/settings-form.test.tsx` to pass mock color palettes and assert that color fields are NOT disabled on Free plan.

## Affected Areas
| Area | Impact | Description |
|------|--------|-------------|
| Database / Supabase | Low | New `public.color_palettes` table and RLS select policy created and seeded. |
| Server Actions | Low | New `getColorPalettes` action added to query the database. |
| Dashboard Settings Page | Low | Fetches color palettes server-side and passes them to the form. |
| Dashboard Settings Form | Medium | Renders database-fetched palettes, allows custom secondary color, removes Free plan restrictions. |
| Storefront Layout | Low | `--secondary-color` CSS custom property injected in page.tsx. |
| Storefront Catalog | Medium | Updated category pills hover states, badge backgrounds (`⭐ Top`), and product hover states to reference `--secondary-color`. |
| Storefront Cart Drawer | Low | Floating badge and title elements updated to reference `--secondary-color`. |
| Test suite | Low | Unit tests in `settings-form.test.tsx` and `page.test.tsx` updated to assert new color customizations and mock database fetch. |

## Risks
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Bad contrast ratios with custom primary/secondary colors | Low | Keep the contrast warning logic active for low contrast brand colors. |
| Test failures due to changed assertions | Low | Carefully update `settings-form.test.tsx` assertions to match the unlocked color behavior and mock database response. |

## Rollback Plan
Revert the git commits modifying settings and storefront files, and drop the `public.color_palettes` table via rollback migration script.

## Dependencies
- Database migration execution (`20260609000000_color_palettes.sql` must run successfully).

## Success Criteria
- [ ] Database table `color_palettes` created and seeded with default palettes.
- [ ] Server action retrieves database palettes successfully.
- [ ] Merchants can select predefined Canva palettes from DB or customize both colors.
- [ ] Free plan users are not locked/forced to '#7c3aed'.
- [ ] Storefront dynamically applies both colors for all tenants.
- [ ] Tests compile and pass.
