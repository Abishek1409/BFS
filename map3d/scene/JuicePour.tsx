// Juice stream from the spout and a filling glass, mounted while any order is preparing (Req 4.2).
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Mesh } from 'three';
import { useMaterials } from './materials.ts';

const CYCLE_S = 3;

interface JuicePourProps { top: number; bottom: number; glassH: number; reduced: boolean; }

export function JuicePour({ top, bottom, glassH, reduced }: JuicePourProps) {
  const m = useMaterials();
  const stream = useRef<Mesh>(null);
  const fill = useRef<Mesh>(null);
  const len = top - bottom;

  useFrame(({ clock }) => {
    const s = stream.current;
    const f = fill.current;
    if (!s || !f) return;
    // 0→1 over the cycle: stream wobbles, glass fills to 85 % then restarts.
    const t = reduced ? 0.6 : (clock.elapsedTime % CYCLE_S) / CYCLE_S;
    s.scale.x = s.scale.z = 1 + (reduced ? 0 : Math.sin(clock.elapsedTime * 18) * 0.15);
    const level = Math.max(0.02, t * 0.85);
    f.scale.y = level;
    f.position.y = bottom + (glassH * level) / 2;
  });

  return (
    <group>
      <mesh ref={stream} position={[0, bottom + len / 2, 0]} material={m.juice}>
        <cylinderGeometry args={[0.015, 0.02, len, 6]} />
      </mesh>
      <mesh ref={fill} material={m.juice}>
        <cylinderGeometry args={[0.062, 0.05, glassH, 8]} />
      </mesh>
    </group>
  );
}
