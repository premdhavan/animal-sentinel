import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface GeoFenceZone {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  is_active: boolean;
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function useGeoLocation() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [zones, setZones] = useState<GeoFenceZone[]>([]);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Get current position
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported");
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationError(null);
      },
      (err) => setLocationError(err.message),
      { enableHighAccuracy: true, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Load geo-fence zones
  useEffect(() => {
    const loadZones = async () => {
      const { data } = await supabase.from("geo_fence_zones").select("*").eq("is_active", true);
      if (data) setZones(data as GeoFenceZone[]);
    };
    loadZones();
  }, []);

  // Check if a point is inside any active geo-fence zone
  const isInsideGeoFence = useCallback((lat: number, lng: number): boolean => {
    if (zones.length === 0) return true; // No zones = always alert
    return zones.some((zone) => {
      const dist = haversineDistance(lat, lng, zone.latitude, zone.longitude);
      return dist <= zone.radius_meters;
    });
  }, [zones]);

  // Add a new zone
  const addZone = useCallback(async (name: string, lat: number, lng: number, radius: number) => {
    const { data, error } = await supabase.from("geo_fence_zones").insert({
      name, latitude: lat, longitude: lng, radius_meters: radius,
    }).select().single();
    if (data && !error) setZones((prev) => [...prev, data as GeoFenceZone]);
    return { data, error };
  }, []);

  // Remove a zone
  const removeZone = useCallback(async (id: string) => {
    await supabase.from("geo_fence_zones").delete().eq("id", id);
    setZones((prev) => prev.filter((z) => z.id !== id));
  }, []);

  return { location, locationError, zones, isInsideGeoFence, addZone, removeZone };
}
