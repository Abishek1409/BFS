// Expanding gold ring at a table for 1.5 s after a new order arrives (Req 14.4). No audio.
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Mesh } from 'three';
import { PULSE_MS } from '../lib/events.ts';
import { useMaterials } from './materials.ts';

/** `at` is the pulse start (epoch ms) from the store, so a remount mid-pulse continues in place. */
export function OrderPulse({ at, radius }: { at: number; radius: number }) {
  const m = useMaterials();
  const material = useMemo(() => m.gold.clone(), [m]);
  const ref = useRef<Mesh>(null);

  useFrame(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const t = (Date.now() - at) / PULSE_MS;
    mesh.visible = t >= 0 && t < 1;
    if (!mesh.visible) return;
    mesh.scale.setScalar(1 + 2 * t);           // 1 → 3
    material.opacity = 1 - t;
  });

  return (
    <mesh ref={ref} position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} material={material} visible={false}>
      <ringGeometry args={[radius * 0.9, radius, 64]} />
    </mesh>
  );
}
