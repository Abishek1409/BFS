import { mountDarkVeil } from './DarkVeil.js';

const root = document.getElementById('gradient-waves-root');
if (root) {
  mountDarkVeil(root, {
    hueShift: 140, // Shifts the color profile to a dark neon green/emerald gradient
    noiseIntensity: 0.03, // Delicate grain/noise texture
    scanlineIntensity: 0.06, // High-end subtle scanline texture
    speed: 0.15, // Smooth, slow, fluid animation pace
    scanlineFrequency: 900.0, // Frequency of the CRT lines
    warpAmount: 0.05, // Slight ripple distortion
    resolutionScale: 0.75 // Optimized scaling for crispness and performance
  });
}
