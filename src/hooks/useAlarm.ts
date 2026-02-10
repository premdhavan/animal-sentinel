import { useRef, useCallback } from "react";
import type { RiskLevel } from "./useAnimalDetection";

export function useAlarm() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const isPlayingRef = useRef(false);
  const currentLevelRef = useRef<RiskLevel>("none");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Call this on a user gesture (e.g. Start Monitoring button click)
  const initAudio = useCallback(() => {
    if (!audioContextRef.current || audioContextRef.current.state === "closed") {
      audioContextRef.current = new AudioContext();
    }
    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }
  }, []);

  const stopAlarm = useCallback(() => {
    isPlayingRef.current = false;
    currentLevelRef.current = "none";
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (oscillatorRef.current) {
      try { oscillatorRef.current.stop(); } catch {}
      oscillatorRef.current = null;
    }
    if (gainRef.current) {
      gainRef.current.disconnect();
      gainRef.current = null;
    }
  }, []);

  const startAlarm = useCallback((level: RiskLevel) => {
    if (level === "low" || level === "none") {
      stopAlarm();
      return;
    }

    if (isPlayingRef.current && currentLevelRef.current === level) return;
    if (isPlayingRef.current) stopAlarm();

    // Ensure AudioContext is ready (should already be from initAudio)
    if (!audioContextRef.current || audioContextRef.current.state === "closed") {
      audioContextRef.current = new AudioContext();
    }
    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }

    const ctx = audioContextRef.current;
    isPlayingRef.current = true;
    currentLevelRef.current = level;

    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gainRef.current = gain;

    const osc = ctx.createOscillator();
    osc.connect(gain);
    osc.start();
    oscillatorRef.current = osc;

    if (level === "high") {
      gain.gain.value = 0.8;
      osc.type = "sawtooth";
      osc.frequency.value = 440;
      const sweep = () => {
        if (!isPlayingRef.current || !oscillatorRef.current) return;
        const now = ctx.currentTime;
        oscillatorRef.current.frequency.setValueAtTime(440, now);
        oscillatorRef.current.frequency.linearRampToValueAtTime(880, now + 0.5);
        oscillatorRef.current.frequency.linearRampToValueAtTime(440, now + 1);
      };
      sweep();
      intervalRef.current = setInterval(sweep, 1000);
    } else if (level === "medium") {
      gain.gain.value = 0.4;
      osc.type = "square";
      osc.frequency.value = 600;
      const beep = () => {
        if (!isPlayingRef.current || !gainRef.current) return;
        const now = ctx.currentTime;
        gainRef.current.gain.setValueAtTime(0.4, now);
        gainRef.current.gain.setValueAtTime(0, now + 0.3);
        gainRef.current.gain.setValueAtTime(0.4, now + 1.2);
        gainRef.current.gain.setValueAtTime(0, now + 1.5);
      };
      beep();
      intervalRef.current = setInterval(beep, 2400);
    }
  }, [stopAlarm]);

  return { initAudio, startAlarm, stopAlarm };
}
