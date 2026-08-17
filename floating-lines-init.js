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
    linesGradient: ['#7AF7BE', '#3BD8A8', '#1CC6B7', '#5EA5FF', '#A679FF']
  });
}
