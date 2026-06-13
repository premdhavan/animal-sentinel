
-- Drop old public policies
DROP POLICY IF EXISTS "Allow public read on detection_history" ON public.detection_history;
DROP POLICY IF EXISTS "Allow public insert on detection_history" ON public.detection_history;
DROP POLICY IF EXISTS "Allow public read on geo_fence_zones" ON public.geo_fence_zones;
DROP POLICY IF EXISTS "Allow public insert on geo_fence_zones" ON public.geo_fence_zones;
DROP POLICY IF EXISTS "Allow public update on geo_fence_zones" ON public.geo_fence_zones;
DROP POLICY IF EXISTS "Allow public delete on geo_fence_zones" ON public.geo_fence_zones;

-- Add user_id columns if missing
ALTER TABLE public.detection_history ADD COLUMN IF NOT EXISTS user_id UUID NOT NULL DEFAULT auth.uid();
ALTER TABLE public.geo_fence_zones ADD COLUMN IF NOT EXISTS user_id UUID NOT NULL DEFAULT auth.uid();

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.detection_history TO authenticated;
GRANT ALL ON public.detection_history TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.geo_fence_zones TO authenticated;
GRANT ALL ON public.geo_fence_zones TO service_role;

-- Owner-scoped policies
DROP POLICY IF EXISTS "Users read own detections" ON public.detection_history;
DROP POLICY IF EXISTS "Users insert own detections" ON public.detection_history;
CREATE POLICY "Users read own detections" ON public.detection_history
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own detections" ON public.detection_history
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own zones" ON public.geo_fence_zones;
DROP POLICY IF EXISTS "Users insert own zones" ON public.geo_fence_zones;
DROP POLICY IF EXISTS "Users update own zones" ON public.geo_fence_zones;
DROP POLICY IF EXISTS "Users delete own zones" ON public.geo_fence_zones;
CREATE POLICY "Users read own zones" ON public.geo_fence_zones
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own zones" ON public.geo_fence_zones
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own zones" ON public.geo_fence_zones
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own zones" ON public.geo_fence_zones
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
