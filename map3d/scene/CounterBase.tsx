// Shared counter body: cabinet, top slab and gold front trim, positioned from SHOP_LAYOUT.
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
  return (
    <group position={[slot.position[0], 0, slot.position[1]]}>
      <mesh position={[0, (h - 0.06) / 2, 0]} material={m.counter}>
        <boxGeometry args={[w, h - 0.06, d]} />
      </mesh>
      <mesh position={[0, h - 0.03, 0]} material={m.wood}>
        <boxGeometry args={[w + 0.08, 0.06, d + 0.08]} />
      </mesh>
      <mesh position={[0, h * 0.75, d / 2 + 0.005]} material={m.trim}>
        <boxGeometry args={[w * 0.96, 0.04, 0.01]} />
      </mesh>
      <group position={[0, h, 0]}>{children}</group>
    </group>
  );
}
