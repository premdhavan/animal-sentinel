import { useState, useRef, useCallback } from "react";

export interface DetectionResult {
  detected: boolean;
  animal: string | null;
  category: "harmful" | "safe" | "none";
  confidence: number;
}

export interface DetectionLog {
  id: string;
  animal: string;
  category: "harmful" | "safe";
  confidence: number;
  timestamp: Date;
}

export function useAnimalDetection() {
  const [currentDetection, setCurrentDetection] = useState<DetectionResult>({
    detected: false, animal: null, category: "none", confidence: 0,
  });
  const [logs, setLogs] = useState<DetectionLog[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const lastDetectionRef = useRef<string | null>(null);

  const analyze = useCallback(async (imageBase64: string): Promise<DetectionResult> => {
    setIsAnalyzing(true);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/detect-animal`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ imageBase64 }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json();
        console.error("Detection error:", err);
        return { detected: false, animal: null, category: "none", confidence: 0 };
      }

      const result: DetectionResult = await resp.json();
      setCurrentDetection(result);

      // Log new detections (avoid duplicates of same animal in sequence)
      if (result.detected && result.animal && result.category !== "none") {
        const key = result.animal.toLowerCase();
        if (lastDetectionRef.current !== key) {
          lastDetectionRef.current = key;
          setLogs((prev) => [
            {
              id: crypto.randomUUID(),
              animal: result.animal!,
              category: result.category as "harmful" | "safe",
              confidence: result.confidence,
              timestamp: new Date(),
            },
            ...prev.slice(0, 49),
          ]);
        }
      } else {
        lastDetectionRef.current = null;
      }

      return result;
    } catch (e) {
      console.error("Analysis failed:", e);
      return { detected: false, animal: null, category: "none", confidence: 0 };
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const clearLogs = useCallback(() => setLogs([]), []);

  return { currentDetection, logs, isAnalyzing, analyze, clearLogs };
}
