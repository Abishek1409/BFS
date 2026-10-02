import { mountFloatingLines } from './FloatingLines.js';

const root = document.getElementById('gradient-waves-root');
if (root) {
  mountFloatingLines(root, {
    enabledWaves: ['top', 'middle', 'bottom'],
    lineCount: [3, 4, 5],
    lineDistance: [9, 7, 5],
    animationSpeed: 0.45,
    interactive: false,
    bendRadius: 5.0,
    bendStrength: -0.6,
    mouseDamping: 0.06,
    parallax: false,
    parallaxStrength: 0.16,
    mixBlendMode: 'normal',
    maxDpr: 1,
    frameRate: 20,
    linesGradient: ['#b88935', '#8d641f', '#5e4216', '#c1933b', '#e4c36b']
  });
}
