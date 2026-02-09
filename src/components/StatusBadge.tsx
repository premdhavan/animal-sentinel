import { Shield, ShieldAlert, ShieldCheck, Scan } from "lucide-react";

interface StatusBadgeProps {
  category: "harmful" | "safe" | "none";
  animal: string | null;
  confidence: number;
  isAnalyzing: boolean;
}

export function StatusBadge({ category, animal, confidence, isAnalyzing }: StatusBadgeProps) {
  if (isAnalyzing) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary px-5 py-3 font-mono">
        <Scan className="h-5 w-5 text-primary animate-pulse" />
        <span className="text-sm text-muted-foreground">SCANNING...</span>
      </div>
    );
  }

  if (category === "harmful") {
    return (
      <div className="animate-pulse-danger flex items-center gap-3 rounded-lg border-2 border-danger bg-danger/20 px-5 py-3 font-mono">
        <ShieldAlert className="h-6 w-6 text-danger" />
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-danger">
            ⚠ DANGER! HARMFUL ANIMAL DETECTED
          </p>
          <p className="text-xs text-danger/80">
            {animal?.toUpperCase()} — Confidence: {confidence}%
          </p>
        </div>
      </div>
    );
  }

  if (category === "safe") {
    return (
      <div className="flex items-center gap-3 rounded-lg border-2 border-safe bg-safe/10 px-5 py-3 font-mono animate-pulse-safe">
        <ShieldCheck className="h-6 w-6 text-safe" />
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-safe">
            ✓ SAFE ANIMAL DETECTED
          </p>
          <p className="text-xs text-safe/80">
            {animal?.toUpperCase()} — Confidence: {confidence}%
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary px-5 py-3 font-mono">
      <Shield className="h-5 w-5 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">NO ANIMAL DETECTED</span>
    </div>
  );
}
