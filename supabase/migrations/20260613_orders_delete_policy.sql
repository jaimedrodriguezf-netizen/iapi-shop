-- Migration: Add DELETE policy for orders

-- Allow tenant owners and admins to delete orders
CREATE POLICY "orders_delete_owner_admin" ON public.orders
  FOR DELETE TO authenticated
  USING (public.has_tenant_role(tenant_id, array['owner','admin']::public.tenant_role[]));