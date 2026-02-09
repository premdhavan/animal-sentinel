import { useState, useCallback } from "react";

export function useNightMode() {
  const [isNightMode, setIsNightMode] = useState(false);

  const detectBrightness = useCallback((canvas: HTMLCanvasElement): boolean => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return false;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    let totalBrightness = 0;
    const pixelCount = data.length / 4;
    // Sample every 10th pixel for performance
    const step = 10;
    let sampled = 0;

    for (let i = 0; i < data.length; i += 4 * step) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      totalBrightness += (r * 0.299 + g * 0.587 + b * 0.114);
      sampled++;
    }

    const avgBrightness = totalBrightness / sampled;
    const nightDetected = avgBrightness < 60; // threshold for low-light
    setIsNightMode(nightDetected);
    return nightDetected;
  }, []);

  const enhanceNightImage = useCallback((canvas: HTMLCanvasElement): string => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return canvas.toDataURL("image/jpeg", 0.6);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Increase brightness and contrast for night vision effect
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, data[i] * 2.5);     // R
      data[i + 1] = Math.min(255, data[i + 1] * 2.8); // G (boost green for IR look)
      data[i + 2] = Math.min(255, data[i + 2] * 2.0); // B
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.6);
  }, []);

  return { isNightMode, detectBrightness, enhanceNightImage };
}
