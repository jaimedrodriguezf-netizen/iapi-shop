export const tenantRoles = ["owner", "admin", "sales", "inventory", "viewer"] as const;

export type TenantRole = (typeof tenantRoles)[number];

export const tenantPermissions = [
  "tenant.settings.update",
  "billing.manage",
  "members.manage",
  "products.read",
  "products.create",
  "products.update",
  "products.delete",
  "inventory.read",
  "inventory.update",
  "orders.read",
  "orders.update",
  "customers.read",
  "media.upload",
  "ai.text.generate",
  "ai.images.generate",
  "analytics.read",
] as const;

export type TenantPermission = (typeof tenantPermissions)[number];

const rolePermissions: Record<TenantRole, ReadonlySet<TenantPermission>> = {
  owner: new Set(tenantPermissions),
  admin: new Set([
    "tenant.settings.update",
    "members.manage",
    "products.read",
    "products.create",
    "products.update",
    "products.delete",
    "inventory.read",
    "inventory.update",
    "orders.read",
    "orders.update",
    "customers.read",
    "media.upload",
    "ai.text.generate",
    "ai.images.generate",
    "analytics.read",
  ]),
  sales: new Set(["products.read", "orders.read", "orders.update", "customers.read", "analytics.read"]),
  inventory: new Set([
    "products.read",
    "products.create",
    "products.update",
    "inventory.read",
    "inventory.update",
    "media.upload",
    "ai.text.generate",
    "ai.images.generate",
  ]),
  viewer: new Set(["products.read", "inventory.read", "orders.read", "customers.read", "analytics.read"]),
};

const protectedRoutePrefixes = ["/marketplace", "/tienda", "/producto", "/dashboard", "/admin"] as const;

export function can(role: TenantRole, permission: TenantPermission): boolean {
  return rolePermissions[role].has(permission);
}

export function isTenantRole(value: string): value is TenantRole {
  return tenantRoles.includes(value as TenantRole);
}

export function isProtectedAppRoute(pathname: string): boolean {
  return protectedRoutePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
