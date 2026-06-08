import { useEffect, useRef, useCallback, useState } from "react";
import { Camera, CameraOff, Radio } from "lucide-react";
import { useCamera } from "@/hooks/useCamera";
import { useAlarm } from "@/hooks/useAlarm";
import { useAnimalDetection } from "@/hooks/useAnimalDetection";
import { useNightMode } from "@/hooks/useNightMode";
import { useGeoLocation } from "@/hooks/useGeoLocation";
import { CameraView } from "@/components/CameraView";
import { StatusBadge } from "@/components/StatusBadge";
import { DetectionLog } from "@/components/DetectionLog";
import { GeoFencePanel } from "@/components/GeoFencePanel";
import { AnalyticsPanel } from "@/components/AnalyticsPanel";

const SCAN_INTERVAL = 5000;

const Index = () => {
  const { videoRef, canvasRef, isActive, error, startCamera, stopCamera, captureFrame } = useCamera();
  const { initAudio, startAlarm, stopAlarm } = useAlarm();
  const { currentDetection, logs, isAnalyzing, analyze, clearLogs } = useAnimalDetection();
  const { isNightMode, detectBrightness, enhanceNightImage } = useNightMode();
  const { location, locationError, zones, isInsideGeoFence, addZone, removeZone } = useGeoLocation();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const runDetection = useCallback(async () => {
    const frame = captureFrame();
    if (!frame || !canvasRef.current) return;

    // Detect night mode from canvas brightness
    const nightDetected = detectBrightness(canvasRef.current);

    // If night mode, enhance the image before sending
    let imageToSend = frame;
    if (nightDetected && canvasRef.current) {
      // Re-draw original frame first for enhancement
      const video = videoRef.current;
      if (video) {
        const ctx = canvasRef.current.getContext("2d");
        if (ctx) ctx.drawImage(video, 0, 0);
      }
      imageToSend = enhanceNightImage(canvasRef.current);
    }

    const result = await analyze(imageToSend, nightDetected, location, isInsideGeoFence);

    if (result.riskLevel === "high") {
      startAlarm("high");
    } else if (result.riskLevel === "medium") {
      startAlarm("medium");
    } else {
      stopAlarm();
    }
  }, [captureFrame, canvasRef, videoRef, detectBrightness, enhanceNightImage, analyze, location, isInsideGeoFence, startAlarm, stopAlarm]);

  const startMonitoring = useCallback(async () => {
    initAudio(); // Initialize AudioContext on user gesture
    await startCamera();
    setIsMonitoring(true);
  }, [startCamera, initAudio]);

  const stopMonitoring = useCallback(() => {
    stopCamera();
    stopAlarm();
    setIsMonitoring(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [stopCamera, stopAlarm]);

  useEffect(() => {
    if (isActive && isMonitoring) {
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
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Radio className="h-5 w-5 text-primary" />
            <h1 className="font-mono text-sm font-bold uppercase tracking-[0.2em] text-primary">
              Wildlife Sentinel
            </h1>
          </div>
          <div className="flex items-center gap-4 font-mono text-[10px] text-muted-foreground">
            {isNightMode && isActive && (
              <span className="rounded bg-primary/20 px-2 py-0.5 text-primary">NIGHT MODE</span>
            )}
            {location && (
              <span className="hidden sm:inline">
                📍 {location.lat.toFixed(2)}, {location.lng.toFixed(2)}
              </span>
            )}
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${isActive ? "bg-safe" : "bg-muted-foreground"}`} />
              {isActive ? "SYSTEM ACTIVE" : "STANDBY"}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto flex w-full max-w-7xl flex-1 gap-4 p-4 lg:p-6">
        {/* Left: Camera + Status */}
        <div className="flex flex-1 flex-col gap-4">
          <CameraView ref={videoRef} isActive={isActive} riskLevel={currentDetection.riskLevel} isNightMode={isNightMode && isActive} />
          <canvas ref={canvasRef} className="hidden" />

          <StatusBadge
            riskLevel={currentDetection.riskLevel}
            animal={currentDetection.animal}
            confidence={currentDetection.confidence}
            estimatedDistance={currentDetection.estimatedDistance}
            isAnalyzing={isAnalyzing}
            isNightMode={isNightMode && isActive}
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

          {/* Test Alarm Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => { initAudio(); startAlarm("high"); }}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-danger/50 bg-danger/10 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-danger transition-all hover:bg-danger/20"
            >
              🔊 Test High Alarm
            </button>
            <button
              onClick={() => { initAudio(); startAlarm("medium"); }}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-warning/50 bg-warning/10 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-warning transition-all hover:bg-warning/20"
            >
              🔔 Test Medium Alarm
            </button>
            <button
              onClick={() => stopAlarm()}
              className="flex items-center justify-center gap-2 rounded-lg border border-border bg-secondary px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition-all hover:bg-muted"
            >
              🔇 Stop
            </button>
          </div>

          {error && (
            <p className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-2 font-mono text-xs text-danger">
              {error}
            </p>
          )}
        </div>

        {/* Right: Panels */}
        <div className="hidden w-80 flex-shrink-0 space-y-4 lg:block">
          <DetectionLog logs={logs} onClear={clearLogs} />
          <GeoFencePanel
            zones={zones}
            location={location}
            locationError={locationError}
            onAddZone={addZone}
            onRemoveZone={removeZone}
          />
          <AnalyticsPanel />
        </div>
      </main>

      {/* Mobile panels */}
      <div className="space-y-4 border-t border-border p-4 lg:hidden">
        <DetectionLog logs={logs} onClear={clearLogs} />
        <GeoFencePanel
          zones={zones}
          location={location}
          locationError={locationError}
          onAddZone={addZone}
          onRemoveZone={removeZone}
        />
        <AnalyticsPanel />
      </div>
    </div>
  );
};

export default Index;
