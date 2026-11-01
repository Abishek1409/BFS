import { mountGradientWaves } from './GradientWaves.js';

const root = document.getElementById('gradient-waves-root');
if (root) {
  mountGradientWaves(root, {
    horizonColor: '#000000',
    waveColor: '#241913', // mocha deep
    crestColor: '#6f4e37', // mocha
    speed: 0.35,
    amplitude: 2.5,
    waveScale: 0.6,
    waveRatio: 0.9,
    swell: 35,
    turbulence: 20,
    tilt: 1.11,
    zoom: 1.0,
    height: 5.5,
    fogDepth: 15,
    detail: 'medium',
    brightness: 0.35,
    opacity: 0.35,
    mouseInteraction: false,
    grain: true,
    grainIntensity: 0.04,
  });
}
