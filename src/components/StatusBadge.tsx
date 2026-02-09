import { Shield, ShieldAlert, ShieldCheck, Scan, AlertTriangle, Ruler } from "lucide-react";
import type { RiskLevel } from "@/hooks/useAnimalDetection";

interface StatusBadgeProps {
  riskLevel: RiskLevel;
  animal: string | null;
  confidence: number;
  estimatedDistance: string | null;
  isAnalyzing: boolean;
  isNightMode: boolean;
}

export function StatusBadge({ riskLevel, animal, confidence, estimatedDistance, isAnalyzing, isNightMode }: StatusBadgeProps) {
  if (isAnalyzing) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary px-5 py-3 font-mono">
        <Scan className="h-5 w-5 text-primary animate-pulse" />
        <span className="text-sm text-muted-foreground">SCANNING...{isNightMode ? " (NIGHT MODE)" : ""}</span>
      </div>
    );
  }

  const distanceTag = estimatedDistance && (
    <span className="ml-2 inline-flex items-center gap-1 text-[10px] opacity-70">
      <Ruler className="h-3 w-3" /> {estimatedDistance}
    </span>
  );

  if (riskLevel === "high") {
    return (
      <div className="animate-pulse-danger flex items-center gap-3 rounded-lg border-2 border-danger bg-danger/20 px-5 py-3 font-mono">
        <ShieldAlert className="h-6 w-6 text-danger" />
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-danger">
            ⚠ DANGER! HIGH RISK ANIMAL
          </p>
          <p className="text-xs text-danger/80">
            {animal?.toUpperCase()} — Confidence: {confidence}%{distanceTag}
          </p>
        </div>
      </div>
    );
  }

  if (riskLevel === "medium") {
    return (
      <div className="flex items-center gap-3 rounded-lg border-2 border-warning bg-warning/10 px-5 py-3 font-mono">
        <AlertTriangle className="h-6 w-6 text-warning" />
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-warning">
            ⚡ WARNING — MEDIUM RISK
          </p>
          <p className="text-xs text-warning/80">
            {animal?.toUpperCase()} — Confidence: {confidence}%{distanceTag}
          </p>
        </div>
      </div>
    );
  }

  if (riskLevel === "low") {
    return (
      <div className="flex items-center gap-3 rounded-lg border-2 border-safe bg-safe/10 px-5 py-3 font-mono animate-pulse-safe">
        <ShieldCheck className="h-6 w-6 text-safe" />
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-safe">
            ✓ LOW RISK — SAFE ANIMAL
          </p>
          <p className="text-xs text-safe/80">
            {animal?.toUpperCase()} — Confidence: {confidence}%{distanceTag}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary px-5 py-3 font-mono">
      <Shield className="h-5 w-5 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">NO ANIMAL DETECTED{isNightMode ? " (NIGHT MODE)" : ""}</span>
    </div>
  );
}
