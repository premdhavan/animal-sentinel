import { useRef, useCallback } from "react";

export function useAlarm() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const isPlayingRef = useRef(false);

  const startAlarm = useCallback(() => {
    if (isPlayingRef.current) return;
    isPlayingRef.current = true;

    const ctx = new AudioContext();
    audioContextRef.current = ctx;

    const gain = ctx.createGain();
    gain.gain.value = 0.8;
    gain.connect(ctx.destination);
    gainRef.current = gain;

    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = 440;
    osc.connect(gain);
    osc.start();
    oscillatorRef.current = osc;

    // Siren effect: sweep frequency up and down
    const sweep = () => {
      if (!isPlayingRef.current || !oscillatorRef.current) return;
      const now = ctx.currentTime;
      oscillatorRef.current.frequency.setValueAtTime(440, now);
      oscillatorRef.current.frequency.linearRampToValueAtTime(880, now + 0.5);
      oscillatorRef.current.frequency.linearRampToValueAtTime(440, now + 1);
      setTimeout(sweep, 1000);
    };
    sweep();
  }, []);

  const stopAlarm = useCallback(() => {
    isPlayingRef.current = false;
    if (oscillatorRef.current) {
      try { oscillatorRef.current.stop(); } catch {}
      oscillatorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  return { startAlarm, stopAlarm };
}
