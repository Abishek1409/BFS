// Damped orbit/pan/zoom with limits, animated reset and idle drift (Req 4.4, 12.2, 13).
// Deep drei imports keep unused modules (hls.js, MediaPipe) out of the bundle (Req 17.5).
import { CameraControls } from '@react-three/drei/core/CameraControls.js';
import { useFrame } from '@react-three/fiber';
import { useEffect, useRef, type RefObject } from 'react';
import { Box3, MathUtils, Vector3 } from 'three';
import { SHOP_LAYOUT } from '../lib/layout.ts';
import type { ViewMode } from '../lib/types.ts';

/** Starting isometric view framing all tables and counters (distance ≈ 19.8, polar ≈ 41°). */
export const START_POSITION = [0, 15, 13] as const;
export const START_TARGET = [0, 0, 0.4] as const;

const IDLE_MS = 10_000;
const DRIFT_X = 0.4;          // √(0.4² + 0.2²) ≈ 0.45 ≤ 0.5 world units
const DRIFT_Z = 0.2;

interface CameraRigProps {
  view: ViewMode;
  reduced: boolean;
  resetRef: RefObject<(() => void) | null>;
}

export function CameraRig({ view, reduced, resetRef }: CameraRigProps) {
  const ref = useRef<CameraControls>(null);
  const idle = useRef({ last: performance.now(), start: 0, base: null as null | { p: Vector3; t: Vector3 } });
  const enabled = view !== 'billing_focus';

  const markInput = () => {
    idle.current.last = performance.now();
    idle.current.base = null;
  };

  // Start view, pan bounds and the saved state used by reset().
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    c.setLookAt(...START_POSITION, ...START_TARGET, false);
    const b = SHOP_LAYOUT.bounds;
    c.setBoundary(new Box3(new Vector3(b.minX, 0, b.minZ), new Vector3(b.maxX, 0, b.maxZ)));
    c.saveState();
  }, []);

  // Coming back from Billing_Focus restarts the idle timer.
  useEffect(markInput, [enabled]);

  useEffect(() => {
    resetRef.current = () => {
      markInput();
      ref.current?.reset(!reduced);   // smoothTime 0.25 → about 800 ms
    };
    return () => { resetRef.current = null; };
  }, [reduced, resetRef]);

  useFrame(() => {
    const c = ref.current;
    if (!c || !enabled || reduced) return;
    const now = performance.now();
    const s = idle.current;
    if (now - s.last < IDLE_MS) return;
    if (!s.base) {
      s.base = { p: c.getPosition(new Vector3()), t: c.getTarget(new Vector3()) };
      s.start = now;
    }
    const sec = (now - s.start) / 1000;
    const dx = DRIFT_X * Math.sin(sec / 8);
    const dz = DRIFT_Z * Math.sin(sec / 11);
    const { p, t } = s.base;
    c.setLookAt(p.x + dx, p.y, p.z + dz, t.x + dx, t.y, t.z + dz, false);
  });

  return (
    <CameraControls
      ref={ref}
      makeDefault
      enabled={enabled}
      minDistance={6}
      maxDistance={22}
      minPolarAngle={MathUtils.degToRad(20)}
      maxPolarAngle={MathUtils.degToRad(65)}
      smoothTime={0.25}
      draggingSmoothTime={0.12}
      onControlStart={markInput}
      onControl={markInput}
    />
  );
}
