import { useRef, useCallback } from "react";
import type { RiskLevel } from "./useAnimalDetection";

export function useAlarm() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const isPlayingRef = useRef(false);
  const currentLevelRef = useRef<RiskLevel>("none");

  const stopAlarm = useCallback(() => {
    isPlayingRef.current = false;
    currentLevelRef.current = "none";
    if (oscillatorRef.current) {
      try { oscillatorRef.current.stop(); } catch {}
      oscillatorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  const startAlarm = useCallback((level: RiskLevel) => {
    if (level === "low" || level === "none") {
      stopAlarm();
      return;
    }

    // If already playing the same level, skip
    if (isPlayingRef.current && currentLevelRef.current === level) return;

    // Stop existing before starting new
    if (isPlayingRef.current) stopAlarm();

    isPlayingRef.current = true;
    currentLevelRef.current = level;

    const ctx = new AudioContext();
    audioContextRef.current = ctx;

    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gainRef.current = gain;

    const osc = ctx.createOscillator();
    osc.connect(gain);
    osc.start();
    oscillatorRef.current = osc;

    if (level === "high") {
      // Loud continuous siren
      gain.gain.value = 0.8;
      osc.type = "sawtooth";
      osc.frequency.value = 440;
      const sweep = () => {
        if (!isPlayingRef.current || !oscillatorRef.current) return;
        const now = ctx.currentTime;
        oscillatorRef.current.frequency.setValueAtTime(440, now);
        oscillatorRef.current.frequency.linearRampToValueAtTime(880, now + 0.5);
        oscillatorRef.current.frequency.linearRampToValueAtTime(440, now + 1);
        setTimeout(sweep, 1000);
      };
      sweep();
    } else if (level === "medium") {
      // Slow warning beeps
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
        setTimeout(beep, 2400);
      };
      beep();
    }
  }, [stopAlarm]);

  return { startAlarm, stopAlarm };
}
