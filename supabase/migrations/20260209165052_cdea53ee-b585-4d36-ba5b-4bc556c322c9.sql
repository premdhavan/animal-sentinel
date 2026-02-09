
-- Detection history table
CREATE TABLE public.detection_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  animal TEXT NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
  confidence INTEGER NOT NULL DEFAULT 0,
  estimated_distance TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  night_mode BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Geo-fence zones table
CREATE TABLE public.geo_fence_zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  radius_meters DOUBLE PRECISION NOT NULL DEFAULT 500,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.detection_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geo_fence_zones ENABLE ROW LEVEL SECURITY;

-- Public read/write policies (no auth required for this surveillance system)
CREATE POLICY "Allow public read on detection_history" ON public.detection_history FOR SELECT USING (true);
CREATE POLICY "Allow public insert on detection_history" ON public.detection_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read on geo_fence_zones" ON public.geo_fence_zones FOR SELECT USING (true);
CREATE POLICY "Allow public insert on geo_fence_zones" ON public.geo_fence_zones FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on geo_fence_zones" ON public.geo_fence_zones FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on geo_fence_zones" ON public.geo_fence_zones FOR DELETE USING (true);

-- Index for analytics queries
CREATE INDEX idx_detection_history_created_at ON public.detection_history (created_at DESC);
CREATE INDEX idx_detection_history_animal ON public.detection_history (animal);
CREATE INDEX idx_detection_history_risk_level ON public.detection_history (risk_level);
