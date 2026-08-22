import { mountFloatingLines } from './FloatingLines.js';

const root = document.getElementById('gradient-waves-root');
if (root) {
  mountFloatingLines(root, {
    enabledWaves: ['top', 'middle', 'bottom'],
    lineCount: [8, 12, 18],
    lineDistance: [9, 7, 5],
    animationSpeed: 0.8,
    interactive: true,
    bendRadius: 5.0,
    bendStrength: -0.6,
    mouseDamping: 0.06,
    parallax: true,
    parallaxStrength: 0.16,
    mixBlendMode: 'screen',
    linesGradient: ['#ffd21c', '#63e0b5', '#28c89a', '#ff9f43', '#f4fff9']
  });
}
