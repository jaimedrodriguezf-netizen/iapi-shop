-- Function to safely accept legal terms for the current user
CREATE OR REPLACE FUNCTION public.accept_legal_terms(p_legal_version text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.tenant_members
  SET 
    legal_accepted_version = p_legal_version,
    legal_accepted_at = now()
  WHERE user_id = auth.uid();
END;
$$;

-- Ensure anyone authenticated can call it
GRANT EXECUTE ON FUNCTION public.accept_legal_terms(text) TO authenticated;
