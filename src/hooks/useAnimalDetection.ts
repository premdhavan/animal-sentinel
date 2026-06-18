import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type RiskLevel = "high" | "medium" | "low" | "none";

export interface DetectionResult {
  detected: boolean;
  animal: string | null;
  riskLevel: RiskLevel;
  confidence: number;
  estimatedDistance: string | null;
}

export interface DetectionLog {
  id: string;
  animal: string;
  riskLevel: "high" | "medium" | "low";
  confidence: number;
  estimatedDistance: string | null;
  timestamp: Date;
}

export function useAnimalDetection() {
  const [currentDetection, setCurrentDetection] = useState<DetectionResult>({
    detected: false, animal: null, riskLevel: "none", confidence: 0, estimatedDistance: null,
  });
  const [logs, setLogs] = useState<DetectionLog[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const lastDetectionRef = useRef<string | null>(null);

  const analyze = useCallback(async (
    imageBase64: string,
    nightMode: boolean,
    location: { lat: number; lng: number } | null,
    geoFenceCheck: (lat: number, lng: number) => boolean
  ): Promise<DetectionResult> => {
    setIsAnalyzing(true);
    try {
      const { data: result, error } = await supabase.functions.invoke<DetectionResult>(
        "detect-animal",
        { body: { imageBase64, nightMode } }
      );

      if (error || !result) {
        console.error("Detection error:", error);
        return { detected: false, animal: null, riskLevel: "none", confidence: 0, estimatedDistance: null };
      }
      setCurrentDetection(result);

      // Geo-fence check: if location available and zones exist, only alert inside zones
      const insideGeoFence = !location || geoFenceCheck(location.lat, location.lng);

      if (result.detected && result.animal && result.riskLevel !== "none") {
        const key = result.animal.toLowerCase();
        if (lastDetectionRef.current !== key) {
          lastDetectionRef.current = key;
          const logEntry: DetectionLog = {
            id: crypto.randomUUID(),
            animal: result.animal,
            riskLevel: result.riskLevel as "high" | "medium" | "low",
            confidence: result.confidence,
            estimatedDistance: result.estimatedDistance,
            timestamp: new Date(),
          };
          setLogs((prev) => [logEntry, ...prev.slice(0, 49)]);

          // Persist to database
          await supabase.from("detection_history").insert({
            animal: result.animal,
            risk_level: result.riskLevel,
            confidence: result.confidence,
            estimated_distance: result.estimatedDistance,
            latitude: location?.lat ?? null,
            longitude: location?.lng ?? null,
            night_mode: nightMode,
          });
        }

        // If outside geo-fence, suppress alerts
        if (!insideGeoFence) {
          return { ...result, riskLevel: "none" };
        }
      } else {
        lastDetectionRef.current = null;
      }

      return insideGeoFence ? result : { ...result, riskLevel: "none" };
    } catch (e) {
      console.error("Analysis failed:", e);
      return { detected: false, animal: null, riskLevel: "none", confidence: 0, estimatedDistance: null };
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const clearLogs = useCallback(() => setLogs([]), []);

  return { currentDetection, logs, isAnalyzing, analyze, clearLogs };
}
