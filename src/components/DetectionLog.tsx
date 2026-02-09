import { Trash2, Ruler } from "lucide-react";
import type { DetectionLog as LogEntry } from "@/hooks/useAnimalDetection";

interface DetectionLogProps {
  logs: LogEntry[];
  onClear: () => void;
}

const riskColors: Record<string, string> = {
  high: "bg-danger/10 text-danger",
  medium: "bg-warning/10 text-warning",
  low: "bg-safe/10 text-safe",
};

export function DetectionLog({ logs, onClear }: DetectionLogProps) {
  return (
    <div className="flex flex-col rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-border bg-secondary px-4 py-2">
        <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-primary">
          Detection Log
        </h3>
        {logs.length > 0 && (
          <button onClick={onClear} className="text-muted-foreground hover:text-danger transition-colors">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div className="max-h-64 overflow-y-auto p-2 space-y-1">
        {logs.length === 0 ? (
          <p className="px-2 py-4 text-center font-mono text-xs text-muted-foreground">
            No detections yet...
          </p>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className={`flex items-center justify-between rounded px-3 py-1.5 font-mono text-xs ${riskColors[log.riskLevel] || ""}`}
            >
              <div>
                <span className="font-semibold uppercase">{log.animal}</span>
                <span className="ml-1 text-[10px] uppercase opacity-60">[{log.riskLevel}]</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] opacity-70">
                {log.estimatedDistance && (
                  <span className="inline-flex items-center gap-0.5"><Ruler className="h-2.5 w-2.5" />{log.estimatedDistance}</span>
                )}
                <span>{log.timestamp.toLocaleTimeString()} • {log.confidence}%</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
