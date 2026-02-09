import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface HistoryEntry {
  animal: string;
  risk_level: string;
  confidence: number;
  estimated_distance: string | null;
  night_mode: boolean;
  created_at: string;
}

interface AnimalStat {
  animal: string;
  count: number;
  riskLevel: string;
}

export function AnalyticsPanel() {
  const [stats, setStats] = useState<AnimalStat[]>([]);
  const [recentHistory, setRecentHistory] = useState<HistoryEntry[]>([]);
  const [totalDetections, setTotalDetections] = useState(0);

  useEffect(() => {
    const fetchAnalytics = async () => {
      // Recent history
      const { data: history } = await supabase
        .from("detection_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (history) {
        setRecentHistory(history as HistoryEntry[]);
        setTotalDetections(history.length);

        // Aggregate stats
        const map = new Map<string, AnimalStat>();
        history.forEach((h: any) => {
          const key = h.animal.toLowerCase();
          const existing = map.get(key);
          if (existing) {
            existing.count++;
          } else {
            map.set(key, { animal: h.animal, count: 1, riskLevel: h.risk_level });
          }
        });
        setStats(Array.from(map.values()).sort((a, b) => b.count - a.count));
      }
    };
    fetchAnalytics();
  }, []);

  const riskColors: Record<string, string> = {
    high: "text-danger",
    medium: "text-warning",
    low: "text-safe",
  };

  return (
    <div className="flex flex-col rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border bg-secondary px-4 py-2">
        <BarChart3 className="h-3.5 w-3.5 text-primary" />
        <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-primary">
          Analytics
        </h3>
        <span className="ml-auto font-mono text-[10px] text-muted-foreground">
          {totalDetections} detections
        </span>
      </div>

      <div className="p-3 space-y-3">
        {/* Animal frequency */}
        {stats.length > 0 ? (
          <div className="space-y-1">
            {stats.slice(0, 6).map((s) => (
              <div key={s.animal} className="flex items-center justify-between font-mono text-xs">
                <span className={`font-semibold uppercase ${riskColors[s.riskLevel] || "text-foreground"}`}>
                  {s.animal}
                </span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 rounded-full bg-secondary" style={{ width: 60 }}>
                    <div
                      className={`h-full rounded-full ${s.riskLevel === "high" ? "bg-danger" : s.riskLevel === "medium" ? "bg-warning" : "bg-safe"}`}
                      style={{ width: `${Math.min(100, (s.count / (stats[0]?.count || 1)) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground w-4 text-right">{s.count}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-2 text-center font-mono text-[10px] text-muted-foreground">
            No analytics data yet
          </p>
        )}

        {/* Recent timeline */}
        {recentHistory.length > 0 && (
          <div className="max-h-28 space-y-0.5 overflow-y-auto border-t border-border pt-2">
            {recentHistory.slice(0, 8).map((h, i) => (
              <div key={i} className="flex items-center justify-between font-mono text-[10px] text-muted-foreground">
                <span className={riskColors[h.risk_level]}>
                  {h.animal} {h.night_mode ? "🌙" : ""}
                </span>
                <span>{new Date(h.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
