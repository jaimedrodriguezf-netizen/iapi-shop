-- Allow users to update their own legal consent columns in tenant_members
-- Policy: Allow authenticated users to update their own rows
CREATE POLICY "tenant_members_update_own_legal" ON public.tenant_members
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Trigger to prevent updating any fields other than legal consent columns
CREATE OR REPLACE FUNCTION public.check_tenant_member_self_update()
RETURNS trigger AS $$
BEGIN
  -- If the update is done by the user themselves (matching auth.uid())
  -- and they are not a platform admin, restrict changes.
  IF (auth.uid() = NEW.user_id) AND NOT public.is_platform_admin() THEN
    IF OLD.role IS DISTINCT FROM NEW.role OR
       OLD.tenant_id IS DISTINCT FROM NEW.tenant_id OR
       OLD.user_id IS DISTINCT FROM NEW.user_id OR
       OLD.status IS DISTINCT FROM NEW.status OR
       OLD.invited_by IS DISTINCT FROM NEW.invited_by OR
       OLD.created_at IS DISTINCT FROM NEW.created_at OR
       OLD.id IS DISTINCT FROM NEW.id THEN
      RAISE EXCEPTION 'Solo está permitido actualizar la versión y fecha de aceptación de términos legales.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS tr_check_tenant_member_self_update ON public.tenant_members;

-- Create trigger
CREATE TRIGGER tr_check_tenant_member_self_update
  BEFORE UPDATE ON public.tenant_members
  FOR EACH ROW EXECUTE FUNCTION public.check_tenant_member_self_update();
