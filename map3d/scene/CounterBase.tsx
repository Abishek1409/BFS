// Shared counter body: rounded cabinet with door panels, stone top, gold trim and a kick plate.
import { RoundedBox } from '@react-three/drei/core/RoundedBox.js';
import type { ReactNode } from 'react';
import type { CounterSlot } from '../lib/layout.ts';
import { SHOP_LAYOUT } from '../lib/layout.ts';
import { useMaterials } from './materials.ts';

export function counterSlot(id: CounterSlot['id']): CounterSlot {
  return SHOP_LAYOUT.counters.find(c => c.id === id)!;
}

/** Children are placed in counter-local space with y = 0 at the counter top. */
export function CounterBase({ slot, children }: { slot: CounterSlot; children?: ReactNode }) {
  const m = useMaterials();
  const [w, d] = slot.size;
  const h = slot.height;
  const body = h - 0.06;
  const doors = Math.max(2, Math.round(w / 0.8));
  const doorW = (w - 0.12) / doors;
  return (
    <group position={[slot.position[0], 0, slot.position[1]]}>
      <mesh position={[0, 0.04, 0]} material={m.woodDark} receiveShadow>
        <boxGeometry args={[w - 0.06, 0.08, d - 0.06]} />
      </mesh>
      <RoundedBox args={[w, body - 0.08, d]} radius={0.03} smoothness={3} position={[0, 0.08 + (body - 0.08) / 2, 0]}
        material={m.counter} castShadow receiveShadow />
      {/* door panels with handles on both long faces */}
      {[-1, 1].map(s => Array.from({ length: doors }, (_, i) => {
        const x = -w / 2 + 0.06 + doorW * (i + 0.5);
        return (
          <group key={`${s}-${i}`} position={[x, 0.08 + (body - 0.08) * 0.45, s * (d / 2 + 0.006)]}>
            <mesh material={m.counter}>
              <boxGeometry args={[doorW - 0.06, (body - 0.08) * 0.62, 0.012]} />
            </mesh>
            <mesh position={[doorW * 0.32, 0.05, s * 0.012]} material={m.trim}>
              <boxGeometry args={[0.02, 0.12, 0.02]} />
            </mesh>
          </group>
        );
      }))}
      <mesh position={[0, h * 0.86, d / 2 + 0.012]} material={m.trim}>
        <boxGeometry args={[w * 0.98, 0.025, 0.01]} />
      </mesh>
      <RoundedBox args={[w + 0.1, 0.06, d + 0.1]} radius={0.02} smoothness={3} position={[0, h - 0.03, 0]}
        material={m.stone} castShadow receiveShadow />
      <group position={[0, h, 0]}>{children}</group>
    </group>
  );
}
