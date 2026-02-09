import { forwardRef } from "react";

interface CameraViewProps {
  isActive: boolean;
  category: "harmful" | "safe" | "none";
}

export const CameraView = forwardRef<HTMLVideoElement, CameraViewProps>(
  ({ isActive, category }, ref) => {
    const borderColor =
      category === "harmful"
        ? "border-danger shadow-[0_0_30px_hsl(var(--danger)/0.4)]"
        : category === "safe"
        ? "border-safe shadow-[0_0_30px_hsl(var(--safe)/0.2)]"
        : "border-border";

    return (
      <div className={`relative overflow-hidden rounded-lg border-2 ${borderColor} transition-all duration-300`}>
        <video
          ref={ref}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover bg-secondary"
          style={{ minHeight: 320 }}
        />
        {/* Scanline overlay */}
        {isActive && (
          <div className="pointer-events-none absolute inset-0">
            <div className="animate-scanline absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          </div>
        )}
        {/* Corner brackets */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-2 top-2 h-6 w-6 border-l-2 border-t-2 border-primary/50" />
          <div className="absolute right-2 top-2 h-6 w-6 border-r-2 border-t-2 border-primary/50" />
          <div className="absolute bottom-2 left-2 h-6 w-6 border-b-2 border-l-2 border-primary/50" />
          <div className="absolute bottom-2 right-2 h-6 w-6 border-b-2 border-r-2 border-primary/50" />
        </div>
        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <p className="font-mono text-sm text-muted-foreground animate-blink">
              CAMERA OFFLINE
            </p>
          </div>
        )}
        {/* REC indicator */}
        {isActive && (
          <div className="absolute right-4 top-4 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-danger animate-blink" />
            <span className="font-mono text-[10px] font-bold text-danger">REC</span>
          </div>
        )}
      </div>
    );
  }
);

CameraView.displayName = "CameraView";
