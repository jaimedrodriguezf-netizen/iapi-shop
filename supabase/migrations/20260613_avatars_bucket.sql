-- Avatars storage bucket for user profile photos
-- Public bucket: anyone can view avatars, only authenticated users can upload

-- Create the avatars bucket (public so URLs are accessible without signed URLs)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Anyone can view avatars (public user photos on storefronts, profiles, etc.)
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Authenticated users can upload their own avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');