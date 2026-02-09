import { useEffect, useRef, useCallback, useState } from "react";
import { Camera, CameraOff, Radio } from "lucide-react";
import { useCamera } from "@/hooks/useCamera";
import { useAlarm } from "@/hooks/useAlarm";
import { useAnimalDetection } from "@/hooks/useAnimalDetection";
import { CameraView } from "@/components/CameraView";
import { StatusBadge } from "@/components/StatusBadge";
import { DetectionLog } from "@/components/DetectionLog";

const SCAN_INTERVAL = 5000; // 5 seconds between scans

const Index = () => {
  const { videoRef, canvasRef, isActive, error, startCamera, stopCamera, captureFrame } = useCamera();
  const { startAlarm, stopAlarm } = useAlarm();
  const { currentDetection, logs, isAnalyzing, analyze, clearLogs } = useAnimalDetection();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const runDetection = useCallback(async () => {
    const frame = captureFrame();
    if (!frame) return;
    const result = await analyze(frame);
    if (result.category === "harmful") {
      startAlarm();
    } else {
      stopAlarm();
    }
  }, [captureFrame, analyze, startAlarm, stopAlarm]);

  const startMonitoring = useCallback(async () => {
    await startCamera();
    setIsMonitoring(true);
  }, [startCamera]);

  const stopMonitoring = useCallback(() => {
    stopCamera();
    stopAlarm();
    setIsMonitoring(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [stopCamera, stopAlarm]);

  // Start scanning loop when camera is active
  useEffect(() => {
    if (isActive && isMonitoring) {
      // Initial scan after short delay for camera to warm up
      const timeout = setTimeout(() => {
        runDetection();
        intervalRef.current = setInterval(runDetection, SCAN_INTERVAL);
      }, 1500);
      return () => {
        clearTimeout(timeout);
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [isActive, isMonitoring, runDetection]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-secondary px-6 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Radio className="h-5 w-5 text-primary" />
            <h1 className="font-mono text-sm font-bold uppercase tracking-[0.2em] text-primary">
              Wildlife Sentinel
            </h1>
          </div>
          <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
            <span className={`h-2 w-2 rounded-full ${isActive ? "bg-safe" : "bg-muted-foreground"}`} />
            {isActive ? "SYSTEM ACTIVE" : "STANDBY"}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto flex w-full max-w-6xl flex-1 gap-4 p-4 lg:p-6">
        {/* Left: Camera + Status */}
        <div className="flex flex-1 flex-col gap-4">
          <CameraView ref={videoRef} isActive={isActive} category={currentDetection.category} />
          <canvas ref={canvasRef} className="hidden" />

          {/* Status */}
          <StatusBadge
            category={currentDetection.category}
            animal={currentDetection.animal}
            confidence={currentDetection.confidence}
            isAnalyzing={isAnalyzing}
          />

          {/* Controls */}
          <div className="flex gap-3">
            {!isMonitoring ? (
              <button
                onClick={startMonitoring}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-mono text-xs font-bold uppercase tracking-widest text-primary-foreground transition-all hover:brightness-110"
              >
                <Camera className="h-4 w-4" />
                Start Monitoring
              </button>
            ) : (
              <button
                onClick={stopMonitoring}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-danger px-4 py-3 font-mono text-xs font-bold uppercase tracking-widest text-danger-foreground transition-all hover:brightness-110"
              >
                <CameraOff className="h-4 w-4" />
                Stop Monitoring
              </button>
            )}
          </div>

          {error && (
            <p className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-2 font-mono text-xs text-danger">
              {error}
            </p>
          )}
        </div>

        {/* Right: Detection Log */}
        <div className="hidden w-72 flex-shrink-0 lg:block">
          <DetectionLog logs={logs} onClear={clearLogs} />
        </div>
      </main>

      {/* Mobile log */}
      <div className="border-t border-border p-4 lg:hidden">
        <DetectionLog logs={logs} onClear={clearLogs} />
      </div>
    </div>
  );
};

export default Index;
