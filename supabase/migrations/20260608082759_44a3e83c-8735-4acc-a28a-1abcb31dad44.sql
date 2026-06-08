
-- Add user_id ownership columns
ALTER TABLE public.detection_history ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.geo_fence_zones ADD COLUMN IF NOT EXISTS user_id uuid;

-- Backfill existing rows to a system uuid so they remain readable to no one (orphaned)
UPDATE public.detection_history SET user_id = '00000000-0000-0000-0000-000000000000' WHERE user_id IS NULL;
UPDATE public.geo_fence_zones SET user_id = '00000000-0000-0000-0000-000000000000' WHERE user_id IS NULL;

ALTER TABLE public.detection_history ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.geo_fence_zones ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.detection_history ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.geo_fence_zones ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Drop old permissive policies
DROP POLICY IF EXISTS "Allow public read on detection_history" ON public.detection_history;
DROP POLICY IF EXISTS "Allow public insert on detection_history" ON public.detection_history;
DROP POLICY IF EXISTS "Allow public read on geo_fence_zones" ON public.geo_fence_zones;
DROP POLICY IF EXISTS "Allow public insert on geo_fence_zones" ON public.geo_fence_zones;
DROP POLICY IF EXISTS "Allow public update on geo_fence_zones" ON public.geo_fence_zones;
DROP POLICY IF EXISTS "Allow public delete on geo_fence_zones" ON public.geo_fence_zones;

-- Revoke anon access
REVOKE ALL ON public.detection_history FROM anon;
REVOKE ALL ON public.geo_fence_zones FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.detection_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.geo_fence_zones TO authenticated;

-- User-scoped policies
CREATE POLICY "Users read own detections" ON public.detection_history
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own detections" ON public.detection_history
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read own zones" ON public.geo_fence_zones
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own zones" ON public.geo_fence_zones
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own zones" ON public.geo_fence_zones
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own zones" ON public.geo_fence_zones
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
