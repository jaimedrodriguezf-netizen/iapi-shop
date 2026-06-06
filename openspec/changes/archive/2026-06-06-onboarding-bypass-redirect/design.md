# Technical Design: Onboarding Bypass Redirect

This document details the design and implementation strategy for the `onboarding-bypass-redirect` change. The goal is to auto-provision a default draft tenant for new merchants loading the dashboard, replacing the mandatory `/onboarding` redirect, while preventing default/unconfigured stores from being published publicly.

---

## 1. Tenant Auto-Provisioning Action

We will introduce `ensureUserTenant()` in `src/lib/tenants/actions.ts`. This server action checks if the user has an existing tenant and, if not, auto-provisions a default tenant in "draft" status.

### Implementation details in `src/lib/tenants/actions.ts`

- **Name**: `ensureUserTenant`
- **Logic**:
  1. Retrieve the authenticated user via `supabase.auth.getUser()`. If not authorized, return success: false.
  2. Query `tenants` where `created_by = user.id` (limit 1).
  3. If a tenant exists, return it immediately.
  4. If no tenant exists:
     - Generate a 5-character random alphanumeric string (using characters `a-z0-9`).
     - Set the slug to `tienda-[5-char-random]`.
     - Insert a new tenant row with `name: "Mi Tienda"`, `slug: slug`, and `status: "draft"`.
     - Insert a member row in `tenant_members` with `role: "owner"` and `status: "active"`.
     - Retrieve the ID of the `free` plan from the `plans` table.
     - Insert a subscription row in `tenant_subscriptions` with `plan_id: plan.id` and `status: "active"`.
     - Return the newly created tenant data.

```typescript
export async function ensureUserTenant(): Promise<ActionResult<Tenant>> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "No autorizado" };
    }

    // Check if user already has a tenant
    const { data: existingTenant, error: selectError } = await supabase
      .from("tenants")
      .select("*")
      .eq("created_by", user.id)
      .limit(1)
      .maybeSingle();

    if (existingTenant) {
      return { success: true, data: existingTenant as unknown as Tenant };
    }

    // Generate unique slug
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let randomStr = "";
    for (let i = 0; i < 5; i++) {
      randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const slug = `tienda-${randomStr}`;

    // Create tenant in draft status
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .insert({
        name: "Mi Tienda",
        slug: slug,
        created_by: user.id,
        status: "draft",
      })
      .select()
      .single();

    if (tenantError) {
      return { success: false, error: `Error al crear sucursal por defecto: ${tenantError.message}` };
    }

    // Assign owner member
    const { error: memberError } = await supabase
      .from("tenant_members")
      .insert({
        tenant_id: tenant.id,
        user_id: user.id,
        role: "owner",
        status: "active",
      });

    if (memberError) {
      return { success: false, error: `Error al asignar rol de dueño: ${memberError.message}` };
    }

    // Retrieve free plan
    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select("id")
      .eq("code", "free")
      .single();

    if (planError || !plan) {
      return { success: false, error: "No se pudo encontrar el plan gratuito inicial." };
    }

    // Create free subscription
    const { error: subError } = await supabase.from("tenant_subscriptions").insert({
      tenant_id: tenant.id,
      plan_id: plan.id,
      status: "active",
    });

    if (subError) {
      return { success: false, error: `Error al activar la suscripción gratuita: ${subError.message}` };
    }

    return { success: true, data: tenant as unknown as Tenant };
  } catch (error) {
    console.error("ensureUserTenant error:", error);
    return { success: false, error: "Error inesperado al asegurar sucursal" };
  }
}
```

---

## 2. Replacing Dashboard Redirect Logic

Currently, all dashboard pages check `getMyTenant()` and redirect to `/onboarding` if none exists. We will replace this redirect flow with calls to `ensureUserTenant()`.

### File Updates

1. **`src/app/dashboard/page.tsx`**:
   - Call `ensureUserTenant()` if `platformRole !== "admin"`.
   - Update the mapping for `sucursales` using the ensured tenant.
   ```typescript
   let tenants: Tenant[] = [];
   if (platformRole !== "admin") {
     const ensureResult = await ensureUserTenant();
     if (ensureResult.success && ensureResult.data) {
       tenants = [ensureResult.data];
     }
   } else {
     const tenantsResult = await getMyTenants();
     tenants = tenantsResult.success && tenantsResult.data ? tenantsResult.data : [];
   }
   ```
2. **`src/app/dashboard/products/page.tsx`**:
   - Replace `getMyTenant()` with `ensureUserTenant()`.
3. **`src/app/dashboard/orders/page.tsx`**:
   - Replace `getMyTenant()` with `ensureUserTenant()`.
4. **`src/app/dashboard/qr/page.tsx`**:
   - Replace `getMyTenant()` with `ensureUserTenant()`.
5. **`src/app/dashboard/settings/page.tsx`**:
   - Replace `getMyTenant()` with `ensureUserTenant()`.

---

## 3. Server-side Settings Updates & Validation

The `updateTenantSettings` server action must be updated to allow changing `name`, `slug`, and `status`, while enforcing publishing rules.

### Action Updates in `src/lib/tenants/actions.ts`

- Add `name`, `slug`, and `status` to `UpdateTenantSettingsInput`.
- Fetch the existing tenant data first to ensure ownership and read default values.
- Validate the new slug (if changed) for uniqueness among other tenants:
  ```typescript
  if (input.slug && input.slug !== currentTenant.slug) {
    // regex format check
    // uniqueness check excluding current tenant ID
  }
  ```
- Validate publishing conditions if the final status will be `active`:
  - `name` MUST NOT be `"Mi Tienda"`.
  - `slug` MUST NOT start with `"tienda-"`.
- Perform the database update, revalidate paths `/dashboard/settings`, the old slug, and the new slug.

---

## 4. Settings Form Modifications

We will enhance the settings form (`src/components/dashboard/settings-form.tsx`) to allow customizing the name and slug, and to display a toggle to publish/unpublish the store.

### UI and Form State Updates

- Update `brandingSchema` to include:
  - `name`: string validation (min 2 chars).
  - `slug`: regex format validation.
  - `status`: enum `["active", "draft"]`.
- Add a new "General Settings" card section at the top of the form with fields for Store Name and Slug.
- Add a switch toggle "Publicar Tienda" linked to the `status` form field.
- Watch Name and Slug in real time. If `name === "Mi Tienda" || slug.startsWith("tienda-")`:
  - Disable/block the "Publicar Tienda" switch.
  - Render an error alert/warning warning: *"Para publicar tu tienda, primero debes cambiar el nombre por defecto 'Mi Tienda' y configurar un slug personalizado que no empiece con 'tienda-'."*
  - Automatically force/reset status to `draft` if it was active.

```typescript
const watchName = form.watch("name")
const watchSlug = form.watch("slug")
const cannotPublish = watchName === "Mi Tienda" || watchSlug.startsWith("tienda-")

React.useEffect(() => {
  if (cannotPublish && form.getValues("status") === "active") {
    form.setValue("status", "draft");
  }
}, [cannotPublish, form]);
```

---

## 5. Public Storefront Restrictions (Draft State)

We must prevent public visitors from viewing the catalog of a tenant whose status is `draft`, showing a nice placeholder page instead.

### Action Update in `src/lib/storefront/actions.ts`

Currently, `getStorefrontData()` returns an error if `status !== "active"`. We must modify this check to fetch the tenant even if it is in `draft` status:
```typescript
// Remove: tenant.status !== "active"
if (tenantError || !tenant) {
  return { success: false, error: "Sucursal no encontrada" };
}
```

### Storefront Page Updates in `src/app/[slug]/page.tsx`

If `tenant.status === "draft"`, we will render a clean Tailwind-styled landing card explaining that the store is under construction:

```tsx
if (tenant.status === "draft") {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-xl border border-zinc-100 dark:border-zinc-800 text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-amber-50 dark:bg-amber-950/30 rounded-2xl flex items-center justify-center text-amber-500">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A1.79 1.79 0 1114.7 18.5l-5.83-5.83m.92-2.11L18.08 4.66a1.39 1.39 0 00-1.39-1.39H12.9a1.39 1.39 0 00-1 .4l-5.63 5.63a1.39 1.39 0 00-.4 1v3.79c0 .37.15.72.4 1L12.9 20.7a1.39 1.39 0 001.96 0l2.5-2.5" />
          </svg>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black tracking-tight">{tenant.name}</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            Tienda en construcción: Esta tienda está en modo borrador y no es pública aún.
          </p>
        </div>
        <div className="pt-2">
          <div className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-black tracking-widest">
            Potenciado por IAPI Shop
          </div>
        </div>
      </div>
    </main>
  );
}
```
Otherwise, if status is active, render the normal storefront catalog.
